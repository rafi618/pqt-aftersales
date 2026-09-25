import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, getValidLink, requestIp } from "@/lib/archive/service";
import { readArchiveFile } from "@/lib/archive/storage";
import { fileResponse } from "@/lib/archive/zip";
import { pdfForInvoice } from "@/lib/invoices/pdf";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "invoice");
  if (!link?.invoiceId) return new Response("This invoice link is invalid or has expired", { status: 403 });
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: link.invoiceId } });
  const download = request.nextUrl.searchParams.get("download") === "1";
  await prisma.shareLink.update({ where: { id: link.id }, data: { uses: { increment: 1 } } });
  await audit({ action: download ? "invoice.download" : "invoice.view", actor: `link: ${link.label ?? "invoice"}`, clientId: inv.clientId, invoiceId: inv.id, detail: inv.number, ip: requestIp(request) });
  if (inv.source === "uploaded" && inv.storedPath) {
    return fileResponse(await readArchiveFile(inv.storedPath), inv.mimeType ?? "application/pdf", `${inv.number}__${inv.originalName}`, download);
  }
  const { bytes } = await pdfForInvoice(inv.id);
  return fileResponse(Buffer.from(bytes), "application/pdf", `${inv.number}.pdf`, download);
}
