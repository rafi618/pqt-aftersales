import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { readArchiveFile, safeName } from "./storage";
import { SECTIONS, getCategory, getSection } from "./taxonomy";

/** Builds a ZIP laid out as  Client/Section/Category/REF__file.ext  */
export async function buildClientZip(clientId: string, section?: string | null, excludeUnsorted = false) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const docs = await prisma.document.findMany({
    where: {
      clientId,
      status: "active",
      ...(section ? { section } : excludeUnsorted ? { section: { not: "unsorted" } } : {}),
    },
    orderBy: { refCode: "asc" },
  });
  const zip = new JSZip();
  const root = `${client.clientCode} ${safeName(client.name)}`;
  const index: string[] = ["Reference\tSection\tCategory\tTitle\tDocument date\tUnit\tSHA-256"];
  for (const d of docs) {
    const sec = getSection(d.section);
    const secIdx = SECTIONS.indexOf(sec) + 1;
    const cat = getCategory(d.category)?.label ?? d.category;
    const folder = `${root}/${secIdx}. ${safeName(sec.label)}/${safeName(cat)}`;
    try {
      zip.file(`${folder}/${d.refCode}__${safeName(d.originalName)}`, await readArchiveFile(d.storedPath));
    } catch {
      continue;
    }
    index.push([d.refCode, sec.label, cat, d.title, d.docDate ?? "", d.unitRef ?? "", d.sha256].join("\t"));
  }
  zip.file(`${root}/INDEX.tsv`, index.join("\n"));
  const buf = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return { buf, filename: `${root}.zip`, count: docs.length };
}

export function zipResponse(buf: Uint8Array, filename: string) {
  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

export function fileResponse(data: Buffer, mimeType: string, name: string, download: boolean) {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
