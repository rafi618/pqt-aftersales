import fs from "fs/promises";
import path from "path";
import { degrees, PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { COMPANY, LineItem, money } from "./config";

// Builds the A4 invoice PDF in PQT's house style (navy + gold, logo top-left).
// DejaVu Sans is embedded so Turkish letters (ş, ğ, İ, ı) print correctly.

const NAVY = rgb(10 / 255, 31 / 255, 61 / 255);
const GOLD = rgb(201 / 255, 162 / 255, 77 / 255);
const GREY = rgb(74 / 255, 91 / 255, 117 / 255);
const LIGHT = rgb(0.89, 0.9, 0.93);
const STRIPE = rgb(250 / 255, 247 / 255, 242 / 255);

export interface InvoiceForPdf {
  number: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  partyName: string;
  partyAddress: string | null;
  partyEmail: string | null;
  partyTaxId: string | null;
  items: LineItem[];
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  clientCode?: string | null;
  vouchers?: { refCode: string; label: string }[];
}

let assets: { regular: Buffer; bold: Buffer; logo: Buffer } | null = null;
async function loadAssets() {
  if (!assets) {
    const root = process.cwd();
    const [regular, bold, logo] = await Promise.all([
      fs.readFile(path.join(root, "assets/fonts/DejaVuSans.ttf")),
      fs.readFile(path.join(root, "assets/fonts/DejaVuSans-Bold.ttf")),
      fs.readFile(path.join(root, "public/brand/pqt-logo.png")),
    ]);
    assets = { regular, bold, logo };
  }
  return assets;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

export async function renderInvoicePdf(inv: InvoiceForPdf): Promise<Uint8Array> {
  const { regular, bold, logo } = await loadAssets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const f = await doc.embedFont(regular, { subset: true });
  const fb = await doc.embedFont(bold, { subset: true });
  const logoImg = await doc.embedPng(logo);
  doc.setTitle(`Invoice ${inv.number}`);
  doc.setAuthor(COMPANY.legalName);

  const W = 595.28, H = 841.89, M = 42;
  let page: PDFPage = doc.addPage([W, H]);
  const text = (p: PDFPage, s: string, x: number, y: number, size = 9, font = f, color = NAVY) =>
    p.drawText(s, { x, y, size, font, color });
  const right = (p: PDFPage, s: string, xr: number, y: number, size = 9, font = f, color = NAVY) =>
    p.drawText(s, { x: xr - font.widthOfTextAtSize(s, size), y, size, font, color });

  // Header: logo left, INVOICE + meta right
  const lw = 150, lh = (logoImg.height / logoImg.width) * lw;
  page.drawImage(logoImg, { x: M, y: H - M - lh, width: lw, height: lh });
  right(page, "INVOICE", W - M, H - M - 18, 22, fb);
  let y = H - M - 36;
  const meta: [string, string][] = [
    ["Invoice no.", inv.number],
    ["Issue date", fmtDate(inv.issueDate)],
    ["Due date", fmtDate(inv.dueDate)],
  ];
  if (inv.clientCode) meta.push(["Client file", inv.clientCode]);
  for (const [k, v] of meta) {
    right(page, v, W - M, y, 9, fb);
    right(page, k + "  ", W - M - fb.widthOfTextAtSize(v, 9), y, 8, f, GREY);
    y -= 13;
  }

  // Gold rule
  y = Math.min(y, H - M - lh) - 14;
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: 2, color: GOLD });
  y -= 22;

  // From / Bill to
  const colW = (W - 2 * M - 20) / 2;
  const block = (x: number, title: string, lines: string[], startY: number) => {
    text(page, title.toUpperCase(), x, startY, 7, fb, GOLD);
    let yy = startY - 14;
    lines.forEach((l, i) => {
      for (const w of wrap(l, i === 0 ? fb : f, i === 0 ? 10 : 8.5, colW)) {
        text(page, w, x, yy, i === 0 ? 10 : 8.5, i === 0 ? fb : f, i === 0 ? NAVY : GREY);
        yy -= i === 0 ? 14 : 11.5;
      }
    });
    return yy;
  };
  const yFrom = block(M, "From", [COMPANY.legalName, COMPANY.address, `Tax no. ${COMPANY.taxNo} · ${COMPANY.taxOffice}`, `${COMPANY.email} · ${COMPANY.phone}`], y);
  const toLines = [inv.partyName, inv.partyAddress, inv.partyTaxId ? `Tax / ID no. ${inv.partyTaxId}` : null, inv.partyEmail].filter(Boolean) as string[];
  const yTo = block(M + colW + 20, "Bill to", toLines, y);
  y = Math.min(yFrom, yTo) - 12;

  // Items table
  const cols = { desc: M + 10, qty: W - M - 215, unit: W - M - 110, amt: W - M - 10 };
  const header = (p: PDFPage, yy: number) => {
    p.drawRectangle({ x: M, y: yy - 6, width: W - 2 * M, height: 22, color: NAVY });
    text(p, "DESCRIPTION", cols.desc, yy + 1, 7.5, fb, rgb(1, 1, 1));
    right(p, "QTY", cols.qty + 20, yy + 1, 7.5, fb, rgb(1, 1, 1));
    right(p, "UNIT PRICE", cols.unit + 10, yy + 1, 7.5, fb, rgb(1, 1, 1));
    right(p, `AMOUNT (${inv.currency})`, cols.amt, yy + 1, 7.5, fb, rgb(1, 1, 1));
    return yy - 24;
  };
  y = header(page, y);
  const n = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  inv.items.forEach((it, i) => {
    const lines = wrap(it.description || "—", f, 9, cols.qty - cols.desc - 30);
    const rowH = Math.max(20, lines.length * 12 + 8);
    if (y - rowH < 150) {
      page = doc.addPage([W, H]);
      y = header(page, H - M - 10);
    }
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - rowH + 14, width: W - 2 * M, height: rowH, color: STRIPE });
    lines.forEach((l, k) => text(page, l, cols.desc, y - k * 12, 9));
    right(page, String(it.quantity), cols.qty + 20, y, 9);
    right(page, n(it.unitPrice), cols.unit + 10, y, 9);
    right(page, n(it.quantity * it.unitPrice), cols.amt, y, 9, fb);
    page.drawLine({ start: { x: M, y: y - rowH + 14 }, end: { x: W - M, y: y - rowH + 14 }, thickness: 0.5, color: LIGHT });
    y -= rowH;
  });

  // Totals
  y -= 6;
  const tx = W - M - 220;
  right(page, "Subtotal", tx + 110, y, 9, f, GREY);
  right(page, money(inv.subtotal, inv.currency), W - M - 10, y, 9);
  y -= 16;
  right(page, `VAT (${inv.vatRate}%)`, tx + 110, y, 9, f, GREY);
  right(page, money(inv.vatAmount, inv.currency), W - M - 10, y, 9);
  y -= 20;
  page.drawRectangle({ x: tx, y: y - 16, width: W - M - tx, height: 26, color: NAVY });
  text(page, "TOTAL", tx + 10, y - 7, 10, fb, rgb(1, 1, 1));
  right(page, money(inv.total, inv.currency), W - M - 10, y - 7, 12, fb, GOLD);
  y -= 44;

  // Notes, payment details, vouchers
  const section = (title: string, body: string[]) => {
    if (y < 120) {
      page = doc.addPage([W, H]);
      y = H - M - 10;
    }
    text(page, title.toUpperCase(), M, y, 7, fb, GOLD);
    y -= 13;
    for (const l of body) for (const w of wrap(l, f, 8.5, W - 2 * M)) {
      text(page, w, M, y, 8.5, f, GREY);
      y -= 11.5;
    }
    y -= 8;
  };
  if (COMPANY.bank.length) section("Payment details", COMPANY.bank.map((b) => `${b.label}: ${b.value}`));
  if (inv.notes) section("Notes", [inv.notes]);
  if (inv.vouchers?.length) section("Supporting vouchers", inv.vouchers.map((v) => `${v.refCode} — ${v.label}`));

  // Status stamp for anything that is not a normal issued invoice
  const stamp = { draft: "DRAFT", cancelled: "CANCELLED", paid: "PAID" }[inv.status];
  if (stamp) {
    const first = doc.getPage(0);
    const color = inv.status === "paid" ? rgb(0.02, 0.5, 0.3) : inv.status === "draft" ? GREY : rgb(0.72, 0.1, 0.1);
    first.drawText(stamp, { x: W / 2 - fb.widthOfTextAtSize(stamp, 60) / 2 + 40, y: H / 2 + 60, size: 60, font: fb, color, opacity: 0.12, rotate: degrees(20) });
  }

  // Footer on every page
  for (const p of doc.getPages()) {
    p.drawLine({ start: { x: M, y: 58 }, end: { x: W - M, y: 58 }, thickness: 0.5, color: LIGHT });
    text(p, `${COMPANY.brand}  |  ${COMPANY.legalName}`, M, 44, 7, fb);
    text(p, COMPANY.address, M, 34, 6.5, f, GREY);
    text(p, `${COMPANY.email} · ${COMPANY.phone} · ${COMPANY.web}`, M, 24, 6.5, f, GREY);
  }
  return doc.save();
}

/** Loads an invoice with its vouchers and returns the PDF bytes (created invoices only). */
export async function pdfForInvoice(id: string) {
  const { prisma } = await import("@/lib/prisma");
  const { parseItems } = await import("./service");
  const { voucherCategoryLabel } = await import("./config");
  const inv = await prisma.invoice.findUniqueOrThrow({ where: { id }, include: { client: true, vouchers: true } });
  const bytes = await renderInvoicePdf({
    ...inv,
    items: parseItems(inv.itemsJson),
    clientCode: inv.client?.clientCode,
    vouchers: inv.vouchers.map((v) => ({
      refCode: v.refCode,
      label: [voucherCategoryLabel(v.category), v.vendor, v.amount != null ? `${v.amount} ${v.currency ?? ""}` : null].filter(Boolean).join(" · "),
    })),
  });
  return { inv, bytes };
}
