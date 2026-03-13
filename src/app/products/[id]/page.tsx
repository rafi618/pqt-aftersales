"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Box, Ticket, Shield, Package } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  warrantyMonths: number;
  parts: {
    id: string;
    name: string;
    partNo: string;
    quantity: number;
    unitPrice: number;
  }[];
  tickets: {
    id: string;
    ticketNo: string;
    subject: string;
    status: string;
    customer: { name: string };
    createdAt: string;
  }[];
  warrantyClaims: {
    id: string;
    claimNo: string;
    status: string;
    customer: { name: string };
    createdAt: string;
  }[];
  createdAt: string;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    warrantyMonths: "12",
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setForm({
          name: data.name,
          sku: data.sku,
          category: data.category || "",
          description: data.description || "",
          warrantyMonths: String(data.warrantyMonths),
        });
      });
  }, [id]);

  async function handleUpdate() {
    setError("");
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setProduct({ ...product!, ...updated });
      setEditing(false);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product? This may affect related tickets, claims, and parts.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/products");
      router.refresh();
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">
              {product.name}
            </h3>
            {product.category && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 mt-2">
                {product.category}
              </span>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <Box className="h-6 w-6" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Warranty
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {product.warrantyMonths}
            </p>
            <p className="text-xs text-gray-400">months</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">Parts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {product.parts.length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Tickets
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {product.tickets.length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Claims
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {product.warrantyClaims.length}
            </p>
          </div>
        </div>

        {product.description && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Description
            </p>
            <p className="text-sm text-gray-700">{product.description}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Edit Product
          </button>
        ) : (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Edit Product</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) =>
                    setForm({ ...form, sku: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty (months)
                </label>
                <input
                  type="number"
                  value={form.warrantyMonths}
                  onChange={(e) =>
                    setForm({ ...form, warrantyMonths: e.target.value })
                  }
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Related Parts */}
      {product.parts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Associated Parts ({product.parts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {product.parts.map((part) => (
              <Link
                key={part.id}
                href={`/parts/${part.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {part.name}
                  </p>
                  <p className="text-xs text-gray-500">{part.partNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">
                    Qty: {part.quantity}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${part.unitPrice.toFixed(2)} each
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Tickets */}
      {product.tickets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Related Tickets ({product.tickets.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {product.tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.customer.name} &middot; {ticket.ticketNo}
                  </p>
                </div>
                <StatusBadge value={ticket.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Warranty Claims */}
      {product.warrantyClaims.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">
              Related Warranty Claims ({product.warrantyClaims.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {product.warrantyClaims.map((claim) => (
              <Link
                key={claim.id}
                href={`/warranty/${claim.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {claim.claimNo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {claim.customer.name} &middot; {formatDate(claim.createdAt)}
                  </p>
                </div>
                <StatusBadge value={claim.status} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
