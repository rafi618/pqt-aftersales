"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip, Plus, Trash2, Send, Save, Loader2, FileText, UserRound, Receipt, Sparkles } from "lucide-react";
import { computeTotals, CURRENCIES, money, newKey, VOUCHER_CATEGORIES } from "@/lib/invoices/config";
import { cn } from "@/lib/utils";

export interface ComposerRow {
  key: string;
  category: string; // purpose; "none" = plain line
  details: string;
  amount: number;
  file?: File | null;
  voucherId?: string | null;
  voucherRef?: string | null;
  reading?: boolean;
  readNote?: string | null;
}

export interface ComposerClient {
  id: string;
  name: string;
  clientCode: string;
  email: string | null;
  passportNo: string | null;
}

export interface ComposerVoucher {
  id: string;
  refCode: string;
  clientId: string | null;
  category: string;
  description: string | null;
  vendor: string | null;
  amount: number | null;
}

export interface ComposerInitial {
  invoiceId?: string;
  number?: string;
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
  rows: ComposerRow[];
}


const PURPOSES = [{ id: "none", label: "Service / fee (no receipt)" }, ...VOUCHER_CATEGORIES];

export default function InvoiceComposer({
  initial,
  clients,
  vouchers,
}: {
  initial: ComposerInitial;
  clients: ComposerClient[];
  vouchers: ComposerVoucher[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (p: Partial<ComposerInitial>) => setV((s) => ({ ...s, ...p }));
  const setRow = (key: string, p: Partial<ComposerRow>) =>
    setV((s) => ({ ...s, rows: s.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) }));

  const client = clients.find((c) => c.id === v.clientId);
  const totals = useMemo(
    () => computeTotals(v.rows.map((r) => ({ description: r.details, quantity: 1, unitPrice: Number(r.amount) || 0 })), v.vatRate),
    [v.rows, v.vatRate]
  );
  const usedIds = new Set(v.rows.map((r) => r.voucherId).filter(Boolean));
  const clientVouchers = vouchers.filter((x) => x.clientId === v.clientId && !usedIds.has(x.id));

  function pickClient(id: string) {
    const c = clients.find((x) => x.id === id);
    set({
      clientId: id,
      ...(c ? { partyName: c.name, partyEmail: c.email ?? "", partyTaxId: c.passportNo ?? "" } : {}),
    });
  }

  // Adding receipts: each file becomes a row; the agent pre-fills purpose and cost if it can.
  async function addFiles(list: FileList | null) {
    if (!list) return;
    const added: ComposerRow[] = Array.from(list).map((file) => ({
      key: newKey(), category: "other", details: "", amount: 0, file, reading: true,
    }));
    setV((s) => ({ ...s, rows: [...s.rows.filter((r) => r.details || r.amount || r.file || r.voucherId), ...added] }));
    for (const row of added) {
      try {
        const fd = new FormData();
        fd.append("file", row.file as File);
        const res = await fetch("/api/vouchers/read", { method: "POST", body: fd });
        const x = await res.json();
        const note = x.by === "ai" ? "Filled in by the AI agent — please check" : x.total != null ? "Guessed from the file name — please check" : "Please enter the purpose and cost";
        const filled = { reading: false, category: x.category ?? "other", details: x.description ?? "", amount: typeof x.total === "number" ? x.total : 0 };
        // One update, so the currency check sees the latest rows.
        // Receipt in another currency: switch the invoice if nothing else is priced yet, otherwise warn.
        setV((s) => {
          const rows = s.rows.map((r) => (r.key === row.key ? { ...r, ...filled, readNote: note } : r));
          if (!x.currency || x.currency === s.currency) return { ...s, rows };
          const priced = s.rows.some((r) => r.key !== row.key && r.amount && !r.reading);
          if (!priced) return { ...s, rows, currency: x.currency };
          return {
            ...s,
            rows: rows.map((r) => (r.key === row.key ? { ...r, readNote: `Receipt is in ${x.currency} but the invoice is in ${s.currency} — convert the cost` } : r)),
          };
        });
      } catch {
        setRow(row.key, { reading: false, readNote: "Please enter the purpose and cost" });
      }
    }
  }

  function addExisting(id: string) {
    const x = vouchers.find((o) => o.id === id);
    if (!x) return;
    setV((s) => ({
      ...s,
      rows: [
        ...s.rows.filter((r) => r.details || r.amount || r.file || r.voucherId),
        { key: newKey(), category: x.category, details: x.description ?? x.vendor ?? "", amount: x.amount ?? 0, voucherId: x.id, voucherRef: x.refCode },
      ],
    }));
  }

  async function save(status: "draft" | "issued") {
    setError("");
    if (!v.clientId) return setError("Choose the client first.");
    setBusy(true);
    const files: File[] = [];
    const rows = v.rows.map((r) => {
      let fileIndex: number | null = null;
      if (r.file) {
        fileIndex = files.length;
        files.push(r.file);
      }
      return { category: r.category, details: r.details, amount: Number(r.amount) || 0, voucherId: r.voucherId ?? null, fileIndex };
    });
    const fd = new FormData();
    fd.append("data", JSON.stringify({ ...v, rows, status }));
    files.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/invoices/compose", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) {
      setBusy(false);
      return setError(json.error || "Could not save");
    }
    router.push(`/invoices/${json.id}`);
    router.refresh();
  }

  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  const label = "text-xs font-medium text-gray-600";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* 1. Client */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">1</span>
            Client
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <label className="block flex-1 min-w-[260px]">
              <span className={label}>Which client is this invoice for? *</span>
              <select className={cn(input, !v.clientId && "border-blue-400 ring-2 ring-blue-100")} value={v.clientId} onChange={(e) => pickClient(e.target.value)}>
                <option value="">— choose client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.clientCode} · {c.name}</option>
                ))}
              </select>
            </label>
            <Link href="/archive/clients/new" className="text-sm text-blue-600 hover:underline pb-2">+ New client</Link>
          </div>
          {client && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              The invoice and its vouchers will be saved under <b>{client.name}</b> <span className="font-mono text-blue-700">{client.clientCode}</span>
            </div>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600">Bill-to details printed on the invoice</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block"><span className={label}>Name / company *</span><input className={input} value={v.partyName} onChange={(e) => set({ partyName: e.target.value })} /></label>
              <label className="block"><span className={label}>Email</span><input className={input} value={v.partyEmail} onChange={(e) => set({ partyEmail: e.target.value })} /></label>
              <label className="block sm:col-span-2"><span className={label}>Address</span><input className={input} value={v.partyAddress} onChange={(e) => set({ partyAddress: e.target.value })} /></label>
              <label className="block"><span className={label}>Tax / passport number</span><input className={input} value={v.partyTaxId} onChange={(e) => set({ partyTaxId: e.target.value })} /></label>
            </div>
          </details>
        </div>

        {/* 2. Vouchers */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">2</span>
            Vouchers — purpose and cost
          </h3>

          {v.rows.length === 0 && (
            <p className="text-sm text-gray-500">No vouchers yet. Add a receipt below — each one becomes a line on the invoice.</p>
          )}

          <div className="space-y-3">
            {v.rows.map((r, i) => (
              <div key={r.key} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span className="font-semibold text-gray-700">#{i + 1}</span>
                  {r.file ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700"><Paperclip className="h-3 w-3" />{r.file.name}</span>
                  ) : r.voucherRef ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700"><Receipt className="h-3 w-3" />{r.voucherRef}</span>
                  ) : (
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-gray-100 px-2 py-0.5 hover:bg-gray-200">
                      <Paperclip className="h-3 w-3" /> attach receipt
                      <input type="file" hidden onChange={(e) => e.target.files?.[0] && setRow(r.key, { file: e.target.files[0] })} />
                    </label>
                  )}
                  {r.reading && <span className="inline-flex items-center gap-1 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> reading…</span>}
                  {r.readNote && !r.reading && <span className="inline-flex items-center gap-1 text-amber-600"><Sparkles className="h-3 w-3" />{r.readNote}</span>}
                  <button onClick={() => set({ rows: v.rows.filter((x) => x.key !== r.key) })} className="ml-auto text-gray-400 hover:text-red-500" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[220px_1fr_150px]">
                  <select className="rounded-lg border border-gray-300 px-2 py-2 text-sm" value={r.category} onChange={(e) => setRow(r.key, { category: e.target.value })}>
                    {PURPOSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                  <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Purpose / details, e.g. Tapu fee for flat A-12" value={r.details} onChange={(e) => setRow(r.key, { details: e.target.value })} />
                  <div className="relative">
                    <input type="number" min="0" step="0.01" className="w-full rounded-lg border border-gray-300 pl-3 pr-12 py-2 text-sm text-right" placeholder="Cost" value={r.amount || ""} onChange={(e) => setRow(r.key, { amount: Number(e.target.value) })} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{v.currency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Paperclip className="h-4 w-4" /> Add voucher (receipt)
            </button>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            <button onClick={() => set({ rows: [...v.rows, { key: newKey(), category: "none", details: "", amount: 0 }] })} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
              <Plus className="h-4 w-4" /> Add line without receipt
            </button>
            {clientVouchers.length > 0 && (
              <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" value="" onChange={(e) => addExisting(e.target.value)}>
                <option value="">+ Use a voucher already uploaded for this client ({clientVouchers.length})</option>
                {clientVouchers.map((x) => (
                  <option key={x.id} value={x.id}>{x.refCode} · {x.description ?? x.vendor ?? x.category}{x.amount != null ? ` · ${x.amount}` : ""}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block">
            <span className={label}>Notes printed on the invoice (payment terms, thank-you…)</span>
            <textarea rows={3} className={input} value={v.notes} onChange={(e) => set({ notes: e.target.value })} />
          </label>
        </div>
      </div>

      {/* 3. Totals & save */}
      <div className="space-y-4 lg:sticky lg:top-20 self-start">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">3</span>
            {v.number ? <span className="font-mono text-blue-700">{v.number}</span> : "Invoice"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className={label}>Issue date</span><input type="date" className={input} value={v.issueDate} onChange={(e) => set({ issueDate: e.target.value })} /></label>
            <label className="block"><span className={label}>Due date</span><input type="date" className={input} value={v.dueDate} onChange={(e) => set({ dueDate: e.target.value })} /></label>
            <label className="block">
              <span className={label}>Currency</span>
              <select className={input} value={v.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block"><span className={label}>VAT %</span><input type="number" min="0" step="1" className={input} value={v.vatRate} onChange={(e) => set({ vatRate: Number(e.target.value) })} /></label>
          </div>
          <div className="border-t border-gray-100 pt-3 text-sm space-y-1">
            {v.rows.filter((r) => r.amount).map((r, i) => (
              <div key={r.key} className="flex justify-between gap-2 text-xs text-gray-500">
                <span className="truncate">#{i + 1} {r.details || PURPOSES.find((p) => p.id === r.category)?.label}</span>
                <span className="whitespace-nowrap">{money(Number(r.amount) || 0, v.currency)}</span>
              </div>
            ))}
            <div className="flex justify-between text-gray-600 pt-1"><span>Subtotal</span><span>{money(totals.subtotal, v.currency)}</span></div>
            <div className="flex justify-between text-gray-600"><span>VAT {v.vatRate}%</span><span>{money(totals.vatAmount, v.currency)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{money(totals.total, v.currency)}</span></div>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-2">
          <button disabled={busy} onClick={() => save("issued")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Generate invoice
          </button>
          <button disabled={busy} onClick={() => save("draft")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60">
            <Save className="h-4 w-4" /> Save as draft
          </button>
          <p className="text-[11px] text-gray-400 flex gap-1"><FileText className="h-3.5 w-3.5 shrink-0" /> Receipts are saved as vouchers in the client&apos;s record and printed as lines on the invoice. Once generated, an invoice can only be marked paid or cancelled.</p>
        </div>
      </div>
    </div>
  );
}
