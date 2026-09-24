import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, newToken, requestIp } from "@/lib/archive/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.kind !== "upload" && body.kind !== "download") {
    return NextResponse.json({ error: "kind must be upload or download" }, { status: 400 });
  }
  if (body.kind === "download" && !body.clientId) {
    return NextResponse.json({ error: "A download link must be for one client" }, { status: 400 });
  }
  const days = Number(body.expiresInDays) || 0;
  const link = await prisma.shareLink.create({
    data: {
      token: newToken(),
      kind: body.kind,
      label: body.label || null,
      clientId: body.clientId || null,
      section: body.section || null,
      expiresAt: days > 0 ? new Date(Date.now() + days * 86400_000) : null,
    },
  });
  await audit({ action: "link.create", actor: "staff", clientId: link.clientId, detail: `${link.kind} link "${link.label ?? ""}"`, ip: requestIp(request) });
  return NextResponse.json(link, { status: 201 });
}
