import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FilePlus2, ScanLine, Receipt, FileText, AlertCircle, CheckCircle2, Paperclip } from "lucide-react";
import { INVOICE_STATUS, money, voucherCategoryLabel } from "@/lib/invoices/config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "vouchers", label: "Vouchers" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; client?: string; q?: string }>;
}) {
  const { tab = "invoices", status, client, q = "" } = await searchParams;
  const query = q.trim();
  const clientFilter = client ? await prisma.client.findUnique({ where: { id: client } }) : null;

  const [invoices, vouchers, open, unlinked] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(client ? { clientId: client } : {}),
        ...(query ? { OR: [{ number: { contains: query.toUpperCase() } }, { partyName: { contains: query } }, { externalNo: { contains: query } }] } : {}),
      },
      include: { client: { select: { name: true, clientCode: true } }, _count: { select: { vouchers: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.voucher.findMany({
      where: {
        status: "active",
        ...(client ? { clientId: client } : {}),
        ...(query ? { OR: [{ refCode: { contains: query.toUpperCase() } }, { vendor: { contains: query } }, { description: { contains: query } }] } : {}),
      },
      include: { client: { select: { name: true } }, invoice: { select: { number: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({ where: { status: "issued", direction: "outgoing" }, select: { total: true, currency: true } }),
    prisma.voucher.count({ where: { status: "active", invoiceId: null } }),
  ]);

  const outstanding = Object.entries(
    open.reduce<Record<string, number>>((acc, i) => ((acc[i.currency] = (acc[i.currency] ?? 0) + i.total), acc), {})
  );
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const all = { tab, status, client, q: query || undefined, ...extra };
    for (const [k, v] of Object.entries(all)) if (v) p.set(k, v);
    return `/invoices?${p}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex-1 max-w-xl">
          <input type="hidden" name="tab" value={tab} />
          <input name="q" defaultValue={query} placeholder="Search invoice number, customer, voucher, vendor…" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm" />
        </form>
        <div className="flex gap-2">
          <Link href="/invoices/upload" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            <ScanLine className="h-4 w-4" /> Upload voucher / invoice
          </Link>
          <Link href="/invoices/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <FilePlus2 className="h-4 w-4" /> Create invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Receipt} color="text-blue-600 bg-blue-50" label="Invoices" value={String(invoices.length)} />
        <Stat icon={AlertCircle} color="text-amber-600 bg-amber-50" label="Waiting for payment" value={outstanding.length ? outstanding.map(([c, t]) => money(t, c)).join(" + ") : "—"} />
        <Stat icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" label="Paid" value={String(invoices.filter((i) => i.status === "paid").length)} />
        <Stat icon={Paperclip} color="text-indigo-600 bg-indigo-50" label="Vouchers not yet invoiced" value={String(unlinked)} />
      </div>

      {clientFilter && (
        <p className="text-sm">
          Showing only <b>{clientFilter.name}</b> ({clientFilter.clientCode}) · <Link href={qs({ client: undefined })} className="text-blue-600 hover:underline">show all</Link>
        </p>
      )}

      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <Link key={t.id} href={qs({ tab: t.id, status: undefined })} className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px", tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800")}>
            {t.label} <span className="text-xs text-gray-400">{t.id === "invoices" ? invoices.length : vouchers.length}</span>
          </Link>
        ))}
        {tab === "invoices" && (
          <div className="ml-auto flex gap-1 pb-1">
            {[undefined, "draft", "issued", "paid", "cancelled"].map((s) => (
              <Link key={s ?? "all"} href={qs({ status: s })} className={cn("rounded-full px-3 py-1 text-xs", status === s ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                {s ? INVOICE_STATUS[s].label : "All"}
              </Link>
            ))}
          </div>
        )}
      </div>

      {tab === "invoices" ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Number</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Customer / supplier</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No invoices yet. <Link href="/invoices/new" className="text-blue-600">Create the first one</Link>.</td></tr>
              )}
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/invoices/${i.id}`} className="font-mono text-blue-700 hover:underline">{i.number}</Link>
                    {i.externalNo && <p className="text-xs text-gray-400">No. {i.externalNo}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {i.source === "created" ? "Created here" : i.direction === "incoming" ? "Received (supplier)" : "Uploaded (issued by PQT)"}
                    {i._count.vouchers > 0 && <span className="ml-1 inline-flex items-center gap-0.5 text-gray-400"><Paperclip className="h-3 w-3" />{i._count.vouchers}</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {i.partyName}
                    {i.client && <p className="text-xs text-gray-400">{i.client.clientCode}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{i.issueDate}</td>
                  <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{money(i.total, i.currency)}</td>
                  <td className="px-4 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", INVOICE_STATUS[i.status]?.color)}>{INVOICE_STATUS[i.status]?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Voucher</th>
                <th className="px-4 py-2 font-medium">What for</th>
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium text-right">Amount</th>
                <th className="px-4 py-2 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No vouchers yet. <Link href="/invoices/upload" className="text-blue-600">Upload one</Link>.</td></tr>
              )}
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5"><Link href={`/invoices/vouchers/${v.id}`} className="font-mono text-blue-700 hover:underline">{v.refCode}</Link></td>
                  <td className="px-4 py-2.5">
                    <p>{v.vendor ?? v.description ?? v.originalName}</p>
                    <p className="text-xs text-gray-400">{voucherCategoryLabel(v.category)}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{v.client?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{v.voucherDate ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">{v.amount != null ? money(v.amount, v.currency ?? "") : <span className="text-amber-600 text-xs">check amount</span>}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {v.invoice ? <span className="font-mono">{v.invoice.number}</span> : (
                      <Link href={`/invoices/new?vouchers=${v.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline"><FileText className="h-3.5 w-3.5" /> Create invoice</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: typeof Receipt; color: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="text-lg font-semibold truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
