"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  warrantyMonths: number;
}

export default function NewWarrantyClaimPage() {
  return (
    <Suspense>
      <NewWarrantyClaimForm />
    </Suspense>
  );
}

function NewWarrantyClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerId: searchParams.get("customerId") || "",
    productId: "",
    issueDescription: "",
    purchaseDate: "",
    expiryDate: "",
  });

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then(setCustomers);
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId) return;

    setLoading(true);
    const res = await fetch("/api/warranty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/warranty");
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to create claim" }));
      setError(err.error || "Failed to create claim");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/warranty"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Warranty Claims
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          New Warranty Claim
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({ ...form, customerId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={form.productId}
              onChange={(e) => {
                const pid = e.target.value;
                const product = products.find((p) => p.id === pid);
                const updates: Partial<typeof form> = { productId: pid };
                // Auto-calculate expiry if purchase date is set
                if (product && form.purchaseDate) {
                  const purchase = new Date(form.purchaseDate);
                  purchase.setMonth(purchase.getMonth() + product.warrantyMonths);
                  updates.expiryDate = purchase.toISOString().split("T")[0];
                }
                setForm({ ...form, ...updates });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {p.warrantyMonths}mo warranty
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Description
            </label>
            <textarea
              value={form.issueDescription}
              onChange={(e) =>
                setForm({ ...form, issueDescription: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the warranty issue..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => {
                  const pd = e.target.value;
                  const product = products.find((p) => p.id === form.productId);
                  const updates: Partial<typeof form> = { purchaseDate: pd };
                  if (product && pd) {
                    const d = new Date(pd);
                    d.setMonth(d.getMonth() + product.warrantyMonths);
                    updates.expiryDate = d.toISOString().split("T")[0];
                  }
                  setForm({ ...form, ...updates });
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Submit Claim"}
            </button>
            <Link
              href="/warranty"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
