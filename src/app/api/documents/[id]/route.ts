import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await unlink(path.join(process.cwd(), "public", doc.filePath));
  } catch {
    // file already gone
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
