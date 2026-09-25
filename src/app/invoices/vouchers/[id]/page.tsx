import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Download, Sparkles } from "lucide-react";
import VoucherEditor from "@/components/invoices/VoucherEditor";
import { voucherCategoryLabel } from "@/lib/invoices/config";
import { formatBytes } from "@/lib/archive/storage";

export const dynamic = "force-dynamic";

export default async function VoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await prisma.voucher.findUnique({ where: { id }, include: { invoice: true, client: true } });
  if (!v) notFound();
  const [clients, history] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientCode: true } }),
    prisma.auditLog.findMany({ where: { voucherId: id }, orderBy: { createdAt: "desc" } }),
  ]);
  const url = `/api/vouchers/${id}/file`;

  return (
    <div className="space-y-4">
      <Link href="/invoices?tab=vouchers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> All vouchers
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold text-blue-700">{v.refCode}</p>
          <p className="text-lg font-semibold">{v.vendor ?? v.description ?? v.originalName}</p>
          <p className="text-xs text-gray-500">
            {voucherCategoryLabel(v.category)} · {v.originalName} · {formatBytes(v.sizeBytes)} · uploaded by {v.uploadedBy ?? "—"}
            {v.status !== "active" && <span className="ml-2 rounded bg-gray-200 px-1.5">retired: {v.statusReason}</span>}
          </p>
          {v.invoice && (
            <p className="mt-1 text-sm">Billed on invoice <Link href={`/invoices/${v.invoice.id}`} className="font-mono text-blue-700 hover:underline">{v.invoice.number}</Link></p>
          )}
        </div>
        <a href={`${url}?download=1`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[500px] flex items-center justify-center">
          {v.mimeType === "application/pdf" ? (
            <iframe src={url} className="w-full h-[75vh]" title={v.refCode} />
          ) : v.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={v.refCode} className="max-h-[75vh] object-contain" />
          ) : (
            <p className="text-sm text-gray-500">No preview — use Download.</p>
          )}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <VoucherEditor v={v} clients={clients} />
          </div>
          {v.aiReason && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 flex gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
              <span>{v.extractedBy === "ai" ? "Read by the AI agent" : v.extractedBy === "manual" ? "Checked by staff" : "Keyword sorter"}: {v.aiReason}</span>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold mb-2">History</p>
            <ul className="space-y-2 text-xs">
              {history.map((h) => (
                <li key={h.id} className="border-l-2 border-blue-200 pl-2">
                  <p className="font-medium text-gray-800">{h.action} <span className="font-normal text-gray-500">· {h.actor}</span></p>
                  <p className="text-gray-500">{h.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{h.detail ? ` — ${h.detail}` : ""}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
