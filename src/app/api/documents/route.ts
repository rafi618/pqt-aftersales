import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;
  const warrantyClaimId = formData.get("warrantyClaimId") as string | null;
  const invoiceId = formData.get("invoiceId") as string | null;
  const label = formData.get("label") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ticketId && !warrantyClaimId && !invoiceId) {
    return NextResponse.json(
      { error: "Must link to a ticket, warranty claim, or invoice" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size must be under 10MB" },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(uploadDir, uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const doc = await prisma.document.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: `/uploads/${uniqueName}`,
      label: label || null,
      ticketId: ticketId || null,
      warrantyClaimId: warrantyClaimId || null,
      invoiceId: invoiceId || null,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
