import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";
import { computeTotals, CURRENCIES } from "@/lib/invoices/config";
import { ComposeRow, createInvoice, rowsToItems } from "@/lib/invoices/service";

export const maxDuration = 300;

// The invoice form sends: data = JSON (client, bill-to, rows…) + files = the receipts attached to rows.
// Each row with a receipt becomes a voucher (purpose + cost as typed) and an invoice line.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Bad form data" }, { status: 400 });
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const ip = requestIp(request);
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string).trim() : "");

  const client = str("clientId") ? await prisma.client.findUnique({ where: { id: str("clientId") } }) : null;
  if (!client) return NextResponse.json({ error: "Choose the client this invoice belongs to" }, { status: 400 });
  if (!str("partyName")) return NextResponse.json({ error: "Enter who the invoice is for" }, { status: 400 });
  const currency = str("currency");
  if (!(CURRENCIES as readonly string[]).includes(currency)) return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  const rows = (Array.isArray(d.rows) ? d.rows : []) as ComposeRow[];
  if (!rows.some((r) => Number(r.amount) > 0)) return NextResponse.json({ error: "Add at least one voucher or line with a cost" }, { status: 400 });

  const invoiceId = str("invoiceId") || null;
  if (invoiceId) {
    const existing = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!existing || existing.status !== "draft" || existing.source !== "created") {
      return NextResponse.json({ error: "Only draft invoices can be changed" }, { status: 400 });
    }
  }

  let built;
  try {
    built = await rowsToItems({ rows, files, clientId: client.id, currency, invoiceId, ip });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not store a voucher" }, { status: 400 });
  }
  const vatRate = Number(d.vatRate) || 0;
  const status = d.status === "issued" ? "issued" : "draft";
  const common = {
    partyName: str("partyName"),
    partyAddress: str("partyAddress") || null,
    partyEmail: str("partyEmail") || null,
    partyTaxId: str("partyTaxId") || null,
    issueDate: str("issueDate"),
    dueDate: str("dueDate") || null,
    currency,
    notes: str("notes") || null,
  };

  if (!invoiceId) {
    const inv = await createInvoice({ ...common, clientId: client.id, items: built.items, vatRate, voucherIds: built.voucherIds, status, ip });
    return NextResponse.json(inv, { status: 201 });
  }

  // Updating a draft: re-link vouchers to match the rows
  await prisma.voucher.updateMany({ where: { invoiceId, id: { notIn: built.voucherIds } }, data: { invoiceId: null } });
  await prisma.voucher.updateMany({ where: { id: { in: built.voucherIds } }, data: { invoiceId } });
  const inv = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...common,
      clientId: client.id,
      itemsJson: JSON.stringify(built.items),
      vatRate,
      ...computeTotals(built.items, vatRate),
      ...(status === "issued" ? { status: "issued", issuedAt: new Date() } : {}),
    },
  });
  await audit({ action: status === "issued" ? "invoice.issue" : "invoice.update", actor: "staff", clientId: client.id, invoiceId, detail: `${inv.number} ${inv.total} ${inv.currency}`, ip });
  return NextResponse.json(inv);
}
