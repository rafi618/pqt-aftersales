import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, findOrCreateClient, getValidLink, ingestFile, requestIp } from "@/lib/archive/service";

export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "upload");
  if (!link) return NextResponse.json({ error: "This upload link is invalid or has expired" }, { status: 403 });

  const form = await request.formData();
  const uploaderName = form.get("uploadedBy")?.toString().trim();
  const clientName = form.get("clientName")?.toString().trim();
  const note = form.get("note")?.toString() ?? "";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!uploaderName) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (files.length === 0) return NextResponse.json({ error: "No files attached" }, { status: 400 });

  const actor = `${uploaderName} (link: ${link.label ?? "upload"})`;
  let client = link.client;
  if (!client) {
    if (!clientName) return NextResponse.json({ error: "Please enter the client's full name" }, { status: 400 });
    const r = await findOrCreateClient(clientName);
    client = r.client;
    if (r.created) await audit({ action: "client.create", actor, clientId: client.id, detail: `${client.clientCode} ${client.name} (created via upload link)`, ip: requestIp(request) });
  }

  const results = [];
  for (const file of files) {
    results.push(await ingestFile({ clientId: client.id, file, hint: note, uploadedBy: actor, uploadSource: "link", ip: requestIp(request) }));
  }
  await prisma.shareLink.update({ where: { id: link.id }, data: { uses: { increment: 1 } } });
  // Public uploaders see where files went, but not internal notes.
  return NextResponse.json({
    client: client.name,
    results: results.map((r) => ({ ok: r.ok, fileName: r.fileName, refCode: r.refCode, categoryLabel: r.categoryLabel, error: r.error })),
  });
}
