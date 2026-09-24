import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readArchiveFile, sha256 } from "@/lib/archive/storage";
import { audit, requestIp } from "@/lib/archive/service";

// Integrity check: re-hashes the stored file and compares with the hash taken at upload.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUniqueOrThrow({ where: { id } });
  let ok = false;
  let message: string;
  try {
    ok = sha256(await readArchiveFile(doc.storedPath)) === doc.sha256;
    message = ok ? "File is intact — fingerprint matches the original upload." : "WARNING: file has changed since upload!";
  } catch {
    message = "WARNING: stored file is missing!";
  }
  await audit({ action: "doc.verify", actor: "staff", clientId: doc.clientId, documentId: id, detail: `${doc.refCode}: ${ok ? "intact" : "FAILED"}`, ip: requestIp(request) });
  return NextResponse.json({ ok, message });
}
