import { prisma } from "@/lib/prisma";
import { audit, MAX_FILE_BYTES } from "@/lib/archive/service";
import { guessMime, sha256, writeArchiveFile } from "@/lib/archive/storage";
import { computeTotals, LineItem, todayISO, voucherCategoryLabel } from "./config";
import { extractFinancial } from "./extract";

type Db = Pick<typeof prisma, "counter">;

/** Atomically increments a named counter and returns the new value. */
export async function nextSeq(key: string, db: Db = prisma): Promise<number> {
  const c = await db.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return c.value;
}

export async function nextInvoiceNumber(issueDate: string, db: Db = prisma) {
  const year = (issueDate || todayISO()).slice(0, 4);
  const n = await nextSeq(`invoice-${year}`, db);
  return `PQT-INV-${year}-${String(n).padStart(4, "0")}`;
}

export function parseItems(json: string): LineItem[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function cleanItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i) => ({
      description: String(i?.description ?? "").trim(),
      quantity: Number(i?.quantity) || 0,
      unitPrice: Number(i?.unitPrice) || 0,
    }))
    .filter((i) => i.description || i.unitPrice);
}

export interface UploadResult {
  ok: boolean;
  fileName: string;
  id?: string;
  ref?: string;
  kind?: "voucher" | "invoice";
  summary?: string;
  reason?: string;
  extractedBy?: string;
  error?: string;
}

async function readFile(file: File) {
  const data = Buffer.from(await file.arrayBuffer());
  return { data, hash: sha256(data), mimeType: guessMime(file.name, file.type) };
}

/** Stores a voucher (receipt, bill, bank slip…) and lets the agent read its details. */
export async function ingestVoucher(opts: {
  file: File;
  clientId?: string | null;
  hint?: string;
  uploadedBy?: string | null;
  uploadSource: "staff" | "link";
  ip?: string | null;
}): Promise<UploadResult> {
  const fileName = opts.file.name || "voucher";
  if (opts.file.size === 0) return { ok: false, fileName, error: "File is empty" };
  if (opts.file.size > MAX_FILE_BYTES) return { ok: false, fileName, error: "File is larger than 100 MB" };
  const { data, hash, mimeType } = await readFile(opts.file);

  const dup = await prisma.voucher.findFirst({ where: { sha256: hash, status: "active" } });
  if (dup) return { ok: false, fileName, error: `Already uploaded as ${dup.refCode}` };

  const x = await extractFinancial(fileName, mimeType, data, opts.hint ?? "");
  const refCode = `PQT-VCH-${String(await nextSeq("voucher")).padStart(4, "0")}`;
  const storedPath = await writeArchiveFile("_vouchers", refCode, fileName, data);
  const v = await prisma.voucher.create({
    data: {
      refCode,
      clientId: opts.clientId || null,
      category: x.category,
      vendor: x.vendor,
      description: x.description,
      amount: x.total,
      currency: x.currency,
      voucherDate: x.date,
      storedPath,
      originalName: fileName,
      mimeType,
      sizeBytes: data.length,
      sha256: hash,
      uploadedBy: opts.uploadedBy || null,
      uploadSource: opts.uploadSource,
      extractedBy: x.by,
      aiReason: x.reason,
    },
  });
  await audit({
    action: "voucher.upload",
    actor: opts.uploadedBy || opts.uploadSource,
    clientId: v.clientId,
    voucherId: v.id,
    detail: `${refCode} ${fileName} (${voucherCategoryLabel(v.category)})`,
    ip: opts.ip,
  });
  return {
    ok: true,
    fileName,
    id: v.id,
    ref: refCode,
    kind: "voucher",
    summary: [voucherCategoryLabel(v.category), v.vendor, v.amount != null ? `${v.amount} ${v.currency ?? ""}` : null].filter(Boolean).join(" · "),
    reason: x.reason,
    extractedBy: x.by,
  };
}

