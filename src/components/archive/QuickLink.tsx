"use client";

import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";

/** Creates an upload or download share link for one client and shows it to copy. */
export default function QuickLink({ clientId, clientName, kind }: { clientId: string; clientName: string; kind: "upload" | "download" }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/archive/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, clientId, label: `${clientName} – ${kind}`, expiresInDays: 30 }),
    });
    const link = await res.json();
    setBusy(false);
    setUrl(`${window.location.origin}/s/${kind === "upload" ? "u" : "d"}/${link.token}`);
  }

  if (url) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 pl-3 pr-1 py-1 text-xs">
        <span className="font-mono truncate max-w-[220px]">{url}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(url);
            setCopied(true);
          }}
          className="rounded p-1.5 hover:bg-blue-100"
          title="Copy"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    );
  }
  return (
    <button onClick={create} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
      <Link2 className="h-4 w-4" /> {kind === "upload" ? "Upload link" : "Download link"}
    </button>
  );
}
