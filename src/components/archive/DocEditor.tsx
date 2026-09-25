"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Archive, RotateCcw, Save, Upload } from "lucide-react";
import { SECTIONS } from "@/lib/archive/taxonomy";

interface Doc {
  id: string;
  clientId: string;
  category: string;
  title: string;
  notes: string | null;
  unitRef: string | null;
  docDate: string | null;
  status: string;
}

export default function DocEditor({ doc }: { doc: Doc }) {
  const router = useRouter();
  const [form, setForm] = useState({
    category: doc.category,
    title: doc.title,
    notes: doc.notes ?? "",
    unitRef: doc.unitRef ?? "",
    docDate: doc.docDate ?? "",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function patch(body: object, okText: string) {
    const res = await fetch(`/api/archive/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setMsg(res.ok ? { ok: true, text: okText } : { ok: false, text: json.error });
    router.refresh();
  }

  async function verify() {
    const res = await fetch(`/api/archive/documents/${doc.id}/verify`, { method: "POST" });
    const json = await res.json();
    setMsg({ ok: json.ok, text: json.message });
    router.refresh();
  }

  async function newVersion(files: FileList | null) {
    if (!files?.[0]) return;
    const fd = new FormData();
    fd.append("files", files[0]);
    fd.append("clientId", doc.clientId);
    fd.append("category", form.category);
    fd.append("previousId", doc.id);
    const res = await fetch("/api/archive/upload", { method: "POST", body: fd });
    const json = await res.json();
    const r = json.results?.[0];
    if (r?.ok) router.push(`/archive/documents/${r.documentId}`);
    else setMsg({ ok: false, text: r?.error || json.error || "Upload failed" });
  }

  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Folder (section › category)</span>
          <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {SECTIONS.map((s) => (
              <optgroup key={s.id} label={s.label}>
                {s.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Title</span>
          <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Flat / unit</span>
            <input className={input} value={form.unitRef} onChange={(e) => setForm({ ...form, unitRef: e.target.value })} placeholder="A-12" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Document date</span>
            <input type="date" className={input} value={form.docDate} onChange={(e) => setForm({ ...form, docDate: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Notes</span>
          <textarea rows={2} className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <button onClick={() => patch(form, "Saved.")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>

      {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

      <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2">
        <button onClick={verify} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          <ShieldCheck className="h-4 w-4 text-green-600" /> Verify integrity
        </button>
        {doc.status === "active" && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Upload newer version
            <input type="file" hidden onChange={(e) => newVersion(e.target.files)} />
          </label>
        )}
        {doc.status === "retired" ? (
          <button onClick={() => patch({ status: "active" }, "Restored.")} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            <RotateCcw className="h-4 w-4" /> Restore
          </button>
        ) : doc.status === "active" ? (
          <button
            onClick={() => {
              const reason = prompt("Why is this document being retired? (It is kept in the archive, just hidden.)");
              if (reason) patch({ status: "retired", statusReason: reason }, "Retired.");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Archive className="h-4 w-4" /> Retire
          </button>
        ) : null}
      </div>
    </div>
  );
}
