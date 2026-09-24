import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { audit, requestIp } from "@/lib/archive/service";
import { getCategory, sectionOfCategory } from "@/lib/archive/taxonomy";

// Metadata can be corrected; the stored file and its reference code never change.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const before = await prisma.document.findUniqueOrThrow({ where: { id } });
  const data: Record<string, unknown> = {};
  const changes: string[] = [];

  if (body.category && body.category !== before.category) {
    if (!getCategory(body.category)) return NextResponse.json({ error: "Unknown category" }, { status: 400 });
    data.category = body.category;
    data.section = sectionOfCategory(body.category);
    data.classifiedBy = "manual";
    changes.push(`moved ${before.section}/${before.category} → ${data.section}/${body.category}`);
  }
  for (const f of ["title", "notes", "unitRef", "docDate"] as const) {
    if (f in body && (body[f] || null) !== before[f]) {
      data[f] = body[f] || null;
      changes.push(`${f} updated`);
    }
  }
  if (body.status === "retired" && before.status !== "retired") {
    if (!body.statusReason?.trim()) return NextResponse.json({ error: "Give a reason for retiring" }, { status: 400 });
    data.status = "retired";
    data.statusReason = body.statusReason.trim();
    changes.push(`retired: ${body.statusReason.trim()}`);
  }
  if (body.status === "active" && before.status === "retired") {
    data.status = "active";
    data.statusReason = null;
    changes.push("restored");
  }
  if (body.tagPrinted) {
    data.tagPrintedAt = new Date();
  }
  if (Object.keys(data).length === 0) return NextResponse.json(before);

  const doc = await prisma.document.update({ where: { id }, data });
  if (changes.length) {
    await audit({
      action: data.category ? "doc.recategorize" : data.status ? `doc.${data.status}` : "doc.update",
      actor: "staff",
      clientId: doc.clientId,
      documentId: id,
      detail: `${doc.refCode}: ${changes.join("; ")}`,
      ip: requestIp(request),
    });
  }
  return NextResponse.json(doc);
}
