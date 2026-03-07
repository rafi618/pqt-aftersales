import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNo } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const month = searchParams.get("month"); // format: YYYY-MM

  const where: Record<string, unknown> = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 1);
    where.issueDate = { gte: startDate, lt: endDate };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: true,
      items: true,
      payments: true,
      ticket: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const items = body.items || [];
  const subtotal = items.reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice,
    0
  );
  const taxRate = body.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo: generateInvoiceNo(),
      status: body.status || "draft",
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: new Date(body.dueDate),
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      notes: body.notes || null,
      paymentTerms: body.paymentTerms || null,
      customerId: body.customerId,
      ticketId: body.ticketId || null,
      items: {
        create: items.map(
          (item: {
            description: string;
            quantity: number;
            unitPrice: number;
            partId?: string;
          }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            partId: item.partId || null,
          })
        ),
      },
    },
    include: {
      customer: true,
      items: { include: { part: true } },
      payments: true,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
