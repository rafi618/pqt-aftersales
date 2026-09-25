import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";
import { VOUCHER_CATEGORIES } from "@/lib/invoices/config";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  const v = await prisma.voucher.findUniqueOrThrow({ where: { id } });
  const data: Record<string, unknown> = {};
  if (b.status === "retired") {
    if (!b.reason?.trim()) return NextResponse.json({ error: "Give a reason" }, { status: 400 });
    Object.assign(data, { status: "retired", statusReason: b.reason.trim(), invoiceId: null });
  } else if (b.status === "active") {
    Object.assign(data, { status: "active", statusReason: null });
  } else {
    if (b.category && !VOUCHER_CATEGORIES.some((c) => c.id === b.category)) return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    Object.assign(data, {
      category: b.category ?? v.category,
      vendor: b.vendor || null,
      description: b.description || null,
      amount: b.amount === "" || b.amount == null ? null : Number(b.amount),
      currency: b.currency || null,
      voucherDate: b.voucherDate || null,
      clientId: b.clientId || null,
      extractedBy: "manual",
    });
  }
  const updated = await prisma.voucher.update({ where: { id }, data });
  await audit({ action: data.status ? `voucher.${data.status}` : "voucher.update", actor: "staff", clientId: updated.clientId, voucherId: id, detail: `${v.refCode}${b.reason ? `: ${b.reason}` : ""}`, ip: requestIp(request) });
  return NextResponse.json(updated);
}
