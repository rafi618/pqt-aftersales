import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateClaimNo } from "@/lib/utils";

export async function GET() {
  const claims = await prisma.warrantyClaim.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(claims);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const claim = await prisma.warrantyClaim.create({
    data: {
      claimNo: generateClaimNo(),
      status: body.status || "pending",
      issueDescription: body.issueDescription || null,
      resolution: body.resolution || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      customerId: body.customerId,
      productId: body.productId || null,
    },
    include: { customer: true },
  });
  return NextResponse.json(claim, { status: 201 });
}
