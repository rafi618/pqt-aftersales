import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, newToken, requestIp } from "@/lib/archive/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!["upload", "download", "invoice", "voucher-upload"].includes(body.kind)) {
    return NextResponse.json({ error: "Unknown link type" }, { status: 400 });
  }
  if (body.kind === "invoice" && !body.invoiceId) {
    return NextResponse.json({ error: "An invoice link needs an invoice" }, { status: 400 });
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
      invoiceId: body.invoiceId || null,
      section: body.section || null,
      expiresAt: days > 0 ? new Date(Date.now() + days * 86400_000) : null,
    },
  });
  await audit({ action: "link.create", actor: "staff", clientId: link.clientId, invoiceId: link.invoiceId, detail: `${link.kind} link "${link.label ?? ""}"`, ip: requestIp(request) });
  return NextResponse.json(link, { status: 201 });
}
