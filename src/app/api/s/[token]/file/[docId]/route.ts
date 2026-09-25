import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readArchiveFile } from "@/lib/archive/storage";
import { audit, getValidLink, requestIp } from "@/lib/archive/service";
import { fileResponse } from "@/lib/archive/zip";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string; docId: string }> }) {
  const { token, docId } = await params;
  const link = await getValidLink(token, "download");
  if (!link) return new Response("This download link is invalid or has expired", { status: 403 });
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc || doc.clientId !== link.clientId || doc.status !== "active" || (link.section ? doc.section !== link.section : doc.section === "unsorted")) {
    return new Response("Not found", { status: 404 });
  }
  const download = request.nextUrl.searchParams.get("download") === "1";
  await audit({ action: download ? "doc.download" : "doc.view", actor: `link: ${link.label ?? "download"}`, clientId: doc.clientId, documentId: doc.id, detail: doc.refCode, ip: requestIp(request) });
  await prisma.shareLink.update({ where: { id: link.id }, data: { uses: { increment: 1 } } });
  return fileResponse(await readArchiveFile(doc.storedPath), doc.mimeType, `${doc.refCode}__${doc.originalName}`, download);
}
