import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";
import { readArchiveFile } from "@/lib/archive/storage";
import { fileResponse } from "@/lib/archive/zip";
import { pdfForInvoice } from "@/lib/invoices/pdf";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = request.nextUrl.searchParams.get("download") === "1";
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return new Response("Not found", { status: 404 });
  if (download) await audit({ action: "invoice.download", actor: "staff", clientId: inv.clientId, invoiceId: id, detail: inv.number, ip: requestIp(request) });
  if (inv.source === "uploaded" && inv.storedPath) {
    return fileResponse(await readArchiveFile(inv.storedPath), inv.mimeType ?? "application/pdf", `${inv.number}__${inv.originalName}`, download);
  }
  const { bytes } = await pdfForInvoice(id);
  return fileResponse(Buffer.from(bytes), "application/pdf", `${inv.number}.pdf`, download);
}
