import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, findOrCreateClient, ingestFile, requestIp } from "@/lib/archive/service";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const clientId = form.get("clientId")?.toString();
  const clientName = form.get("clientName")?.toString().trim();
  const hint = form.get("note")?.toString() ?? "";
  const uploadedBy = form.get("uploadedBy")?.toString() || "staff";
  const forceCategory = form.get("category")?.toString() || null;
  const previousId = form.get("previousId")?.toString() || null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) return NextResponse.json({ error: "No files attached" }, { status: 400 });

  let client;
  if (clientId) {
    client = await prisma.client.findUnique({ where: { id: clientId } });
  } else if (clientName) {
    const r = await findOrCreateClient(clientName);
    client = r.client;
    if (r.created) await audit({ action: "client.create", actor: uploadedBy, clientId: client.id, detail: `${client.clientCode} ${client.name} (created during upload)`, ip: requestIp(request) });
  }
  if (!client) return NextResponse.json({ error: "Choose a client or type a client name" }, { status: 400 });

  const results = [];
  for (const file of files) {
    results.push(
      await ingestFile({ clientId: client.id, file, hint, uploadedBy, uploadSource: "staff", forceCategory, previousId, ip: requestIp(request) })
    );
  }
  return NextResponse.json({ client: { id: client.id, name: client.name, clientCode: client.clientCode }, results });
}
