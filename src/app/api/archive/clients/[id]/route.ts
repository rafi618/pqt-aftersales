import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const fields = ["name", "email", "phone", "nationality", "passportNo", "properties", "notes"] as const;
  const data: Record<string, string | null> = {};
  for (const f of fields) if (f in body) data[f] = body[f] || null;
  if (data.name === null) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const client = await prisma.client.update({ where: { id }, data });
  await audit({ action: "client.update", actor: "staff", clientId: id, detail: Object.keys(data).join(", "), ip: requestIp(request) });
  return NextResponse.json(client);
}
