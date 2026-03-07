import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: { customer: true, product: true },
  });
  if (!claim) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(claim);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const claim = await prisma.warrantyClaim.update({
    where: { id },
    data: {
      status: body.status,
      issueDescription: body.issueDescription,
      resolution: body.resolution,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      productId: body.productId || null,
    },
    include: { customer: true },
  });
  return NextResponse.json(claim);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.warrantyClaim.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
