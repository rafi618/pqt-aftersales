"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Upload, Download, Ban, RotateCcw } from "lucide-react";
import { SECTIONS } from "@/lib/archive/taxonomy";

interface Link {
  id: string;
  token: string;
  kind: string;
  label: string | null;
  clientName: string | null;
  invoiceNumber: string | null;
  section: string | null;
  expiresAt: string | null;
  revoked: boolean;
  uses: number;
  createdAt: string;
}

export default function LinksManager({ links, clients }: { links: Link[]; clients: { id: string; name: string; clientCode: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ kind: "upload", clientId: "", section: "", label: "", expiresInDays: "30" });
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const PATH: Record<string, string> = { upload: "u", download: "d", invoice: "i", "voucher-upload": "v" };
  const url = (l: Link) => `${typeof window !== "undefined" ? window.location.origin : ""}/s/${PATH[l.kind]}/${l.token}`;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/archive/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    router.refresh();
  }

  async function toggle(l: Link) {
    await fetch(`/api/archive/links/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoked: !l.revoked }),
    });
    router.refresh();
  }

  const input = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white rounded-xl border border-gray-200 p-5 grid gap-4 md:grid-cols-5 items-end">
        <label>
          <span className="text-xs font-medium text-gray-600">Link type</span>
          <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="upload">Upload (send us documents)</option>
            <option value="download">Download (view & save documents)</option>
            <option value="voucher-upload">Voucher upload (send receipts to accounts)</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-medium text-gray-600">Client</span>
          <select className={input} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            {form.kind !== "download" && <option value="">Any client (uploader types the name)</option>}
            {form.kind === "download" && <option value="">— choose client —</option>}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.clientCode})</option>
            ))}
          </select>
        </label>
        {form.kind === "download" ? (
          <label>
            <span className="text-xs font-medium text-gray-600">Only this section (optional)</span>
            <select className={input} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              <option value="">All sections</option>
              {SECTIONS.filter((s) => s.id !== "unsorted").map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            <span className="text-xs font-medium text-gray-600">Name for this link</span>
            <input className={input} placeholder="e.g. Lawyer Mehmet" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>
        )}
        <label>
          <span className="text-xs font-medium text-gray-600">Expires after</span>
          <select className={input} value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="0">Never</option>
          </select>
        </label>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create link</button>
        {form.kind === "download" && (
          <label className="md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Name for this link</span>
            <input className={input} placeholder="e.g. Client's lawyer" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>
        )}
        {error && <p className="md:col-span-5 text-sm text-red-600">{error}</p>}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Name / client</th>
              <th className="px-4 py-2 font-medium">Link</th>
              <th className="px-4 py-2 font-medium">Expires</th>
              <th className="px-4 py-2 font-medium">Used</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {links.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No links yet.</td></tr>
            )}
            {links.map((l) => {
              const expired = l.expiresAt && new Date(l.expiresAt) < new Date();
              const dead = l.revoked || expired;
              return (
                <tr key={l.id} className={dead ? "opacity-50" : ""}>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${l.kind.includes("upload") ? "bg-emerald-100 text-emerald-800" : l.kind === "invoice" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"}`}>
                      {l.kind.includes("upload") ? <Upload className="h-3 w-3" /> : <Download className="h-3 w-3" />} {l.kind}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{l.label || "—"}</p>
                    <p className="text-xs text-gray-500">{l.invoiceNumber ? `Invoice ${l.invoiceNumber}` : l.clientName ?? "Any client"}{l.section ? ` · ${l.section}` : ""}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(url(l));
                        setCopied(l.id);
                      }}
                      className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 hover:underline"
                    >
                      /s/{PATH[l.kind]}/{l.token.slice(0, 8)}…
                      {copied === l.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{l.revoked ? "Revoked" : expired ? "Expired" : l.expiresAt ? new Date(l.expiresAt).toLocaleDateString("en-GB") : "Never"}</td>
                  <td className="px-4 py-2.5 text-xs">{l.uses}×</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => toggle(l)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-red-600">
                      {l.revoked ? <><RotateCcw className="h-3.5 w-3.5" /> Re-enable</> : <><Ban className="h-3.5 w-3.5" /> Revoke</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
