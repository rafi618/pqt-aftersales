import { NextRequest, NextResponse } from "next/server";
import { requestIp } from "@/lib/archive/service";
import { cleanItems, createInvoice } from "@/lib/invoices/service";
import { CURRENCIES } from "@/lib/invoices/config";

export async function POST(request: NextRequest) {
  const b = await request.json();
  const items = cleanItems(b.items);
  if (!b.partyName?.trim()) return NextResponse.json({ error: "Enter who the invoice is for" }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ error: "Add at least one line" }, { status: 400 });
  if (!CURRENCIES.includes(b.currency)) return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  const inv = await createInvoice({
    clientId: b.clientId || null,
    partyName: b.partyName.trim(),
    partyAddress: b.partyAddress,
    partyEmail: b.partyEmail,
    partyTaxId: b.partyTaxId,
    issueDate: b.issueDate,
    dueDate: b.dueDate,
    currency: b.currency,
    items,
    vatRate: Number(b.vatRate) || 0,
    notes: b.notes,
    voucherIds: Array.isArray(b.voucherIds) ? b.voucherIds : [],
    status: b.status === "issued" ? "issued" : "draft",
    createdBy: b.createdBy || "staff",
    ip: requestIp(request),
  });
  return NextResponse.json(inv, { status: 201 });
}
