import { prisma } from "@/lib/prisma";
import {
  Ticket,
  Users,
  Shield,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    totalCustomers,
    totalClaims,
    pendingClaims,
    totalParts,
    lowStockParts,
    recentTickets,
    recentClaims,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.ticket.count({ where: { status: "in-progress" } }),
    prisma.ticket.count({ where: { status: "resolved" } }),
    prisma.customer.count(),
    prisma.warrantyClaim.count(),
    prisma.warrantyClaim.count({ where: { status: "pending" } }),
    prisma.part.count(),
    prisma.part.count({
      where: { quantity: { lte: 5 } },
    }),
    prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.warrantyClaim.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
  ]);

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    totalCustomers,
    totalClaims,
    pendingClaims,
    totalParts,
    lowStockParts,
    recentTickets,
    recentClaims,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      title: "Open Tickets",
      value: stats.openTickets,
      total: stats.totalTickets,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/tickets",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/customers",
    },
    {
      title: "Pending Claims",
      value: stats.pendingClaims,
      total: stats.totalClaims,
      icon: Shield,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/warranty",
    },
    {
      title: "Parts in Stock",
      value: stats.totalParts,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/parts",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.total !== undefined && (
                  <p className="text-xs text-gray-400 mt-1">
                    of {card.total} total
                  </p>
                )}
              </div>
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/tickets/new"
          className="flex items-center gap-3 bg-blue-600 text-white rounded-xl p-4 hover:bg-blue-700 transition-colors"
        >
          <Ticket className="h-5 w-5" />
          <span className="font-medium">New Service Ticket</span>
        </Link>
        <Link
          href="/customers/new"
          className="flex items-center gap-3 bg-emerald-600 text-white rounded-xl p-4 hover:bg-emerald-700 transition-colors"
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">Add Customer</span>
        </Link>
        <Link
          href="/warranty/new"
          className="flex items-center gap-3 bg-orange-600 text-white rounded-xl p-4 hover:bg-orange-700 transition-colors"
        >
          <Shield className="h-5 w-5" />
          <span className="font-medium">New Warranty Claim</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Tickets</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentTickets.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 text-center">
                No tickets yet
              </p>
            ) : (
              stats.recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ticket.customer.name} &middot; {ticket.ticketNo}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <StatusBadge value={ticket.status} />
                    <StatusBadge value={ticket.priority} type="priority" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Claims */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Recent Warranty Claims
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentClaims.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 text-center">
                No claims yet
              </p>
            ) : (
              stats.recentClaims.map((claim) => (
                <Link
                  key={claim.id}
                  href={`/warranty/${claim.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {claim.claimNo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {claim.customer.name} &middot;{" "}
                      {formatDate(claim.createdAt)}
                    </p>
                  </div>
                  <StatusBadge value={claim.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
