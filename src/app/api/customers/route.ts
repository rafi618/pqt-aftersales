import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: {
        select: { tickets: true, warrantyClaims: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      address: body.address || null,
      city: body.city || null,
      country: body.country || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
