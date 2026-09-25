"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, CheckCircle2, AlertTriangle, Loader2, Sparkles, Receipt, FileInput, FileOutput } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "voucher", icon: Receipt, title: "Voucher / receipt", text: "Any receipt, bill, bank slip or payment proof. Can be turned into an invoice later." },
  { id: "invoice-out", icon: FileOutput, title: "PQT invoice (made elsewhere)", text: "An invoice PQT already issued, e.g. the official e-Arşiv / e-Fatura PDF." },
  { id: "invoice-in", icon: FileInput, title: "Supplier invoice", text: "An invoice someone sent to PQT (lawyer, translator, developer…)." },
];

interface Result {
  ok: boolean;
  fileName: string;
  id?: string;
  ref?: string;
  kind?: "voucher" | "invoice";
  summary?: string;
  reason?: string;
  extractedBy?: string;
  error?: string;
}

export default function InvoiceUploader({ clientNames }: { clientNames: string[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState("voucher");
  const [files, setFiles] = useState<File[]>([]);
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [dragging, setDragging] = useState(false);

  async function submit() {
    setError("");
    if (!files.length) return setError("Add at least one file.");
    setBusy(true);
    const fd = new FormData();
    fd.append("kind", kind);
    files.forEach((f) => fd.append("files", f));
    if (clientName.trim()) fd.append("clientName", clientName.trim());
    if (note) fd.append("note", note);
    const res = await fetch("/api/invoices/upload", { method: "POST", body: fd });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) return setError(json.error || "Upload failed");
    setResults(json.results);
    setFiles([]);
    router.refresh();
  }

  const okVouchers = results?.filter((r) => r.ok && r.kind === "voucher").map((r) => r.id) ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={cn("text-left rounded-xl border-2 bg-white p-4 transition-colors", kind === k.id ? "border-blue-600 bg-blue-50/40" : "border-gray-200 hover:border-gray-300")}
          >
            <k.icon className={cn("h-6 w-6", kind === k.id ? "text-blue-600" : "text-gray-400")} />
            <p className="mt-2 text-sm font-semibold">{k.title}</p>
            <p className="text-xs text-gray-500">{k.text}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <label className="block max-w-md">
          <span className="text-sm font-medium text-gray-700">Client (optional)</span>
          <input list="inv-clients" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Link these files to a client, e.g. John Sample" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <datalist id="inv-clients">{clientNames.map((n) => <option key={n} value={n} />)}</datalist>
        </label>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); setFiles((p) => [...p, ...Array.from(e.dataTransfer.files)]); setResults(null); }}
          onClick={() => input.current?.click()}
          className={cn("cursor-pointer rounded-xl border-2 border-dashed p-8 text-center", dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50")}
        >
          <UploadCloud className="mx-auto h-10 w-10 text-blue-500" />
          <p className="mt-2 text-sm font-medium">Drop files here, or click to choose — photos of receipts work too</p>
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1"><Sparkles className="h-3.5 w-3.5" /> The agent reads the amount, date, vendor and type</p>
          <input ref={input} type="file" multiple hidden onChange={(e) => { setFiles((p) => [...p, ...Array.from(e.target.files ?? [])]); setResults(null); }} />
        </div>

        {files.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="flex-1 truncate">{f.name}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note, e.g. “tapu fees for flat A-12”" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button onClick={submit} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? "Reading…" : `Upload ${files.length || ""}`}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {results && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold mb-2">Uploaded</p>
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {r.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />}
                <div>
                  <span className="font-medium">{r.fileName}</span>{" "}
                  {r.ok ? (
                    <>
                      → <Link href={r.kind === "voucher" ? `/invoices/vouchers/${r.id}` : `/invoices/${r.id}`} className="font-mono text-blue-700 hover:underline">{r.ref}</Link>{" "}
                      <span className="text-gray-600">{r.summary}</span>
                      <span className="block text-xs text-gray-500">{r.extractedBy === "ai" ? "AI agent" : "Keyword sorter"} · {r.reason}</span>
                    </>
                  ) : <span className="text-amber-700">— {r.error}</span>}
                </div>
              </li>
            ))}
          </ul>
          {okVouchers.length > 0 && (
            <Link href={`/invoices/new?vouchers=${okVouchers.join(",")}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <FileText className="h-4 w-4" /> Create an invoice from {okVouchers.length === 1 ? "this voucher" : `these ${okVouchers.length} vouchers`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
