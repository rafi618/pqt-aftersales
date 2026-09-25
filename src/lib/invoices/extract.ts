import Anthropic from "@anthropic-ai/sdk";
import { CURRENCIES, VOUCHER_CATEGORIES } from "./config";
import { aiEnabled } from "@/lib/archive/classifier";

// Reads a voucher or invoice and pulls out the money details.
// With ANTHROPIC_API_KEY, Claude reads the PDF/photo; otherwise we only guess
// the category from the file name and staff fill in the amounts.

export interface Extracted {
  category: string;
  vendor: string | null;
  billedTo: string | null;
  number: string | null;
  description: string | null;
  date: string | null;
  currency: string | null;
  total: number | null;
  vatAmount: number | null;
  reason: string;
  by: "ai" | "rules";
}

const AI_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"]);

function norm(s: string) {
  return s.toLocaleLowerCase("tr").replace(/[_\-.]+/g, " ");
}

export function extractByRules(fileName: string, hint = ""): Extracted {
  const text = ` ${norm(fileName)} ${norm(hint)} `;
  let best: { id: string; len: number; kw: string } | null = null;
  for (const c of VOUCHER_CATEGORIES) {
    for (const kw of c.keywords) {
      const k = norm(kw);
      if (k.trim() && text.includes(k) && (!best || k.length > best.len)) best = { id: c.id, len: k.length, kw };
    }
  }
  // "1500TL", "250 usd", "99.90eur" in the file name
  const m = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(tl|try|usd|eur|gbp|\$|€|£)/);
  const curMap: Record<string, string> = { tl: "TRY", try: "TRY", usd: "USD", $: "USD", eur: "EUR", "€": "EUR", gbp: "GBP", "£": "GBP" };
  return {
    category: best?.id ?? "other",
    vendor: null,
    billedTo: null,
    number: null,
    description: fileName.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ").trim(),
    date: null,
    currency: m ? curMap[m[2]] : null,
    total: m ? Number(m[1].replace(",", ".")) : null,
    vatAmount: null,
    reason: best ? `File name contains "${best.kw}". Amounts must be checked by hand.` : "Could not read the file — please fill in the details.",
    by: "rules",
  };
}

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] };

const SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: VOUCHER_CATEGORIES.map((c) => c.id) },
    vendor: nullableString,
    billed_to: nullableString,
    number: nullableString,
    description: nullableString,
    date: nullableString,
    currency: { anyOf: [{ type: "string", enum: [...CURRENCIES] }, { type: "null" }] },
    total: nullableNumber,
    vat_amount: nullableNumber,
    reason: { type: "string" },
  },
  required: ["category", "vendor", "billed_to", "number", "description", "date", "currency", "total", "vat_amount", "reason"],
  additionalProperties: false,
};

const SYSTEM = `You read receipts, vouchers and invoices for Property Quest Turkey (PQT), an Istanbul real-estate agency serving foreign buyers.
Extract the money details exactly as printed. Documents are often Turkish: "Toplam"/"Genel Toplam" = total, "KDV" = VAT, "Fatura No" = invoice number, "Tarih" = date, "TL"/"₺" = TRY, "Dekont" = bank receipt, "Makbuz" = receipt.
- vendor: who issued the document. billed_to: who it is addressed to, if shown.
- date as YYYY-MM-DD. total = the final amount paid/payable including VAT.
- description: a short English summary of what was paid for (e.g. "Tapu harcı for flat A-12").
- category: pick from: ${VOUCHER_CATEGORIES.map((c) => `${c.id} (${c.label})`).join("; ")}.
- Use null for anything you cannot read. Never guess numbers.
- reason: one short sentence on what the document is.`;

let client: Anthropic | null = null;

async function extractWithClaude(fileName: string, mimeType: string, data: Buffer, hint: string): Promise<Extracted> {
  client ??= new Anthropic();
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (mimeType === "application/pdf") {
    content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: data.toString("base64") } });
  } else if (AI_MIME.has(mimeType)) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: data.toString("base64") },
    });
  }
  content.push({ type: "text", text: `File name: ${fileName}\n${hint ? `Note from uploader: ${hint}\n` : ""}Extract the details.` });

  const response = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new Error("Model declined");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No answer from model");
  const o = JSON.parse(text.text);
  return {
    category: o.category,
    vendor: o.vendor,
    billedTo: o.billed_to,
    number: o.number,
    description: o.description,
    date: o.date,
    currency: o.currency,
    total: o.total,
    vatAmount: o.vat_amount,
    reason: o.reason,
    by: "ai",
  };
}

export async function extractFinancial(fileName: string, mimeType: string, data: Buffer, hint = ""): Promise<Extracted> {
  if (aiEnabled() && data.length <= 20 * 1024 * 1024 && AI_MIME.has(mimeType)) {
    try {
      return await extractWithClaude(fileName, mimeType, data, hint);
    } catch (err) {
      console.error("AI extraction failed, using file name only:", err);
      const r = extractByRules(fileName, hint);
      r.reason += " (AI agent unavailable)";
      return r;
    }
  }
  return extractByRules(fileName, hint);
}
