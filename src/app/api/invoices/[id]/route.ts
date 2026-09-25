import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";
import { computeTotals, CURRENCIES } from "@/lib/invoices/config";
import { cleanItems } from "@/lib/invoices/service";

// Drafts can be edited freely. Once issued, an invoice's contents are frozen:
// only its status can change (paid / unpaid / cancelled with a reason).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id } });
  const data: Record<string, unknown> = {};
  let action = "invoice.update";
  let detail = inv.number;

  if (b.action === "edit") {
    const editable = inv.status === "draft" || inv.source === "uploaded";
    if (!editable) return NextResponse.json({ error: "Issued invoices cannot be changed. Cancel it and create a new one." }, { status: 400 });
    const items = cleanItems(b.items);
    const vatRate = Number(b.vatRate) || 0;
    if (!b.partyName?.trim()) return NextResponse.json({ error: "Enter who the invoice is for" }, { status: 400 });
    if (!CURRENCIES.includes(b.currency)) return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
    Object.assign(data, {
      clientId: b.clientId || null,
      partyName: b.partyName.trim(),
      partyAddress: b.partyAddress || null,
      partyEmail: b.partyEmail || null,
      partyTaxId: b.partyTaxId || null,
      issueDate: b.issueDate,
      dueDate: b.dueDate || null,
      currency: b.currency,
      notes: b.notes || null,
      externalNo: inv.source === "uploaded" ? b.externalNo || null : inv.externalNo,
      direction: inv.source === "uploaded" && b.direction ? b.direction : inv.direction,
    });
    if (inv.source === "uploaded") {
      // Uploaded invoices keep the amounts read from the document
      Object.assign(data, { total: Number(b.total) || 0, vatAmount: Number(b.vatAmount) || 0, subtotal: (Number(b.total) || 0) - (Number(b.vatAmount) || 0), extractedBy: "manual" });
    } else {
      Object.assign(data, { itemsJson: JSON.stringify(items), vatRate, ...computeTotals(items, vatRate) });
    }
    if (Array.isArray(b.voucherIds)) {
      await prisma.voucher.updateMany({ where: { invoiceId: id, id: { notIn: b.voucherIds } }, data: { invoiceId: null } });
      await prisma.voucher.updateMany({ where: { id: { in: b.voucherIds } }, data: { invoiceId: id } });
    }
    detail += " details edited";
  } else if (b.action === "issue" && inv.status === "draft") {
    Object.assign(data, { status: "issued", issuedAt: new Date() });
    action = "invoice.issue";
  } else if (b.action === "paid" && inv.status === "issued") {
    Object.assign(data, { status: "paid", paidAt: new Date() });
    action = "invoice.paid";
  } else if (b.action === "unpaid" && inv.status === "paid") {
    Object.assign(data, { status: "issued", paidAt: null });
    action = "invoice.unpaid";
  } else if (b.action === "cancel" && inv.status !== "cancelled") {
    if (!b.reason?.trim()) return NextResponse.json({ error: "Give a reason for cancelling" }, { status: 400 });
    Object.assign(data, { status: "cancelled", statusReason: b.reason.trim() });
    action = "invoice.cancel";
    detail += `: ${b.reason.trim()}`;
  } else {
    return NextResponse.json({ error: "That change is not allowed" }, { status: 400 });
  }

  const updated = await prisma.invoice.update({ where: { id }, data });
  await audit({ action, actor: "staff", clientId: updated.clientId, invoiceId: id, detail, ip: requestIp(request) });
  return NextResponse.json(updated);
}
