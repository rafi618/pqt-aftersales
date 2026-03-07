import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTicketNo } from "@/lib/utils";

export async function GET() {
  const tickets = await prisma.ticket.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ticket = await prisma.ticket.create({
    data: {
      ticketNo: generateTicketNo(),
      subject: body.subject,
      description: body.description || null,
      status: body.status || "open",
      priority: body.priority || "medium",
      category: body.category || "general",
      assignedTo: body.assignedTo || null,
      customerId: body.customerId,
      productId: body.productId || null,
    },
    include: { customer: true },
  });
  return NextResponse.json(ticket, { status: 201 });
}
