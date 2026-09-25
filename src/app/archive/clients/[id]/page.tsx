import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Receipt, Download, Printer, Folder, FolderOpen, FileText, Mail, Phone, Flag, Home, CheckCircle2, Circle, Tag } from "lucide-react";
import { SECTIONS, CBI_CHECKLIST, getSection } from "@/lib/archive/taxonomy";
import { formatBytes } from "@/lib/archive/storage";
import { formatDate, cn } from "@/lib/utils";
import UploadBox from "@/components/archive/UploadBox";
import QuickLink from "@/components/archive/QuickLink";

export const dynamic = "force-dynamic";

export default async function ClientFile({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; retired?: string }>;
}) {
  const { id } = await params;
  const { section: sectionParam, retired } = await searchParams;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { documents: { orderBy: { refCode: "asc" } }, _count: { select: { invoices: true, vouchers: true } } },
  });
  if (!client) notFound();

  const active = client.documents.filter((d) => d.status === "active");
  const shown = retired ? client.documents.filter((d) => d.status !== "active") : active;
  const section = getSection(sectionParam ?? (active.some((d) => d.section === "unsorted") ? "unsorted" : "legal"));
  const inSection = shown.filter((d) => d.section === section.id);
  const has = new Set(active.map((d) => d.category));

  return (
    <div className="space-y-6">
      {/* Client header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{client.name}</h2>
            <p className="font-mono text-sm text-blue-700">{client.clientCode}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {client.nationality && <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{client.nationality}</span>}
              {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
              {client.properties && <span className="flex items-center gap-1"><Home className="h-3 w-3" />{client.properties}</span>}
              {client.passportNo && <span>Passport {client.passportNo}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/archive/clients/${client.id}/zip`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Download className="h-4 w-4" /> Download all (ZIP)
          </a>
          <Link href={`/archive/tags?client=${client.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Print all tags
          </Link>
          <Link href={`/invoices/new?client=${client.id}`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Receipt className="h-4 w-4" /> Create invoice
          </Link>
          <Link href={`/invoices?client=${client.id}`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">
            <Receipt className="h-4 w-4" /> Invoices ({client._count.invoices}) · Vouchers ({client._count.vouchers})
          </Link>
          <QuickLink clientId={client.id} clientName={client.name} kind="upload" />
          <QuickLink clientId={client.id} clientName={client.name} kind="download" />
        </div>
      </div>

      <UploadBox endpoint="/api/archive/upload" clientId={client.id} compact />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Section tabs */}
        <nav className="space-y-1">
          {SECTIONS.map((s) => {
            const n = shown.filter((d) => d.section === s.id).length;
            const current = s.id === section.id;
            return (
              <Link
                key={s.id}
                href={`/archive/clients/${client.id}?section=${s.id}${retired ? "&retired=1" : ""}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  current ? "bg-white border border-gray-200 shadow-sm font-semibold" : "text-gray-600 hover:bg-white"
                )}
              >
                {current ? <FolderOpen className="h-4 w-4 text-blue-600" /> : <Folder className="h-4 w-4 text-gray-400" />}
                <span className="flex-1">{s.label}</span>
                <span className={cn("rounded-full px-2 text-xs", n ? (s.id === "unsorted" ? "bg-amber-100 text-amber-800" : "bg-gray-100") : "text-gray-300")}>{n}</span>
              </Link>
            );
          })}
          <Link
            href={`/archive/clients/${client.id}?section=${section.id}${retired ? "" : "&retired=1"}`}
            className="block px-3 pt-3 text-xs text-gray-500 hover:text-blue-600"
          >
            {retired ? "← Back to active documents" : "Show retired / older versions"}
          </Link>
        </nav>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{section.label}{retired ? " — retired & superseded" : ""}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            {inSection.length > 0 && !retired && (
              <a href={`/api/archive/clients/${client.id}/zip?section=${section.id}`} className="text-sm text-blue-600 hover:underline">
                Download this section
              </a>
            )}
          </div>

          {section.id === "citizenship" && !retired && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold mb-2">
                CBI checklist — {CBI_CHECKLIST.filter((c) => c.categories.some((x) => has.has(x))).length} of {CBI_CHECKLIST.length} in the file
              </p>
              <ol className="grid gap-1 sm:grid-cols-2 text-sm">
                {CBI_CHECKLIST.map((c, i) => {
                  const done = c.categories.some((x) => has.has(x));
                  return (
                    <li key={c.step} className={cn("flex items-center gap-2", done ? "text-gray-900" : "text-gray-400")}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4" />}
                      <span className="text-xs w-5 text-gray-400">{i + 1}.</span>
                      {c.step}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {section.categories.map((cat) => {
            const docs = inSection.filter((d) => d.category === cat.id);
            if (docs.length === 0 && (retired || section.id === "unsorted")) return null;
            return (
              <div key={cat.id} className={cn("bg-white rounded-xl border", docs.length ? "border-gray-200" : "border-dashed border-gray-200")}>
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100">
                  <Folder className={cn("h-4 w-4", docs.length ? "text-blue-500" : "text-gray-300")} />
                  <span className={cn("text-sm font-medium", !docs.length && "text-gray-400")}>{cat.label}</span>
                  <span className="text-xs text-gray-400">{docs.length || "empty"}</span>
                </div>
                {docs.length > 0 && (
                  <ul className="divide-y divide-gray-50">
                    {docs.map((d) => (
                      <li key={d.id} className="px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-gray-50">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-mono text-xs text-blue-700 w-28 shrink-0">{d.refCode}</span>
                        <Link href={`/archive/documents/${d.id}`} className="flex-1 min-w-0 truncate hover:text-blue-600">
                          {d.title}
                          {d.version > 1 && <span className="ml-1 text-xs text-gray-400">v{d.version}</span>}
                          {d.status !== "active" && <span className="ml-2 rounded bg-gray-100 px-1.5 text-xs text-gray-500">{d.status}</span>}
                        </Link>
                        {d.unitRef && <span className="text-xs text-gray-500">{d.unitRef}</span>}
                        <span className="text-xs text-gray-400 w-24 text-right">{d.docDate ?? formatDate(d.createdAt)}</span>
                        <span className="text-xs text-gray-400 w-14 text-right">{formatBytes(d.sizeBytes)}</span>
                        <a href={`/api/archive/documents/${d.id}/file?download=1`} title="Download" className="p-1 text-gray-400 hover:text-blue-600"><Download className="h-4 w-4" /></a>
                        <Link href={`/archive/tags?ids=${d.id}`} target="_blank" title="Print tag" className="p-1 text-gray-400 hover:text-blue-600"><Tag className="h-4 w-4" /></Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {section.id === "unsorted" && inSection.length === 0 && (
            <p className="text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-5">Nothing waiting for review. 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
