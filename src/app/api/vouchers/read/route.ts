import { NextRequest, NextResponse } from "next/server";
import { guessMime } from "@/lib/archive/storage";
import { extractFinancial } from "@/lib/invoices/extract";

// Reads a receipt without saving it, so the invoice form can pre-fill purpose and cost.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  const x = await extractFinancial(file.name, guessMime(file.name, file.type), data);
  return NextResponse.json(x);
}
