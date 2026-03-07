import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, TrendingUp, DollarSign, AlertCircle, Clock } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getInvoiceData() {
  const invoices = await prisma.invoice.findMany({
    include: { customer: true, items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const overdueCount = invoices.filter(
    (inv) =>
      inv.status !== "paid" &&
      inv.status !== "cancelled" &&
      inv.status !== "draft" &&
      new Date(inv.dueDate) < new Date()
  ).length;

  // Current month stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthInvoices = invoices.filter(
    (inv) => new Date(inv.issueDate) >= monthStart
  );
  const monthInvoiced = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const monthCollected = monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  return {
    invoices,
    totalInvoiced,
    totalCollected,
    totalOutstanding,
    overdueCount,
    monthInvoiced,
    monthCollected,
  };
}

export default async function PaymentsPage() {
  const data = await getInvoiceData();

  const summaryCards = [
    {
      title: "Total Invoiced",
      value: formatCurrency(data.totalInvoiced),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Collected",
      value: formatCurrency(data.totalCollected),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Outstanding",
      value: formatCurrency(data.totalOutstanding),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Overdue",
      value: data.overdueCount.toString(),
      subtitle: "invoices",
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                )}
              </div>
              <div className={`${card.bg} p-3 rounded-lg`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* This Month Quick View */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">This Month</h3>
          <Link
            href="/payments/monthly"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Monthly Breakdown
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Invoiced</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(data.monthInvoiced)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(data.monthCollected)}
            </p>
          </div>
        </div>
        {data.monthInvoiced > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Collection Rate</span>
              <span>
                {Math.round((data.monthCollected / data.monthInvoiced) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (data.monthCollected / data.monthInvoiced) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions + Invoices List */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data.invoices.length} total invoices
        </p>
        <Link
          href="/payments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {data.invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          actionLabel="Create Invoice"
          actionHref="/payments/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.invoices.map((invoice) => {
                const balance = invoice.totalAmount - invoice.paidAmount;
                const isOverdue =
                  invoice.status !== "paid" &&
                  invoice.status !== "cancelled" &&
                  invoice.status !== "draft" &&
                  new Date(invoice.dueDate) < new Date();

                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/payments/${invoice.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {invoice.invoiceNo}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(invoice.issueDate)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {invoice.customer.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        value={isOverdue ? "overdue" : invoice.status}
                        type="invoice"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-emerald-600 text-right">
                      {formatCurrency(invoice.paidAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      <span
                        className={
                          balance > 0 ? "text-amber-600" : "text-gray-400"
                        }
                      >
                        {formatCurrency(balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={isOverdue ? "text-red-600 font-medium" : "text-gray-500"}
                      >
                        {formatDate(invoice.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
