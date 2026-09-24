import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { classifyDocument } from "./classifier";
import { guessMime, sha256, writeArchiveFile } from "./storage";
import { getCategory, sectionOfCategory } from "./taxonomy";

export const MAX_FILE_BYTES = 100 * 1024 * 1024;

export async function audit(entry: {
  action: string;
  actor?: string | null;
  clientId?: string | null;
  documentId?: string | null;
  detail?: string | null;
  ip?: string | null;
}) {
  await prisma.auditLog.create({ data: entry });
}

export function requestIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

export async function createClient(data: {
  name: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  passportNo?: string | null;
  properties?: string | null;
  notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const last = await tx.client.findFirst({ orderBy: { seq: "desc" } });
    const seq = (last?.seq ?? 0) + 1;
    return tx.client.create({
      data: {
        ...data,
        name: data.name.trim(),
        seq,
        clientCode: `PQT-${String(seq).padStart(4, "0")}`,
      },
    });
  });
}

/** Finds a client by exact (case-insensitive) name, or creates one. */
export async function findOrCreateClient(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const all = await prisma.client.findMany({ select: { id: true, name: true } });
  const match = all.find(
    (c) => c.name.toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr")
  );
  if (match) return { client: await prisma.client.findUniqueOrThrow({ where: { id: match.id } }), created: false };
  return { client: await createClient({ name: trimmed }), created: true };
}

async function nextRefCode(clientId: string) {
  const c = await prisma.client.update({
    where: { id: clientId },
    data: { docSeq: { increment: 1 } },
  });
  return `${c.clientCode}-${String(c.docSeq).padStart(4, "0")}`;
}

export interface IngestResult {
  ok: boolean;
  fileName: string;
  documentId?: string;
  refCode?: string;
  section?: string;
  category?: string;
  categoryLabel?: string;
  title?: string;
  confidence?: number;
  reason?: string;
  classifiedBy?: string;
  duplicateOf?: string;
  error?: string;
}

/**
 * Stores one uploaded file for a client and lets the agent file it.
 * If `forceCategory` is given the agent is skipped (staff chose manually).
 */
export async function ingestFile(opts: {
  clientId: string;
  file: File;
  hint?: string;
  uploadedBy?: string | null;
  uploadSource: "staff" | "link";
  forceCategory?: string | null;
  ip?: string | null;
  previousId?: string | null;
}): Promise<IngestResult> {
  const { file } = opts;
  const fileName = file.name || "upload";
  if (file.size === 0) return { ok: false, fileName, error: "File is empty" };
  if (file.size > MAX_FILE_BYTES)
    return { ok: false, fileName, error: "File is larger than 100 MB" };

  const client = await prisma.client.findUniqueOrThrow({ where: { id: opts.clientId } });
  const data = Buffer.from(await file.arrayBuffer());
  const hash = sha256(data);
  const mimeType = guessMime(fileName, file.type);

  const dup = await prisma.document.findFirst({
    where: { clientId: client.id, sha256: hash, status: { not: "retired" } },
  });
  if (dup && !opts.previousId) {
    return {
      ok: false,
      fileName,
      duplicateOf: dup.refCode,
      error: `Already archived as ${dup.refCode}`,
    };
  }

  const forced = opts.forceCategory && getCategory(opts.forceCategory);
  const cls = forced
    ? {
        section: sectionOfCategory(forced.id),
        category: forced.id,
        title: fileName.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " "),
        docDate: null,
        unitRef: null,
        confidence: 1,
        reason: "Category chosen by uploader.",
        by: "manual" as const,
      }
    : await classifyDocument(fileName, mimeType, data, opts.hint ?? "");

  const refCode = await nextRefCode(client.id);
  const storedPath = await writeArchiveFile(client.clientCode, refCode, fileName, data);

  let version = 1;
  if (opts.previousId) {
    const prev = await prisma.document.update({
      where: { id: opts.previousId },
      data: { status: "superseded", statusReason: `Replaced by ${refCode}` },
    });
    version = prev.version + 1;
  }

  const doc = await prisma.document.create({
    data: {
      refCode,
      clientId: client.id,
      section: cls.section,
      category: cls.category,
      title: cls.title.slice(0, 200),
      notes: opts.hint || null,
      unitRef: cls.unitRef,
      docDate: cls.docDate,
      originalName: fileName,
      storedPath,
      mimeType,
      sizeBytes: data.length,
      sha256: hash,
      uploadedBy: opts.uploadedBy || null,
      uploadSource: opts.uploadSource,
      classifiedBy: cls.by,
      aiConfidence: cls.confidence,
      aiReason: cls.reason,
      version,
      previousId: opts.previousId ?? null,
    },
  });

  await audit({
    action: "doc.upload",
    actor: opts.uploadedBy || opts.uploadSource,
    clientId: client.id,
    documentId: doc.id,
    detail: `${refCode} ${fileName} → ${cls.section}/${cls.category} (${cls.by}, ${Math.round(cls.confidence * 100)}%)`,
    ip: opts.ip,
  });

  return {
    ok: true,
    fileName,
    documentId: doc.id,
    refCode,
    section: cls.section,
    category: cls.category,
    categoryLabel: getCategory(cls.category)?.label,
    title: doc.title,
    confidence: cls.confidence,
    reason: cls.reason,
    classifiedBy: cls.by,
  };
}

export function newToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}

export async function getValidLink(token: string, kind: "upload" | "download") {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { client: true },
  });
  if (!link || link.kind !== kind || link.revoked) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;
  return link;
}

export function publicBaseUrl(req?: Request): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  if (req) return new URL(req.url).origin;
  return "";
}
