import { NextRequest } from "next/server";
import { buildClientZip, zipResponse } from "@/lib/archive/zip";
import { audit, requestIp } from "@/lib/archive/service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const section = request.nextUrl.searchParams.get("section");
  const { buf, filename, count } = await buildClientZip(id, section);
  await audit({ action: "client.zip", actor: "staff", clientId: id, detail: `${count} documents${section ? ` (${section})` : ""}`, ip: requestIp(request) });
  return zipResponse(buf, filename);
}
