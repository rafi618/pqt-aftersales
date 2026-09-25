import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateClient, getValidLink, requestIp } from "@/lib/archive/service";
import { ingestVoucher } from "@/lib/invoices/service";

export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "voucher-upload");
  if (!link) return NextResponse.json({ error: "This upload link is invalid or has expired" }, { status: 403 });
  const form = await request.formData();
  const uploader = form.get("uploadedBy")?.toString().trim();
  const clientName = form.get("clientName")?.toString().trim();
  const note = form.get("note")?.toString() ?? "";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!uploader) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (files.length === 0) return NextResponse.json({ error: "No files attached" }, { status: 400 });
  let clientId = link.clientId;
  if (!clientId && clientName) clientId = (await findOrCreateClient(clientName)).client.id;
  const actor = `${uploader} (link: ${link.label ?? "vouchers"})`;
  const results = [];
  for (const file of files) {
    results.push(await ingestVoucher({ file, clientId, hint: note, uploadedBy: actor, uploadSource: "link", ip: requestIp(request) }));
  }
  await prisma.shareLink.update({ where: { id: link.id }, data: { uses: { increment: 1 } } });
  return NextResponse.json({ client: clientName ?? link.client?.name ?? "", results: results.map((r) => ({ ok: r.ok, fileName: r.fileName, refCode: r.ref, categoryLabel: r.summary, error: r.error })) });
}
