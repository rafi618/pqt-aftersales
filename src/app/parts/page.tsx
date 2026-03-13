"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, AlertTriangle, Search, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface Part {
  id: string;
  name: string;
  partNo: string;
  description: string | null;
  quantity: number;
  minStock: number;
  unitPrice: number;
  location: string | null;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  useEffect(() => {
    fetch("/api/parts")
      .then((res) => res.json())
      .then((data) => {
        setParts(data);
        setLoading(false);
      });
  }, []);

  const filtered = parts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.partNo.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q);
    const isLow = p.quantity <= p.minStock;
    const matchesStock =
      !stockFilter ||
      (stockFilter === "low" && isLow) ||
      (stockFilter === "ok" && !isLow);
    return matchesSearch && matchesStock;
  });

  const hasFilters = search || stockFilter;

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
          {filtered.length} of {parts.length} parts
        </p>
        <Link
          href="/parts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Part
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
            placeholder="Search parts..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStockFilter("");
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {parts.length === 0 ? (
        <EmptyState
          title="No parts in inventory"
          description="Add your first part to start tracking inventory."
          actionLabel="Add Part"
          actionHref="/parts/new"
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          No parts match your filters.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((part) => {
                const isLowStock = part.quantity <= part.minStock;
                return (
                  <tr
                    key={part.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/parts/${part.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {part.name}
                      </Link>
                      {part.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                          {part.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {part.partNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {part.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ${part.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {part.location || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          In Stock
                        </span>
                      )}
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
