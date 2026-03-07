import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePartNo } from "@/lib/utils";

export async function GET() {
  const parts = await prisma.part.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(parts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const part = await prisma.part.create({
    data: {
      name: body.name,
      partNo: body.partNo || generatePartNo(),
      description: body.description || null,
      quantity: body.quantity ? parseInt(body.quantity) : 0,
      minStock: body.minStock ? parseInt(body.minStock) : 5,
      unitPrice: body.unitPrice ? parseFloat(body.unitPrice) : 0,
      location: body.location || null,
      productId: body.productId || null,
    },
  });
  return NextResponse.json(part, { status: 201 });
}
