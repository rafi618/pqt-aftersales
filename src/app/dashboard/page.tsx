import { prisma } from "@/lib/prisma";
import {
  Ticket,
  Users,
  Shield,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalTickets,
    openTickets,
    totalCustomers,
    totalClaims,
    pendingClaims,
    totalParts,
    recentTickets,
    recentClaims,
    allInvoices,
    monthInvoices,
    recentInvoices,
    overdueInvoices,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "open" } }),
    prisma.customer.count(),
    prisma.warrantyClaim.count(),
    prisma.warrantyClaim.count({ where: { status: "pending" } }),
    prisma.part.count(),
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
    prisma.invoice.findMany({
      where: { status: { not: "cancelled" } },
      select: { totalAmount: true, paidAmount: true },
    }),
    prisma.invoice.findMany({
      where: {
        issueDate: { gte: monthStart },
        status: { not: "cancelled" },
      },
      select: { totalAmount: true, paidAmount: true },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    prisma.invoice.count({
      where: {
        status: { notIn: ["paid", "cancelled", "draft"] },
        dueDate: { lt: now },
      },
    }),
  ]);

  const totalRevenue = allInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = allInvoices.reduce(
    (s, i) => s + (i.totalAmount - i.paidAmount),
    0
  );
  const monthRevenue = monthInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const monthInvoiced = monthInvoices.reduce((s, i) => s + i.totalAmount, 0);

  return {
    totalTickets,
    openTickets,
    totalCustomers,
    totalClaims,
    pendingClaims,
    totalParts,
    recentTickets,
    recentClaims,
    totalRevenue,
    totalOutstanding,
    monthRevenue,
    monthInvoiced,
    recentInvoices,
    overdueInvoices,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    {
      title: "Open Tickets",
      value: stats.openTickets.toString(),
      total: stats.totalTickets,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/tickets",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/customers",
    },
    {
      title: "Pending Claims",
      value: stats.pendingClaims.toString(),
      total: stats.totalClaims,
      icon: Shield,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/warranty",
    },
    {
      title: "Parts in Stock",
      value: stats.totalParts.toString(),
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

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/payments"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Revenue
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">All time collected</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Link>
        <Link
          href="/payments/monthly"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                This Month
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(stats.monthRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                of {formatCurrency(stats.monthInvoiced)} invoiced
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Link>
        <Link
          href="/payments"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Outstanding
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatCurrency(stats.totalOutstanding)}
              </p>
              {stats.overdueInvoices > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {stats.overdueInvoices} overdue
                </p>
              )}
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Link
          href="/payments/new"
          className="flex items-center gap-3 bg-indigo-600 text-white rounded-xl p-4 hover:bg-indigo-700 transition-colors"
        >
          <DollarSign className="h-5 w-5" />
          <span className="font-medium">Create Invoice</span>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.recentInvoices.length === 0 ? (
              <p className="p-5 text-sm text-gray-500 text-center">
                No invoices yet
              </p>
            ) : (
              stats.recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/payments/${invoice.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.invoiceNo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {invoice.customer.name} &middot;{" "}
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                  </div>
                  <StatusBadge value={invoice.status} type="invoice" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
