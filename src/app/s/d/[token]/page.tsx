import { prisma } from "@/lib/prisma";
import { Download, FileText, Eye } from "lucide-react";
import { getValidLink } from "@/lib/archive/service";
import { SECTIONS, getCategory } from "@/lib/archive/taxonomy";
import { formatBytes } from "@/lib/archive/storage";
import PublicFrame, { LinkInvalid } from "@/components/archive/PublicFrame";

export const dynamic = "force-dynamic";

export default async function PublicDownload({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "download");
  if (!link || !link.client) return <LinkInvalid />;
  const docs = await prisma.document.findMany({
    where: { clientId: link.client.id, status: "active", section: link.section ? link.section : { not: "unsorted" } },
    orderBy: { refCode: "asc" },
  });

  return (
    <PublicFrame title={`Documents of ${link.client.name}`} subtitle={`Client file ${link.client.clientCode} · ${docs.length} documents`}>
      <a href={`/api/s/${token}/zip`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        <Download className="h-4 w-4" /> Download everything (ZIP)
      </a>
      {SECTIONS.map((s) => {
        const list = docs.filter((d) => d.section === s.id);
        if (!list.length) return null;
        return (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200">
            <p className="px-4 py-2.5 border-b border-gray-100 text-sm font-semibold">
              <span className={`mr-2 rounded px-1 font-mono text-xs ${s.color}`}>{s.code}</span>{s.label}
            </p>
            <ul className="divide-y divide-gray-50">
              {list.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{d.title}</p>
                    <p className="text-xs text-gray-500"><span className="font-mono">{d.refCode}</span> · {getCategory(d.category)?.label} · {formatBytes(d.sizeBytes)}</p>
                  </div>
                  <a href={`/api/s/${token}/file/${d.id}`} target="_blank" className="p-1.5 text-gray-400 hover:text-blue-600" title="View"><Eye className="h-4 w-4" /></a>
                  <a href={`/api/s/${token}/file/${d.id}?download=1`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Download"><Download className="h-4 w-4" /></a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </PublicFrame>
  );
}
