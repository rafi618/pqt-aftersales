import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tickets: { orderBy: { createdAt: "desc" }, take: 10 },
      warrantyClaims: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      address: body.address,
      city: body.city,
      country: body.country,
      notes: body.notes,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
