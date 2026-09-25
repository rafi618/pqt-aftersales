"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, FileText, Archive, RotateCcw } from "lucide-react";
import { CURRENCIES, VOUCHER_CATEGORIES } from "@/lib/invoices/config";

interface V {
  id: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number | null;
  currency: string | null;
  voucherDate: string | null;
  clientId: string | null;
  invoiceId: string | null;
  status: string;
}

export default function VoucherEditor({ v, clients }: { v: V; clients: { id: string; name: string; clientCode: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    category: v.category,
    vendor: v.vendor ?? "",
    description: v.description ?? "",
    amount: v.amount == null ? "" : String(v.amount),
    currency: v.currency ?? "TRY",
    voucherDate: v.voucherDate ?? "",
    clientId: v.clientId ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function patch(body: object, ok: string) {
    const res = await fetch(`/api/vouchers/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    setMsg(res.ok ? { ok: true, text: ok } : { ok: false, text: json.error });
    router.refresh();
  }

  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  const label = "text-xs font-medium text-gray-600";
  return (
    <div className="space-y-3">
      <label className="block">
        <span className={label}>What was it for?</span>
        <select className={input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          {VOUCHER_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Paid to (vendor)</span>
        <input className={input} value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} />
      </label>
      <label className="block">
        <span className={label}>Description</span>
        <input className={input} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="block col-span-2">
          <span className={label}>Amount</span>
          <input type="number" step="0.01" className={input} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Currency</span>
          <select className={input} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={label}>Date</span>
          <input type="date" className={input} value={f.voucherDate} onChange={(e) => setF({ ...f, voucherDate: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Client</span>
          <select className={input} value={f.clientId} onChange={(e) => setF({ ...f, clientId: e.target.value })}>
            <option value="">— none —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>
      <button onClick={() => patch(f, "Saved.")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        <Save className="h-4 w-4" /> Save
      </button>
      {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

      <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
        {!v.invoiceId && v.status === "active" && (
          <Link href={`/invoices/new?vouchers=${v.id}`} className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
            <FileText className="h-4 w-4" /> Create invoice from this voucher
          </Link>
        )}
        {v.status === "active" ? (
          <button
            onClick={() => {
              const reason = prompt("Why is this voucher being retired? (It is kept, just hidden.)");
              if (reason) patch({ status: "retired", reason }, "Retired.");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Archive className="h-4 w-4" /> Retire
          </button>
        ) : (
          <button onClick={() => patch({ status: "active" }, "Restored.")} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <RotateCcw className="h-4 w-4" /> Restore
          </button>
        )}
      </div>
    </div>
  );
}
