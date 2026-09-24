import Anthropic from "@anthropic-ai/sdk";
import { ALL_CATEGORIES, SECTIONS, sectionOfCategory } from "./taxonomy";

// The sorting agent. Reads each uploaded file and decides where it belongs.
// With ANTHROPIC_API_KEY set, Claude reads the actual document (PDF or image).
// Without it — or if the call fails — a keyword sorter uses the file name.

export interface Classification {
  section: string;
  category: string;
  title: string;
  docDate: string | null;
  unitRef: string | null;
  confidence: number;
  reason: string;
  by: "ai" | "rules";
}

// Below this, the document goes to "Needs Review" instead of being filed.
const MIN_CONFIDENCE = 0.55;

const AI_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const AI_MAX_BYTES = 20 * 1024 * 1024;

function normalise(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ");
}

function prettyTitle(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyByRules(fileName: string, hint = ""): Classification {
  const text = ` ${normalise(fileName)} ${normalise(hint)} `;
  let best: { id: string; score: number; kw: string } | null = null;
  for (const cat of ALL_CATEGORIES) {
    for (const kw of cat.keywords) {
      const k = normalise(kw);
      if (k && text.includes(k)) {
        // longer, more specific keywords win; generic categories count half
        const score = cat.weak ? k.length / 2 : k.length;
        if (!best || score > best.score) best = { id: cat.id, score, kw };
      }
    }
  }
  if (!best) {
    return {
      section: "unsorted",
      category: "unsorted",
      title: prettyTitle(fileName),
      docDate: null,
      unitRef: null,
      confidence: 0,
      reason: "No keyword in the file name matched a category.",
      by: "rules",
    };
  }
  return {
    section: sectionOfCategory(best.id),
    category: best.id,
    title: prettyTitle(fileName),
    docDate: null,
    unitRef: null,
    confidence: Math.min(0.9, 0.6 + best.score / 40),
    reason: `File name contains "${best.kw}".`,
    by: "rules",
  };
}

const SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ALL_CATEGORIES.map((c) => c.id) },
    title: { type: "string" },
    doc_date: { anyOf: [{ type: "string" }, { type: "null" }] },
    unit_ref: { anyOf: [{ type: "string" }, { type: "null" }] },
    confidence: { type: "number" },
    reason: { type: "string" },
  },
  required: ["category", "title", "doc_date", "unit_ref", "confidence", "reason"],
  additionalProperties: false,
};

const SYSTEM = `You are the filing clerk for Property Quest Turkey (PQT), a real-estate agency in Istanbul that sells flats to foreign buyers, handles Turkish Citizenship by Investment (CBI), and manages properties after sale.
You receive one client document at a time and choose the single best category from this filing plan:

${SECTIONS.map(
  (s) =>
    `${s.label}:\n${s.categories.map((c) => `  - ${c.id}: ${c.label}`).join("\n")}`
).join("\n")}

Rules:
- Documents are often in Turkish. Tapu = title deed, Takyidat = encumbrance report, DAB / Döviz Alım Belgesi = foreign exchange certificate, Ekspertiz = valuation, Vekaletname = power of attorney, Uygunluk Belgesi = conformity letter, Aidat = building dues, Kira Sözleşmesi = rental agreement, Fatura = invoice, Dekont = bank receipt.
- title: a short, clear English title a staff member would recognise, e.g. "Tapu – Block A Flat 12" or "Commission invoice #2024-118".
- doc_date: the date printed on the document as YYYY-MM-DD, or null.
- unit_ref: the block/flat/unit the document is about (e.g. "A-12"), or null.
- confidence: 0 to 1. Use below 0.5 when you cannot read the document or it fits nothing well; in that case choose "unsorted".
- reason: one short sentence explaining what you saw.`;

let client: Anthropic | null = null;

async function classifyWithClaude(
  fileName: string,
  mimeType: string,
  data: Buffer,
  hint: string
): Promise<Classification> {
  client ??= new Anthropic();
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (mimeType === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: data.toString("base64") },
    });
  } else if (AI_MIME.has(mimeType)) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: data.toString("base64"),
      },
    });
  }
  content.push({
    type: "text",
    text: `File name: ${fileName}\n${hint ? `Uploader's note: ${hint}\n` : ""}${
      content.length === 0 ? "(The file's content could not be attached; judge from the file name.)\n" : ""
    }Classify this document.`,
  });

  const response = await client.beta.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  if (response.stop_reason === "refusal") throw new Error("Model declined");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("No answer from model");
  const out = JSON.parse(text.text) as {
    category: string;
    title: string;
    doc_date: string | null;
    unit_ref: string | null;
    confidence: number;
    reason: string;
  };
  return {
    section: sectionOfCategory(out.category),
    category: out.category,
    title: out.title || prettyTitle(fileName),
    docDate: out.doc_date,
    unitRef: out.unit_ref,
    confidence: Math.max(0, Math.min(1, out.confidence)),
    reason: out.reason,
    by: "ai",
  };
}

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function classifyDocument(
  fileName: string,
  mimeType: string,
  data: Buffer,
  hint = ""
): Promise<Classification> {
  let result: Classification;
  if (aiEnabled() && data.length <= AI_MAX_BYTES) {
    try {
      result = await classifyWithClaude(fileName, mimeType, data, hint);
    } catch (err) {
      console.error("AI classification failed, using keyword sorter:", err);
      result = classifyByRules(fileName, hint);
      result.reason += " (AI agent unavailable)";
    }
  } else {
    result = classifyByRules(fileName, hint);
  }
  if (result.confidence < MIN_CONFIDENCE && result.category !== "unsorted") {
    result.reason = `Low confidence — suggested "${result.category}". ${result.reason}`;
    result.section = "unsorted";
    result.category = "unsorted";
  }
  return result;
}
