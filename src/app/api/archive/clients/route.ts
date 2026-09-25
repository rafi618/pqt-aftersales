import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, createClient, requestIp } from "@/lib/archive/service";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const clients = await prisma.client.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { clientCode: { contains: q.toUpperCase() } }] }
      : undefined,
    orderBy: { name: "asc" },
    take: 50,
    select: { id: true, name: true, clientCode: true },
  });
  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }
  const client = await createClient({
    name: body.name,
    email: body.email || null,
    phone: body.phone || null,
    nationality: body.nationality || null,
    passportNo: body.passportNo || null,
    properties: body.properties || null,
    notes: body.notes || null,
  });
  await audit({ action: "client.create", actor: "staff", clientId: client.id, detail: `${client.clientCode} ${client.name}`, ip: requestIp(request) });
  return NextResponse.json(client, { status: 201 });
}
