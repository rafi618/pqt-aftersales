import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      parts: { orderBy: { createdAt: "desc" }, take: 10 },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: true },
      },
      warrantyClaims: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: true },
      },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      sku: body.sku,
      category: body.category || null,
      description: body.description || null,
      warrantyMonths:
        body.warrantyMonths !== undefined
          ? parseInt(body.warrantyMonths)
          : undefined,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
