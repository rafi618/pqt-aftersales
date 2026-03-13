import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      _count: { select: { tickets: true, warrantyClaims: true, parts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.sku) {
    return NextResponse.json(
      { error: "Name and SKU are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.product.findUnique({ where: { sku: body.sku } });
  if (existing) {
    return NextResponse.json(
      { error: "A product with this SKU already exists" },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      sku: body.sku,
      category: body.category || null,
      description: body.description || null,
      warrantyMonths: body.warrantyMonths ? parseInt(body.warrantyMonths) : 12,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
