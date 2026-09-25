import { prisma } from "@/lib/prisma";
import LinksManager from "@/components/archive/LinksManager";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const [links, clients] = await Promise.all([
    prisma.shareLink.findMany({ orderBy: { createdAt: "desc" }, include: { client: { select: { name: true } }, invoice: { select: { number: true } } } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientCode: true } }),
  ]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 max-w-3xl">
        Share links let people outside the office work with the archive without an account.
        <b> Upload links</b> let anyone send documents (they are sorted automatically).
        <b> Download links</b> let someone see and download one client&apos;s documents.
        <b> Voucher upload links</b> let staff or partners send receipts to the invoice section, and <b>invoice links</b> (made from an invoice page) let a customer view and download their invoice. Every use is written to the Activity Log, and you can revoke a link at any time.
      </p>
      <LinksManager
        clients={clients}
        links={links.map((l) => ({
          id: l.id,
          token: l.token,
          kind: l.kind,
          label: l.label,
          clientName: l.client?.name ?? null,
          invoiceNumber: l.invoice?.number ?? null,
          section: l.section,
          expiresAt: l.expiresAt?.toISOString() ?? null,
          revoked: l.revoked,
          uses: l.uses,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
