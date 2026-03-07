import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
    include: { product: true },
  });
  if (!part) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(part);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const part = await prisma.part.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      quantity: body.quantity !== undefined ? parseInt(body.quantity) : undefined,
      minStock: body.minStock !== undefined ? parseInt(body.minStock) : undefined,
      unitPrice: body.unitPrice !== undefined ? parseFloat(body.unitPrice) : undefined,
      location: body.location,
      productId: body.productId || null,
    },
  });
  return NextResponse.json(part);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.part.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
