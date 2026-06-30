import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { part: true } },
      payments: { orderBy: { paymentDate: "desc" } },
      ticket: true,
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // If updating items, recalculate totals
  if (body.items) {
    const subtotal = body.items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = body.taxRate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // Delete old items and recreate
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        notes: body.notes,
        paymentTerms: body.paymentTerms,
        ticketId: body.ticketId || null,
        items: {
          create: body.items.map(
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

    return NextResponse.json(invoice);
  }

  // Simple status update (no items change)
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      notes: body.notes,
      paymentTerms: body.paymentTerms,
    },
    include: {
      customer: true,
      items: { include: { part: true } },
      payments: true,
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
