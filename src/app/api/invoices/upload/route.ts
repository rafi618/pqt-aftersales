import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findOrCreateClient, requestIp } from "@/lib/archive/service";
import { ingestUploadedInvoice, ingestVoucher } from "@/lib/invoices/service";

export const maxDuration = 300;

// kind = voucher | invoice-out (PQT's own invoice made elsewhere) | invoice-in (supplier invoice)
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const kind = form.get("kind")?.toString() ?? "voucher";
  const clientName = form.get("clientName")?.toString().trim();
  const clientId = form.get("clientId")?.toString() || null;
  const note = form.get("note")?.toString() ?? "";
  const uploadedBy = form.get("uploadedBy")?.toString() || "staff";
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "No files attached" }, { status: 400 });

  let cid = clientId;
  if (!cid && clientName) cid = (await findOrCreateClient(clientName)).client.id;
  if (cid && !(await prisma.client.findUnique({ where: { id: cid } }))) cid = null;

  const ip = requestIp(request);
  const results = [];
  for (const file of files) {
    results.push(
      kind === "voucher"
        ? await ingestVoucher({ file, clientId: cid, hint: note, uploadedBy, uploadSource: "staff", ip })
        : await ingestUploadedInvoice({ file, direction: kind === "invoice-in" ? "incoming" : "outgoing", clientId: cid, hint: note, uploadedBy, ip })
    );
  }
  return NextResponse.json({ results });
}
