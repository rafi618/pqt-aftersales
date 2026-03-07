"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface Part {
  id: string;
  name: string;
  partNo: string;
  description: string | null;
  quantity: number;
  minStock: number;
  unitPrice: number;
  location: string | null;
  product: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [part, setPart] = useState<Part | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "0",
    minStock: "5",
    unitPrice: "0",
    location: "",
    description: "",
  });

  useEffect(() => {
    fetch(`/api/parts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPart(data);
        setForm({
          name: data.name,
          quantity: String(data.quantity),
          minStock: String(data.minStock),
          unitPrice: String(data.unitPrice),
          location: data.location || "",
          description: data.description || "",
        });
      });
  }, [id]);

  async function handleUpdate() {
    const res = await fetch(`/api/parts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setPart({ ...part!, ...updated });
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this part?")) return;
    const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/parts");
      router.refresh();
    }
  }

  if (!part) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const isLowStock = part.quantity <= part.minStock;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/parts"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parts
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 font-mono">{part.partNo}</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">
              {part.name}
            </h3>
          </div>
          {isLowStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Quantity
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {part.quantity}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Min Stock
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {part.minStock}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Unit Price
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${part.unitPrice.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Total Value
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ${(part.quantity * part.unitPrice).toFixed(2)}
            </p>
          </div>
        </div>

        {part.location && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Location
            </p>
            <p className="text-sm">{part.location}</p>
          </div>
        )}

        {part.description && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Description
            </p>
            <p className="text-sm text-gray-700">{part.description}</p>
          </div>
        )}

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Edit Part
          </button>
        ) : (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Edit Part</h4>
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
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock
                </label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                  min="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
    </div>
  );
}
