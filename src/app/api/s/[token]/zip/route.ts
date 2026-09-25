import { NextRequest } from "next/server";
import { audit, getValidLink, requestIp } from "@/lib/archive/service";
import { buildClientZip, zipResponse } from "@/lib/archive/zip";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidLink(token, "download");
  if (!link || !link.clientId) return new Response("This download link is invalid or has expired", { status: 403 });
  const { buf, filename, count } = await buildClientZip(link.clientId, link.section, true);
  await audit({ action: "client.zip", actor: `link: ${link.label ?? "download"}`, clientId: link.clientId, detail: `${count} documents`, ip: requestIp(request) });
  return zipResponse(buf, filename);
}
