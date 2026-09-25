import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Download, Printer, Sparkles } from "lucide-react";
import SectionBadge from "@/components/archive/SectionBadge";
import DocEditor from "@/components/archive/DocEditor";
import { formatBytes } from "@/lib/archive/storage";

export const dynamic = "force-dynamic";

function when(d: Date) {
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, include: { client: true } });
  if (!doc) notFound();

  const [history, versions] = await Promise.all([
    prisma.auditLog.findMany({ where: { documentId: id }, orderBy: { createdAt: "desc" } }),
    prisma.document.findMany({
      where: { clientId: doc.clientId, OR: [{ id: doc.previousId ?? "-" }, { previousId: doc.id }] },
      select: { id: true, refCode: true, version: true, status: true, createdAt: true },
    }),
  ]);

  const fileUrl = `/api/archive/documents/${doc.id}/file`;
  const isImage = doc.mimeType.startsWith("image/");
  const isPdf = doc.mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      <Link href={`/archive/clients/${doc.clientId}?section=${doc.section}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> {doc.client.name} ({doc.client.clientCode})
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold text-blue-700">{doc.refCode}</p>
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <div className="mt-1 flex items-center gap-2">
            <SectionBadge section={doc.section} category={doc.category} />
            {doc.status !== "active" && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">{doc.status}{doc.statusReason ? `: ${doc.statusReason}` : ""}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`${fileUrl}?download=1`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Download className="h-4 w-4" /> Download
          </a>
          <Link href={`/archive/tags?ids=${doc.id}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Print reference tag
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[480px] flex items-center justify-center">
          {isPdf ? (
            <iframe src={fileUrl} className="w-full h-[75vh]" title={doc.title} />
          ) : isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt={doc.title} className="max-h-[75vh] object-contain" />
          ) : (
            <p className="text-sm text-gray-500 p-10">No preview for this file type — use Download.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <DocEditor doc={doc} />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm space-y-1.5">
            <p className="font-semibold mb-1">Archive record</p>
            <Row k="Original file" v={doc.originalName} />
            <Row k="Size / type" v={`${formatBytes(doc.sizeBytes)} · ${doc.mimeType}`} />
            <Row k="Uploaded" v={`${when(doc.createdAt)} by ${doc.uploadedBy ?? "—"}`} />
            <Row k="Version" v={String(doc.version)} />
            <Row k="Fingerprint" v={<span className="font-mono text-[10px] break-all">{doc.sha256}</span>} />
            <div className="mt-2 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600 flex gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
              <span>
                Filed by {doc.classifiedBy === "ai" ? "AI agent" : doc.classifiedBy === "manual" ? "staff" : "keyword sorter"}
                {doc.aiConfidence != null && doc.classifiedBy !== "manual" && ` (${Math.round(doc.aiConfidence * 100)}% sure)`}: {doc.aiReason}
              </span>
            </div>
            {versions.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-gray-600">Other versions</p>
                {versions.map((v) => (
                  <Link key={v.id} href={`/archive/documents/${v.id}`} className="block text-xs text-blue-600 hover:underline">
                    {v.refCode} · v{v.version} · {v.status}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold mb-2">History</p>
            <ul className="space-y-2 text-xs">
              {history.map((h) => (
                <li key={h.id} className="border-l-2 border-blue-200 pl-2">
                  <p className="font-medium text-gray-800">{h.action} <span className="font-normal text-gray-500">· {h.actor}</span></p>
                  <p className="text-gray-500">{when(h.createdAt)}{h.detail ? ` — ${h.detail}` : ""}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-gray-500">{k}</span>
      <span className="min-w-0 break-words">{v}</span>
    </div>
  );
}
