import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Files are written once and never modified or moved (archival principle).
// Layout on disk:  <root>/<clientCode>/<refCode>__<safe original name>

export function storageRoot(): string {
  return path.resolve(process.env.ARCHIVE_STORAGE_DIR || "./storage");
}

export function safeName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(-120);
  return cleaned || "file";
}

export function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function writeArchiveFile(
  clientCode: string,
  refCode: string,
  originalName: string,
  data: Buffer
): Promise<string> {
  const rel = path.join(clientCode, `${refCode}__${safeName(originalName)}`);
  const abs = path.join(storageRoot(), rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  // "wx" refuses to overwrite an existing file
  await fs.writeFile(abs, data, { flag: "wx" });
  await fs.chmod(abs, 0o444).catch(() => {});
  return rel;
}

export async function readArchiveFile(rel: string): Promise<Buffer> {
  const abs = path.resolve(storageRoot(), rel);
  if (!abs.startsWith(storageRoot() + path.sep)) {
    throw new Error("Invalid storage path");
  }
  return fs.readFile(abs);
}

export function guessMime(name: string, fallback?: string): string {
  if (fallback && fallback !== "application/octet-stream") return fallback;
  const ext = path.extname(name).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
