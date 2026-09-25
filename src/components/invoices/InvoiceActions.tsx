"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, CheckCircle2, RotateCcw, XCircle, Pencil, Link2, Copy, Check, Download } from "lucide-react";

export default function InvoiceActions({
  id,
  status,
  source,
  partyName,
  links,
}: {
  id: string;
  status: string;
  source: string;
  partyName: string;
  links: { token: string; expiresAt: string | null }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function act(action: string, extra: object = {}) {
    setError("");
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error);
    router.refresh();
  }

  async function share() {
    const res = await fetch("/api/archive/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "invoice", invoiceId: id, label: `Invoice for ${partyName}`, expiresInDays: 90 }),
    });
    const link = await res.json();
    setUrl(`${window.location.origin}/s/i/${link.token}`);
    router.refresh();
  }

  const btn = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium";
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <a href={`/api/invoices/${id}/pdf?download=1`} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
          <Download className="h-4 w-4" /> Download {source === "uploaded" ? "file" : "PDF"}
        </a>
        {(status === "draft" || source === "uploaded") && (
          <Link href={`/invoices/${id}/edit`} className={`${btn} border border-gray-300 bg-white hover:bg-gray-50`}>
            <Pencil className="h-4 w-4" /> Edit {source === "uploaded" ? "details" : "draft"}
          </Link>
        )}
        {status === "draft" && (
          <button onClick={() => act("issue")} className={`${btn} border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
            <Send className="h-4 w-4" /> Issue invoice
          </button>
        )}
        {status === "issued" && (
          <button onClick={() => act("paid")} className={`${btn} border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
            <CheckCircle2 className="h-4 w-4" /> Mark as paid
          </button>
        )}
        {status === "paid" && (
          <button onClick={() => act("unpaid")} className={`${btn} border border-gray-300 bg-white hover:bg-gray-50`}>
            <RotateCcw className="h-4 w-4" /> Mark as unpaid
          </button>
        )}
        {status !== "cancelled" && (
          <button
            onClick={() => {
              const reason = prompt("Why is this invoice being cancelled? (It stays in the records.)");
              if (reason) act("cancel", { reason });
            }}
            className={`${btn} border border-gray-300 bg-white text-red-600 hover:bg-red-50`}
          >
            <XCircle className="h-4 w-4" /> Cancel invoice
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm font-semibold mb-1">Share with the customer</p>
        <p className="text-xs text-gray-500 mb-2">Creates a private link (valid 90 days) where they can view and download this invoice — no login needed.</p>
        {url ? (
          <div className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 pl-3 pr-1 py-1 text-xs">
            <span className="font-mono truncate flex-1">{url}</span>
            <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); }} className="rounded p-1.5 hover:bg-blue-100">
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <button onClick={share} className={`${btn} w-full border border-gray-300 bg-white hover:bg-gray-50`}>
            <Link2 className="h-4 w-4" /> Create share link
          </button>
        )}
        {links.length > 0 && <p className="mt-2 text-[11px] text-gray-400">{links.length} active link{links.length > 1 ? "s" : ""} — manage them under Share Links.</p>}
      </div>
    </div>
  );
}
