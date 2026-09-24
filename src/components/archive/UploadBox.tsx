"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, CheckCircle2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Result {
  ok: boolean;
  fileName: string;
  refCode?: string;
  documentId?: string;
  categoryLabel?: string;
  section?: string;
  confidence?: number;
  reason?: string;
  classifiedBy?: string;
  error?: string;
}

export default function UploadBox({
  endpoint,
  clientId,
  askClientName = false,
  askUploaderName = false,
  clientNames = [],
  showDetails = true,
  compact = false,
}: {
  endpoint: string;
  clientId?: string;
  askClientName?: boolean;
  askUploaderName?: boolean;
  clientNames?: string[];
  showDetails?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [clientName, setClientName] = useState("");
  const [uploader, setUploader] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [resultClient, setResultClient] = useState("");

  function add(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    setResults(null);
  }

  async function submit() {
    setError("");
    if (askClientName && !clientName.trim()) return setError("Please type the client's full name.");
    if (askUploaderName && !uploader.trim()) return setError("Please type your name.");
    if (files.length === 0) return setError("Add at least one file.");
    setBusy(true);
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    if (clientId) fd.append("clientId", clientId);
    if (askClientName) fd.append("clientName", clientName.trim());
    if (uploader) fd.append("uploadedBy", uploader.trim());
    if (note) fd.append("note", note);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setResults(json.results);
      setResultClient(typeof json.client === "string" ? json.client : json.client?.name ?? "");
      setFiles([]);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {(askClientName || askUploaderName) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {askClientName && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Client full name *</span>
              <input
                list="client-names"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. John Smith"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <datalist id="client-names">
                {clientNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <span className="text-xs text-gray-500">
                Same name = same client folder. A new name creates a new client.
              </span>
            </label>
          )}
          {askUploaderName && (
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Your name *</span>
              <input
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                placeholder="Who is uploading?"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed text-center transition-colors",
          compact ? "p-5" : "p-10",
          dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        )}
      >
        <UploadCloud className="mx-auto h-10 w-10 text-blue-500" />
        <p className="mt-2 text-sm font-medium text-gray-800">
          Drop any number of documents here, or click to choose
        </p>
        <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
          <Sparkles className="h-3.5 w-3.5" /> The agent reads each file and files it in the right folder automatically
        </p>
        <input ref={input} type="file" multiple hidden onChange={(e) => add(e.target.files)} />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for the agent, e.g. “Flat A-12, Sinpaş Queen”"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {busy ? "Sorting…" : `Upload ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Filed for {resultClient}:
          </p>
          <ul className="space-y-1.5">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                {r.ok ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-medium">{r.fileName}</span>{" "}
                  {r.ok ? (
                    <>
                      → <span className="font-mono text-blue-700">{r.refCode}</span> in{" "}
                      <span className="font-medium">{r.categoryLabel}</span>
                      {showDetails && r.reason && (
                        <span className="block text-xs text-gray-500">
                          {r.classifiedBy === "ai" ? "AI agent" : r.classifiedBy === "manual" ? "Manual" : "Keyword sorter"}
                          {typeof r.confidence === "number" && ` · ${Math.round(r.confidence * 100)}% sure`} · {r.reason}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-amber-700">— {r.error}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
