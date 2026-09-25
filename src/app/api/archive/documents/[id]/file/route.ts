import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readArchiveFile } from "@/lib/archive/storage";
import { audit, requestIp } from "@/lib/archive/service";
import { fileResponse } from "@/lib/archive/zip";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });
  const download = request.nextUrl.searchParams.get("download") === "1";
  const data = await readArchiveFile(doc.storedPath);
  if (download) {
    await audit({ action: "doc.download", actor: "staff", clientId: doc.clientId, documentId: id, detail: doc.refCode, ip: requestIp(request) });
  }
  return fileResponse(data, doc.mimeType, `${doc.refCode}__${doc.originalName}`, download);
}
