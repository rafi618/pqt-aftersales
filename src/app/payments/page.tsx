"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  Search,
  X,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  customer: { name: string };
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      });
  }, []);

  // Compute stats from all invoices
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
  const monthInvoiced = monthInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const monthCollected = monthInvoices.reduce(
    (sum, inv) => sum + inv.paidAmount,
    0
  );

  // Filtered list
  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customer.name.toLowerCase().includes(q);
    const isOverdue =
      inv.status !== "paid" &&
      inv.status !== "cancelled" &&
      inv.status !== "draft" &&
      new Date(inv.dueDate) < new Date();
    const effectiveStatus = isOverdue ? "overdue" : inv.status;
    const matchesStatus = !statusFilter || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasFilters = search || statusFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Invoiced",
      value: formatCurrency(totalInvoiced),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Collected",
      value: formatCurrency(totalCollected),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Overdue",
      value: overdueCount.toString(),
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
              {formatCurrency(monthInvoiced)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-xl font-bold text-emerald-600">
              {formatCurrency(monthCollected)}
            </p>
          </div>
        </div>
        {monthInvoiced > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Collection Rate</span>
              <span>
                {Math.round((monthCollected / monthInvoiced) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (monthCollected / monthInvoiced) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions + Filters */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} of {invoices.length} invoices
        </p>
        <Link
          href="/payments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          actionLabel="Create Invoice"
          actionHref="/payments/new"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          No invoices match your filters.
        </div>
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
              {filtered.map((invoice) => {
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
                        className={
                          isOverdue
                            ? "text-red-600 font-medium"
                            : "text-gray-500"
                        }
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
