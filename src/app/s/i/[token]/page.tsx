import { prisma } from "@/lib/prisma";
import { Download } from "lucide-react";
import { getValidLink } from "@/lib/archive/service";
import { INVOICE_STATUS, money } from "@/lib/invoices/config";
import PublicFrame, { LinkInvalid } from "@/components/archive/PublicFrame";

export const dynamic = "force-dynamic";

export default async function PublicInvoice({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "invoice");
  if (!link?.invoiceId) return <LinkInvalid />;
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id: link.invoiceId } });
  const isImage = inv.mimeType?.startsWith("image/");
  return (
    <PublicFrame title={`Invoice ${inv.externalNo ?? inv.number}`} subtitle={`${inv.partyName} · ${money(inv.total, inv.currency)} · issued ${inv.issueDate}${inv.dueDate ? ` · due ${inv.dueDate}` : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <a href={`/api/s/${token}/invoice?download=1`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Download className="h-4 w-4" /> Download invoice
        </a>
        <span className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs">{INVOICE_STATUS[inv.status]?.label}</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/s/${token}/invoice`} alt="Invoice" className="mx-auto" />
        ) : (
          <iframe src={`/api/s/${token}/invoice`} className="w-full h-[80vh]" title="Invoice" />
        )}
      </div>
    </PublicFrame>
  );
}
