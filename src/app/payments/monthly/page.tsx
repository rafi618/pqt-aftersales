"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getMonthName } from "@/lib/utils";

interface MonthData {
  month: number;
  invoiceCount: number;
  invoiced: number;
  collected: number;
  outstanding: number;
  overdueAmount: number;
}

interface TopCustomer {
  name: string;
  total: number;
  paid: number;
}

interface MonthlyData {
  year: number;
  months: MonthData[];
  totals: {
    invoiced: number;
    collected: number;
    outstanding: number;
    invoiceCount: number;
  };
  topCustomers: TopCustomer[];
}

export default function MonthlyAnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/invoices/monthly?year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [year]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const maxInvoiced = Math.max(...data.months.map((m) => m.invoiced), 1);
  const collectionRate =
    data.totals.invoiced > 0
      ? Math.round((data.totals.collected / data.totals.invoiced) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>

        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setYear(year - 1)}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-lg font-bold text-gray-900 min-w-[4rem] text-center">
            {year}
          </span>
          <button
            onClick={() => setYear(year + 1)}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Annual Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Invoiced</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(data.totals.invoiced)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {data.totals.invoiceCount} invoices
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(data.totals.collected)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {collectionRate}% collection rate
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(data.totals.outstanding)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Collection Rate</p>
          <div className="mt-2">
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-gray-900">{collectionRate}%</p>
              {collectionRate >= 80 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mb-1" />
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  collectionRate >= 80
                    ? "bg-emerald-500"
                    : collectionRate >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart (bar visualization) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">
          Monthly Revenue Breakdown
        </h3>
        <div className="space-y-3">
          {data.months.map((month) => {
            const barWidthInvoiced =
              maxInvoiced > 0 ? (month.invoiced / maxInvoiced) * 100 : 0;
            const barWidthCollected =
              maxInvoiced > 0 ? (month.collected / maxInvoiced) * 100 : 0;

            return (
              <div key={month.month} className="group">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-12 text-right shrink-0">
                    {getMonthName(month.month).substring(0, 3)}
                  </span>
                  <div className="flex-1 space-y-1">
                    {/* Invoiced bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-blue-400 h-4 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(barWidthInvoiced, month.invoiced > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-24 text-right shrink-0">
                        {formatCurrency(month.invoiced)}
                      </span>
                    </div>
                    {/* Collected bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-4 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(barWidthCollected, month.collected > 0 ? 2 : 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-emerald-600 w-24 text-right shrink-0">
                        {formatCurrency(month.collected)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                    {month.invoiceCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-400" />
            <span className="text-xs text-gray-500">Invoiced</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">Collected</span>
          </div>
          <span className="text-xs text-gray-400 ml-auto"># = Invoice count</span>
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Monthly Detail</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoices
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoiced
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collected
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outstanding
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overdue
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.months.map((month) => {
              const rate =
                month.invoiced > 0
                  ? Math.round((month.collected / month.invoiced) * 100)
                  : 0;
              return (
                <tr key={month.month} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {getMonthName(month.month)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 text-right">
                    {month.invoiceCount}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(month.invoiced)}
                  </td>
                  <td className="px-6 py-3 text-sm text-emerald-600 text-right">
                    {formatCurrency(month.collected)}
                  </td>
                  <td className="px-6 py-3 text-sm text-amber-600 text-right">
                    {month.outstanding > 0
                      ? formatCurrency(month.outstanding)
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    {month.overdueAmount > 0 ? (
                      <span className="text-red-600 font-medium">
                        {formatCurrency(month.overdueAmount)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-right">
                    {month.invoiceCount > 0 ? (
                      <span
                        className={
                          rate >= 80
                            ? "text-emerald-600"
                            : rate >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }
                      >
                        {rate}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td className="px-6 py-3 text-sm text-gray-900">Total</td>
              <td className="px-6 py-3 text-sm text-gray-900 text-right">
                {data.totals.invoiceCount}
              </td>
              <td className="px-6 py-3 text-sm text-gray-900 text-right">
                {formatCurrency(data.totals.invoiced)}
              </td>
              <td className="px-6 py-3 text-sm text-emerald-600 text-right">
                {formatCurrency(data.totals.collected)}
              </td>
              <td className="px-6 py-3 text-sm text-amber-600 text-right">
                {formatCurrency(data.totals.outstanding)}
              </td>
              <td className="px-6 py-3 text-sm text-right" />
              <td className="px-6 py-3 text-sm text-right">
                {collectionRate}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Top Customers */}
      {data.topCustomers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Top Customers by Revenue ({year})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topCustomers.map((customer, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-6">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {customer.paid > 0 &&
                        `${Math.round((customer.paid / customer.total) * 100)}% collected`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(customer.total)}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {formatCurrency(customer.paid)} paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
