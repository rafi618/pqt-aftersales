import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const link = await prisma.shareLink.update({ where: { id }, data: { revoked: Boolean(body.revoked) } });
  await audit({ action: body.revoked ? "link.revoke" : "link.restore", actor: "staff", clientId: link.clientId, detail: `${link.kind} link "${link.label ?? ""}"`, ip: requestIp(request) });
  return NextResponse.json(link);
}
