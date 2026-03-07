import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePaymentNo } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const body = await request.json();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const paymentAmount = parseFloat(body.amount);
  if (paymentAmount <= 0) {
    return NextResponse.json(
      { error: "Payment amount must be positive" },
      { status: 400 }
    );
  }

  const remainingBalance = invoice.totalAmount - invoice.paidAmount;
  if (paymentAmount > remainingBalance + 0.01) {
    return NextResponse.json(
      { error: "Payment exceeds remaining balance" },
      { status: 400 }
    );
  }

  const payment = await prisma.payment.create({
    data: {
      paymentNo: generatePaymentNo(),
      amount: paymentAmount,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      method: body.method || "bank_transfer",
      reference: body.reference || null,
      notes: body.notes || null,
      invoiceId,
    },
  });

  // Update invoice paid amount and status
  const newPaidAmount = invoice.paidAmount + paymentAmount;
  let newStatus = invoice.status;
  if (newPaidAmount >= invoice.totalAmount - 0.01) {
    newStatus = "paid";
  } else if (newPaidAmount > 0) {
    newStatus = "partial";
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: newPaidAmount,
      status: newStatus,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