/** Stores an invoice made elsewhere (e.g. the official e-Arşiv PDF, or a supplier's invoice). */
export async function ingestUploadedInvoice(opts: {
  file: File;
  direction: "outgoing" | "incoming";
  clientId?: string | null;
  hint?: string;
  uploadedBy?: string | null;
  ip?: string | null;
}): Promise<UploadResult> {
  const fileName = opts.file.name || "invoice";
  if (opts.file.size === 0) return { ok: false, fileName, error: "File is empty" };
  if (opts.file.size > MAX_FILE_BYTES) return { ok: false, fileName, error: "File is larger than 100 MB" };
  const { data, hash, mimeType } = await readFile(opts.file);

  const dup = await prisma.invoice.findFirst({ where: { sha256: hash } });
  if (dup) return { ok: false, fileName, error: `Already uploaded as ${dup.number}` };

  const x = await extractFinancial(fileName, mimeType, data, opts.hint ?? "");
  const number = `PQT-UPL-${String(await nextSeq("uploaded-invoice")).padStart(4, "0")}`;
  const storedPath = await writeArchiveFile("_invoices", number, fileName, data);
  const client = opts.clientId ? await prisma.client.findUnique({ where: { id: opts.clientId } }) : null;
  const party =
    (opts.direction === "outgoing" ? x.billedTo : x.vendor) ?? client?.name ?? "Unknown — please edit";
  const total = x.total ?? 0;
  const vat = x.vatAmount ?? 0;
  const inv = await prisma.invoice.create({
    data: {
      number,
      source: "uploaded",
      direction: opts.direction,
      externalNo: x.number,
      status: "issued",
      clientId: client?.id ?? null,
      partyName: party,
      issueDate: x.date ?? todayISO(),
      currency: x.currency ?? "TRY",
      itemsJson: JSON.stringify(x.description ? [{ description: x.description, quantity: 1, unitPrice: total - vat }] : []),
      subtotal: total - vat,
      vatAmount: vat,
      total,
      storedPath,
      originalName: fileName,
      mimeType,
      sizeBytes: data.length,
      sha256: hash,
      createdBy: opts.uploadedBy || "staff",
      extractedBy: x.by,
      aiReason: x.reason,
      issuedAt: new Date(),
    },
  });
  await audit({ action: "invoice.upload", actor: opts.uploadedBy || "staff", clientId: inv.clientId, invoiceId: inv.id, detail: `${number} ${fileName}`, ip: opts.ip });
  return {
    ok: true,
    fileName,
    id: inv.id,
    ref: number,
    kind: "invoice",
    summary: [opts.direction === "incoming" ? "Received from" : "Issued to", party, total ? `${total} ${inv.currency}` : null].filter(Boolean).join(" "),
    reason: x.reason,
    extractedBy: x.by,
  };
}

export async function createInvoice(input: {
  clientId?: string | null;
  partyName: string;
  partyAddress?: string | null;
  partyEmail?: string | null;
  partyTaxId?: string | null;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  items: LineItem[];
  vatRate: number;
  notes?: string | null;
  voucherIds?: string[];
  status: "draft" | "issued";
  createdBy?: string | null;
  ip?: string | null;
}) {
  const totals = computeTotals(input.items, input.vatRate);
  // Number and invoice are created together: if saving fails, the number is not used up,
  // so invoice numbers never have gaps.
  const inv = await prisma.$transaction(async (tx) => {
    const number = await nextInvoiceNumber(input.issueDate, tx);
    return tx.invoice.create({
      data: {
        number,
        source: "created",
        direction: "outgoing",
        status: input.status,
        clientId: input.clientId || null,
        partyName: input.partyName,
        partyAddress: input.partyAddress || null,
        partyEmail: input.partyEmail || null,
        partyTaxId: input.partyTaxId || null,
        issueDate: input.issueDate,
        dueDate: input.dueDate || null,
        currency: input.currency,
        itemsJson: JSON.stringify(input.items),
        vatRate: input.vatRate,
        ...totals,
        notes: input.notes || null,
        createdBy: input.createdBy || "staff",
        extractedBy: "manual",
        issuedAt: input.status === "issued" ? new Date() : null,
      },
    });
  });
  const number = inv.number;
  if (input.voucherIds?.length) {
    await prisma.voucher.updateMany({ where: { id: { in: input.voucherIds } }, data: { invoiceId: inv.id } });
  }
  await audit({
    action: input.status === "issued" ? "invoice.issue" : "invoice.draft",
    actor: input.createdBy || "staff",
    clientId: inv.clientId,
    invoiceId: inv.id,
    detail: `${number} ${inv.partyName} ${inv.total} ${inv.currency}${input.voucherIds?.length ? ` (${input.voucherIds.length} vouchers attached)` : ""}`,
    ip: input.ip,
  });
  return inv;
}
