import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readArchiveFile } from "@/lib/archive/storage";
import { fileResponse } from "@/lib/archive/zip";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.voucher.findUnique({ where: { id } });
  if (!v) return new Response("Not found", { status: 404 });
  const download = request.nextUrl.searchParams.get("download") === "1";
  return fileResponse(await readArchiveFile(v.storedPath), v.mimeType, `${v.refCode}__${v.originalName}`, download);
}
