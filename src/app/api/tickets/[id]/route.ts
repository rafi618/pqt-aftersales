import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { customer: true, product: true, documents: { orderBy: { createdAt: "desc" } } },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(ticket);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      subject: body.subject,
      description: body.description,
      status: body.status,
      priority: body.priority,
      category: body.category,
      assignedTo: body.assignedTo,
      resolution: body.resolution,
      productId: body.productId || null,
    },
    include: { customer: true },
  });
  return NextResponse.json(ticket);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.ticket.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
