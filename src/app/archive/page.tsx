import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Users, FileText, AlertCircle, UploadCloud, Search, Sparkles } from "lucide-react";
import { SECTIONS } from "@/lib/archive/taxonomy";
import { aiEnabled } from "@/lib/archive/classifier";
import SectionBadge from "@/components/archive/SectionBadge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400_000);
}

export default async function ArchiveHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const weekAgo = daysAgo(7);

  const [clients, docCount, reviewCount, weekCount, bySection, recent] = await Promise.all([
    prisma.client.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { clientCode: { contains: query.toUpperCase() } },
              { properties: { contains: query } },
              { passportNo: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
      include: { documents: { where: { status: "active" }, select: { section: true } } },
    }),
    prisma.document.count({ where: { status: "active" } }),
    prisma.document.count({ where: { status: "active", section: "unsorted" } }),
    prisma.document.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.document.groupBy({ by: ["section"], where: { status: "active" }, _count: true }),
    prisma.document.findMany({
      where: {
        status: "active",
        ...(query
          ? {
              OR: [
                { refCode: { contains: query.toUpperCase() } },
                { title: { contains: query } },
                { originalName: { contains: query } },
                { unitRef: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: query ? 50 : 8,
      include: { client: { select: { name: true, clientCode: true } } },
    }),
  ]);

  const sectionCount = Object.fromEntries(bySection.map((s) => [s.section, s._count]));

  const stats = [
    { label: "Clients", value: clients.length, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Documents archived", value: docCount, icon: FileText, color: "text-emerald-600 bg-emerald-50" },
    { label: "Uploaded this week", value: weekCount, icon: UploadCloud, color: "text-indigo-600 bg-indigo-50" },
    { label: "Need review", value: reviewCount, icon: AlertCircle, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search client name, PQT code, reference, flat, passport…"
            className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm"
          />
        </form>
        <div className="flex gap-2">
          <Link href="/archive/upload" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            <UploadCloud className="h-4 w-4" /> Upload
          </Link>
          <Link href="/archive/clients/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Client
          </Link>
        </div>
      </div>

      {!query && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 ${aiEnabled() ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            <Sparkles className="h-4 w-4" />
            {aiEnabled()
              ? "AI sorting agent is ON — it reads every uploaded document and files it."
              : "AI agent is OFF (no API key yet) — the keyword sorter is filing documents by their file names."}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {SECTIONS.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${s.color}`}>{s.code}</span>
                <p className="mt-2 text-sm font-medium text-gray-900">{s.label}</p>
                <p className="text-2xl font-semibold">{sectionCount[s.id] ?? 0}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{s.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold">{query ? `Clients matching “${query}”` : "Clients"}</h3>
            <span className="text-xs text-gray-500">{clients.length}</span>
          </div>
          {clients.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No clients found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Client</th>
                  {SECTIONS.map((s) => (
                    <th key={s.id} className="px-2 py-2 font-mono font-medium text-center" title={s.label}>{s.code}</th>
                  ))}
                  <th className="px-5 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <Link href={`/archive/clients/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">{c.name}</Link>
                      <p className="text-xs text-gray-500 font-mono">{c.clientCode}{c.nationality ? ` · ${c.nationality}` : ""}</p>
                    </td>
                    {SECTIONS.map((s) => {
                      const n = c.documents.filter((d) => d.section === s.id).length;
                      return (
                        <td key={s.id} className={`px-2 py-2.5 text-center ${n ? (s.id === "unsorted" ? "text-amber-600 font-semibold" : "text-gray-900") : "text-gray-300"}`}>{n}</td>
                      );
                    })}
                    <td className="px-5 py-2.5 text-right font-semibold">{c.documents.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold">{query ? "Matching documents" : "Latest uploads"}</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {recent.length === 0 && <li className="p-5 text-sm text-gray-500">Nothing yet.</li>}
            {recent.map((d) => (
              <li key={d.id} className="px-5 py-3">
                <Link href={`/archive/documents/${d.id}`} className="block hover:text-blue-600">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-mono">{d.refCode}</span> · {d.client.name} · {formatDate(d.createdAt)}
                  </p>
                  <SectionBadge section={d.section} className="mt-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
