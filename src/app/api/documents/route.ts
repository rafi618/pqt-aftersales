import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const doc = await prisma.document.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: "",
      fileData: buffer,
      label: label || null,
      ticketId: ticketId || null,
      warrantyClaimId: warrantyClaimId || null,
      invoiceId: invoiceId || null,
    },
  });

  await prisma.document.update({
    where: { id: doc.id },
    data: { filePath: `/api/documents/${doc.id}/download` },
  });

  return NextResponse.json({ ...doc, filePath: `/api/documents/${doc.id}/download` }, { status: 201 });
}
