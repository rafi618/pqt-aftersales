"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  claimNo: string;
  status: string;
  purchaseDate: string | null;
  customer: { name: string };
  product: { name: string } | null;
  createdAt: string;
}

export default function WarrantyPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/warranty")
      .then((res) => res.json())
      .then((data) => {
        setClaims(data);
        setLoading(false);
      });
  }, []);

  const filtered = claims.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.claimNo.toLowerCase().includes(q) ||
      c.customer.name.toLowerCase().includes(q) ||
      c.product?.name.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || c.status === statusFilter;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} of {claims.length} claims
        </p>
        <Link
          href="/warranty/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Claim
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
            placeholder="Search claims..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
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

      {claims.length === 0 ? (
        <EmptyState
          title="No warranty claims"
          description="Create your first warranty claim to get started."
          actionLabel="New Claim"
          actionHref="/warranty/new"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          No claims match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/warranty/${claim.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {claim.claimNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.product?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={claim.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.purchaseDate
                      ? formatDate(claim.purchaseDate)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(claim.createdAt)}
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
