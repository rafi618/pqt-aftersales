import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
  const clientIds = [...new Set(logs.map((l) => l.clientId).filter(Boolean))] as string[];
  const clients = await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } });
  const names = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Every upload, download, move and link use is recorded here permanently (latest 300 shown).</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">When</th>
              <th className="px-4 py-2 font-medium">Action</th>
              <th className="px-4 py-2 font-medium">Who</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{l.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-2 text-xs">{l.actor}</td>
                <td className="px-4 py-2 text-xs">
                  {l.clientId ? <Link href={`/archive/clients/${l.clientId}`} className="text-blue-600 hover:underline">{names[l.clientId] ?? "—"}</Link> : "—"}
                </td>
                <td className="px-4 py-2 text-xs text-gray-600">
                  {l.documentId ? <Link href={`/archive/documents/${l.documentId}`} className="hover:underline">{l.detail}</Link> : l.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
