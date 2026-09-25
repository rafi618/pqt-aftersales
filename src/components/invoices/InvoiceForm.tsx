"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Send, Paperclip } from "lucide-react";
import { computeTotals, CURRENCIES, LineItem, money } from "@/lib/invoices/config";

export interface InvoiceFormValues {
  clientId: string;
  partyName: string;
  partyAddress: string;
  partyEmail: string;
  partyTaxId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  vatRate: number;
  notes: string;
  items: LineItem[];
  voucherIds: string[];
  // uploaded invoices only
  externalNo?: string;
  direction?: string;
  total?: number;
  vatAmount?: number;
}

interface VoucherOption {
  id: string;
  refCode: string;
  label: string;
  amount: number | null;
  currency: string | null;
}

export default function InvoiceForm({
  initial,
  clients,
  vouchers,
  invoiceId,
  uploaded = false,
}: {
  initial: InvoiceFormValues;
  clients: { id: string; name: string; clientCode: string; email: string | null }[];
  vouchers: VoucherOption[];
  invoiceId?: string;
  uploaded?: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState<InvoiceFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const totals = useMemo(() => computeTotals(v.items, v.vatRate), [v.items, v.vatRate]);
  const set = (patch: Partial<InvoiceFormValues>) => setV((p) => ({ ...p, ...patch }));
  const setItem = (i: number, patch: Partial<LineItem>) =>
    set({ items: v.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });

  function toggleVoucher(opt: VoucherOption) {
    const on = v.voucherIds.includes(opt.id);
    const voucherIds = on ? v.voucherIds.filter((x) => x !== opt.id) : [...v.voucherIds, opt.id];
    // Attaching a voucher also adds it as a line, so the amount is billed
    const items = on || uploaded
      ? v.items
      : [...v.items.filter((it) => it.description || it.unitPrice), { description: `${opt.label} (${opt.refCode})`, quantity: 1, unitPrice: opt.amount ?? 0 }];
    set({ voucherIds, items });
  }

  async function save(status: "draft" | "issued") {
    setError("");
    setBusy(true);
    const body = { ...v, status, action: "edit" };
    const res = await fetch(invoiceId ? `/api/invoices/${invoiceId}` : "/api/invoices", {
      method: invoiceId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(json.error || "Could not save");
    }
    if (invoiceId && status === "issued" && !uploaded) {
      await fetch(`/api/invoices/${invoiceId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "issue" }) });
    }
    router.push(`/invoices/${json.id}`);
    router.refresh();
  }

  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  const label = "text-xs font-medium text-gray-600";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold">{uploaded ? (v.direction === "incoming" ? "Supplier (who billed PQT)" : "Customer (who PQT billed)") : "Bill to"}</h3>
          <label className="block">
            <span className={label}>Client file (optional — links the invoice to the client)</span>
            <select
              className={input}
              value={v.clientId}
              onChange={(e) => {
                const c = clients.find((x) => x.id === e.target.value);
                set({ clientId: e.target.value, ...(c && !uploaded ? { partyName: v.partyName || c.name, partyEmail: v.partyEmail || c.email || "" } : {}) });
              }}
            >
              <option value="">— none —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Name / company *</span>
              <input className={input} value={v.partyName} onChange={(e) => set({ partyName: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Email</span>
              <input className={input} value={v.partyEmail} onChange={(e) => set({ partyEmail: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className={label}>Address</span>
              <input className={input} value={v.partyAddress} onChange={(e) => set({ partyAddress: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Tax / passport number</span>
              <input className={input} value={v.partyTaxId} onChange={(e) => set({ partyTaxId: e.target.value })} />
            </label>
          </div>
        </div>

        {uploaded ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Type</span>
              <select className={input} value={v.direction} onChange={(e) => set({ direction: e.target.value })}>
                <option value="outgoing">Issued by PQT (e.g. e-Arşiv)</option>
                <option value="incoming">Received from a supplier</option>
              </select>
            </label>
            <label className="block">
              <span className={label}>Number printed on the invoice</span>
              <input className={input} value={v.externalNo ?? ""} onChange={(e) => set({ externalNo: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Total (incl. VAT)</span>
              <input type="number" step="0.01" className={input} value={v.total ?? 0} onChange={(e) => set({ total: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className={label}>of which VAT</span>
              <input type="number" step="0.01" className={input} value={v.vatAmount ?? 0} onChange={(e) => set({ vatAmount: Number(e.target.value) })} />
            </label>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold">Lines</h3>
            <div className="grid grid-cols-[1fr_70px_120px_110px_32px] gap-2 text-xs font-medium text-gray-500">
              <span>Description</span><span>Qty</span><span>Unit price</span><span className="text-right">Amount</span><span />
            </div>
            {v.items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_120px_110px_32px] gap-2 items-center">
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Commission – Sinpaş Queen A-12" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                <input type="number" min="0" step="1" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                <input type="number" min="0" step="0.01" className="rounded-lg border border-gray-300 px-2 py-2 text-sm" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })} />
                <span className="text-right text-sm font-medium">{(it.quantity * it.unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <button onClick={() => set({ items: v.items.filter((_, k) => k !== i) })} className="text-gray-400 hover:text-red-500" title="Remove line">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={() => set({ items: [...v.items, { description: "", quantity: 1, unitPrice: 0 }] })} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus className="h-4 w-4" /> Add line
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block">
            <span className={label}>Notes printed on the invoice (payment terms, bank details, thank-you…)</span>
            <textarea rows={3} className={input} value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Issue date</span>
              <input type="date" className={input} value={v.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Due date</span>
              <input type="date" className={input} value={v.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Currency</span>
              <select className={input} value={v.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            {!uploaded && (
              <label className="block">
                <span className={label}>VAT %</span>
                <input type="number" min="0" step="1" className={input} value={v.vatRate} onChange={(e) => set({ vatRate: Number(e.target.value) })} />
              </label>
            )}
          </div>
          {!uploaded && (
            <div className="border-t border-gray-100 pt-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(totals.subtotal, v.currency)}</span></div>
              <div className="flex justify-between text-gray-600"><span>VAT {v.vatRate}%</span><span>{money(totals.vatAmount, v.currency)}</span></div>
              <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{money(totals.total, v.currency)}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-semibold text-sm mb-2 flex items-center gap-1"><Paperclip className="h-4 w-4" /> Attach vouchers</p>
          {vouchers.length === 0 ? (
            <p className="text-xs text-gray-500">No un-invoiced vouchers. Upload receipts under “Upload Voucher / Invoice”.</p>
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {vouchers.map((o) => (
                <li key={o.id}>
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={v.voucherIds.includes(o.id)} onChange={() => toggleVoucher(o)} />
                    <span>
                      <span className="font-mono text-blue-700">{o.refCode}</span> {o.label}
                      {o.amount != null && <span className="text-gray-500"> · {money(o.amount, o.currency ?? "")}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {!uploaded && <p className="mt-2 text-[11px] text-gray-400">Ticking a voucher adds it as a line and attaches the receipt to the invoice.</p>}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-2">
          {!uploaded && (
            <button disabled={busy} onClick={() => save("issued")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              <Send className="h-4 w-4" /> Save & issue invoice
            </button>
          )}
          <button disabled={busy} onClick={() => save("draft")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
            <Save className="h-4 w-4" /> {uploaded ? "Save changes" : "Save as draft"}
          </button>
          {!uploaded && <p className="text-[11px] text-gray-400">Once issued, an invoice can no longer be edited — only marked paid or cancelled. Drafts can be changed any time.</p>}
        </div>
      </div>
    </div>
  );
}
