"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
}

interface Part {
  id: string;
  name: string;
  partNo: string;
  unitPrice: number;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  partId: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    dueDate: "",
    taxRate: 0,
    paymentTerms: "Net 30",
    notes: "",
    ticketId: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, partId: "" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/parts").then((r) => r.json()),
    ]).then(([c, p]) => {
      setCustomers(c);
      setParts(p);
    });
  }, []);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, partId: "" }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill from part selection
    if (field === "partId" && value) {
      const part = parts.find((p) => p.id === value);
      if (part) {
        updated[index].description = part.name;
        updated[index].unitPrice = part.unitPrice;
      }
    }

    setItems(updated);
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.dueDate || items.some((i) => !i.description))
      return;

    setLoading(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          partId: item.partId || undefined,
        })),
      }),
    });

    if (res.ok) {
      const invoice = await res.json();
      router.push(`/payments/${invoice.id}`);
      router.refresh();
    }
    setLoading(false);
  }

  // Set default due date to 30 days from now
  useEffect(() => {
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setForm((f) => ({ ...f, dueDate: due.toISOString().split("T")[0] }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/payments"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payments
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Create New Invoice
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                autoFocus
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
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={form.paymentTerms}
                onChange={(e) =>
                  setForm({ ...form, paymentTerms: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Line Items <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Part (Optional)
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-24">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Unit Price
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <select
                          value={item.partId}
                          onChange={(e) =>
                            updateItem(idx, "partId", e.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.partNo} - {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(idx, "description", e.target.value)
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="text-gray-500">Tax</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={form.taxRate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-xs">%</span>
                    <span className="font-medium ml-auto">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Invoice"}
            </button>
            <Link
              href="/payments"
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
