import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCategory, getSection } from "@/lib/archive/taxonomy";
import { publicBaseUrl } from "@/lib/archive/service";
import PrintButton from "@/components/archive/PrintButton";

export const dynamic = "force-dynamic";

// Printable reference tags. Sized 70 × 37 mm — standard A4 sheet of 24 stickers
// (3 × 8). Stick one on the first page of each printed document.
export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; client?: string }>;
}) {
  const { ids, client } = await searchParams;
  const docs = await prisma.document.findMany({
    where: {
      status: "active",
      ...(ids ? { id: { in: ids.split(",") } } : client ? { clientId: client } : { id: "-" }),
    },
    include: { client: true },
    orderBy: { refCode: "asc" },
  });
  const base = publicBaseUrl();
  const tags = await Promise.all(
    docs.map(async (d) => ({
      d,
      qr: await QRCode.toString(`${base}/archive/documents/${d.id}`, { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
    }))
  );

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @page { size: A4; margin: 8.5mm 0 0 0; }
        .tag { width: 70mm; height: 37mm; }
        @media print { .no-print { display: none !important; } }
      `}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-white px-6 py-3">
        <div>
          <p className="font-semibold">{tags.length} reference tag{tags.length === 1 ? "" : "s"}</p>
          <p className="text-xs text-gray-500">Fits A4 sticker sheets with 24 labels (70 × 37 mm). Choose “Actual size / 100%” when printing.</p>
        </div>
        <PrintButton ids={docs.map((d) => d.id)} />
      </div>
      <div className="mx-auto grid w-[210mm] grid-cols-3 bg-white print:w-[210mm]">
        {tags.map(({ d, qr }) => {
          const s = getSection(d.section);
          return (
            <div key={d.id} className="tag flex gap-[2mm] overflow-hidden border border-dashed border-gray-300 p-[2.5mm] print:border-transparent">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[7pt] font-bold tracking-widest text-gray-800">PROPERTY QUEST TURKEY</span>
                </div>
                <span className="mt-[1mm] font-mono text-[13pt] font-bold leading-none">{d.refCode}</span>
                <span className="mt-[1mm] truncate text-[8pt] font-semibold">{d.client.name}</span>
                <span className="text-[6.5pt] leading-tight">
                  <b className="font-mono">{s.code}</b> {s.label}
                </span>
                <span className="line-clamp-2 text-[6.5pt] leading-tight text-gray-700">{getCategory(d.category)?.label}</span>
                <span className="mt-auto text-[6pt] text-gray-500">
                  {d.unitRef ? `Unit ${d.unitRef} · ` : ""}Filed {d.createdAt.toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="h-[19mm] w-[19mm] shrink-0 self-center" dangerouslySetInnerHTML={{ __html: qr }} />
            </div>
          );
        })}
      </div>
      {tags.length === 0 && <p className="p-10 text-center text-gray-500">No documents selected.</p>}
    </div>
  );
}
