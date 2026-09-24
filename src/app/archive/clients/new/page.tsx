"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS: { name: string; label: string; placeholder?: string; wide?: boolean }[] = [
  { name: "name", label: "Full name *", placeholder: "As written in passport" },
  { name: "nationality", label: "Nationality" },
  { name: "email", label: "Email" },
  { name: "phone", label: "Phone / WhatsApp" },
  { name: "passportNo", label: "Passport number" },
  { name: "properties", label: "Properties / flats", placeholder: "e.g. Sinpaş Queen A-12, Westside B-4" },
  { name: "notes", label: "Notes", wide: true },
];

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/archive/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json.error || "Could not save");
    router.push(`/archive/clients/${json.id}`);
  }

  return (
    <form onSubmit={submit} className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <p className="text-sm text-gray-500">
        A client file gets a permanent code (PQT-0001, PQT-0002 …) that appears on every document tag.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.name} className={f.wide ? "sm:col-span-2" : ""}>
            <span className="text-sm font-medium text-gray-700">{f.label}</span>
            {f.wide ? (
              <textarea rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
            ) : (
              <input placeholder={f.placeholder} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
            )}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
        {saving ? "Saving…" : "Create client file"}
      </button>
    </form>
  );
}
