import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Paperclip, Sparkles } from "lucide-react";
import InvoiceActions from "@/components/invoices/InvoiceActions";
import { INVOICE_STATUS, money, voucherCategoryLabel } from "@/lib/invoices/config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function when(d: Date) {
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { client: true, vouchers: true } });
  if (!inv) notFound();
  const [history, links] = await Promise.all([
    prisma.auditLog.findMany({ where: { invoiceId: id }, orderBy: { createdAt: "desc" } }),
    prisma.shareLink.findMany({ where: { invoiceId: id, revoked: false }, orderBy: { createdAt: "desc" } }),
  ]);
  const active = links.filter((l) => !l.expiresAt || l.expiresAt > new Date());
  const st = INVOICE_STATUS[inv.status];
  const isImage = inv.mimeType?.startsWith("image/");

  return (
    <div className="space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> All invoices
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold text-blue-700">{inv.number}</p>
          <p className="text-lg font-semibold">
            {inv.direction === "incoming" ? "From " : "To "}
            {inv.partyName} · {money(inv.total, inv.currency)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded-full px-2 py-0.5 font-medium", st?.color)}>{st?.label}</span>
            <span className="text-gray-500">
              {inv.source === "created" ? "Created in the system" : inv.direction === "incoming" ? "Supplier invoice (uploaded)" : "PQT invoice issued elsewhere (uploaded)"}
              {inv.externalNo ? ` · printed no. ${inv.externalNo}` : ""}
            </span>
            {inv.client && (
              <Link href={`/archive/clients/${inv.client.id}`} className="text-blue-600 hover:underline">
                {inv.client.name} ({inv.client.clientCode})
              </Link>
            )}
          </div>
          {inv.statusReason && <p className="mt-1 text-xs text-red-600">Cancelled: {inv.statusReason}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[600px]">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/invoices/${id}/pdf?v=${inv.updatedAt.getTime()}`} alt={inv.number} className="max-h-[80vh] mx-auto" />
          ) : (
            <iframe key={inv.updatedAt.getTime()} src={`/api/invoices/${id}/pdf?v=${inv.updatedAt.getTime()}`} className="w-full h-[80vh]" title={inv.number} />
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <InvoiceActions
              id={id}
              status={inv.status}
              source={inv.source}
              partyName={inv.partyName}
              links={active.map((l) => ({ token: l.token, expiresAt: l.expiresAt?.toISOString() ?? null }))}
            />
          </div>

          {inv.aiReason && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 flex gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
              <span>{inv.extractedBy === "ai" ? "Read by the AI agent" : inv.extractedBy === "manual" ? "Checked by staff" : "Keyword sorter"}: {inv.aiReason}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1"><Paperclip className="h-4 w-4" /> Vouchers ({inv.vouchers.length})</p>
            {inv.vouchers.length === 0 && <p className="text-xs text-gray-500">None attached.</p>}
            <ul className="space-y-1 text-xs">
              {inv.vouchers.map((v) => (
                <li key={v.id}>
                  <Link href={`/invoices/vouchers/${v.id}`} className="font-mono text-blue-700 hover:underline">{v.refCode}</Link>{" "}
                  {voucherCategoryLabel(v.category)} {v.amount != null && `· ${money(v.amount, v.currency ?? "")}`}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold mb-2">History</p>
            <ul className="space-y-2 text-xs">
              {history.map((h) => (
                <li key={h.id} className="border-l-2 border-blue-200 pl-2">
                  <p className="font-medium text-gray-800">{h.action} <span className="font-normal text-gray-500">· {h.actor}</span></p>
                  <p className="text-gray-500">{when(h.createdAt)}{h.detail ? ` — ${h.detail}` : ""}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
