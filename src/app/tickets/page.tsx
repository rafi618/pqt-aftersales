import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tickets.length} total tickets</p>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No service tickets"
          description="Create your first service ticket to get started."
          actionLabel="Create Ticket"
          actionHref="/tickets/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {ticket.ticketNo}
                    </Link>
                    <p className="text-sm text-gray-900 mt-0.5">
                      {ticket.subject}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {ticket.customer.name}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={ticket.priority} type="priority" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                    {ticket.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
