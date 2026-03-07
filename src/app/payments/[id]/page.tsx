"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  CreditCard,
  FileText,
  CheckCircle,
  Send,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import {
  formatDate,
  formatCurrency,
  getDaysUntilDue,
  paymentMethodLabels,
} from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  part: { name: string; partNo: string } | null;
}

interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  paymentTerms: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
  ticket: { id: string; ticketNo: string; subject: string } | null;
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "bank_transfer",
    reference: "",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then(setInvoice);
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/payments");
      router.refresh();
    }
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setInvoice(updated);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentForm.amount) return;

    setPaymentLoading(true);
    const res = await fetch(`/api/invoices/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });

    if (res.ok) {
      // Refresh invoice data
      const updated = await fetch(`/api/invoices/${id}`).then((r) => r.json());
      setInvoice(updated);
      setShowPaymentForm(false);
      setPaymentForm({
        amount: "",
        method: "bank_transfer",
        reference: "",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    } else {
      const err = await res.json();
      alert(err.error || "Failed to record payment");
    }
    setPaymentLoading(false);
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount;
  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
  const isOverdue =
    invoice.status !== "paid" &&
    invoice.status !== "cancelled" &&
    invoice.status !== "draft" &&
    daysUntilDue < 0;
  const displayStatus = isOverdue ? "overdue" : invoice.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <button
              onClick={() => handleStatusChange("sent")}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Send className="h-4 w-4" />
              Mark as Sent
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button
              onClick={() => handleStatusChange("cancelled")}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </button>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Invoice Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileText className="h-5 w-5 text-gray-400" />
              <p className="text-sm text-gray-500">{invoice.invoiceNo}</p>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {formatCurrency(invoice.totalAmount)}
            </h3>
            {invoice.paymentTerms && (
              <p className="text-xs text-gray-400 mt-1">
                {invoice.paymentTerms}
              </p>
            )}
          </div>
          <div className="text-right">
            <StatusBadge value={displayStatus} type="invoice" />
            {balance > 0 && invoice.status !== "cancelled" && (
              <p className="text-sm text-gray-500 mt-2">
                Balance: <span className="font-semibold text-amber-600">{formatCurrency(balance)}</span>
              </p>
            )}
            {invoice.status === "paid" && (
              <div className="flex items-center gap-1 mt-2 text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Fully Paid</span>
              </div>
            )}
          </div>
        </div>

        {/* Due Date Warning */}
        {isOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700 font-medium">
              This invoice is {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? "s" : ""} overdue
            </p>
          </div>
        )}
        {!isOverdue && daysUntilDue <= 7 && daysUntilDue >= 0 && invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-700 font-medium">
              Due in {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""} ({formatDate(invoice.dueDate)})
            </p>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Customer
            </p>
            <Link
              href={`/customers/${invoice.customer.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {invoice.customer.name}
            </Link>
            {invoice.customer.company && (
              <p className="text-xs text-gray-400">{invoice.customer.company}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Issue Date
            </p>
            <p className="text-sm">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Due Date
            </p>
            <p className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}>
              {formatDate(invoice.dueDate)}
            </p>
          </div>
          {invoice.ticket && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Related Ticket
              </p>
              <Link
                href={`/tickets/${invoice.ticket.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {invoice.ticket.ticketNo}
              </Link>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-20">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">
                  Unit Price
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{item.description}</p>
                    {item.part && (
                      <p className="text-xs text-gray-400">
                        Part: {item.part.partNo}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-500">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex justify-end space-y-1">
              <div className="w-64 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Tax ({invoice.taxRate}%)
                    </span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-300">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Paid</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-sm font-bold text-amber-600 pt-1 border-t border-gray-300">
                    <span>Balance Due</span>
                    <span>{formatCurrency(balance)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Payment History ({invoice.payments.length})
          </h3>
          {balance > 0.01 &&
            invoice.status !== "cancelled" &&
            invoice.status !== "draft" && (
              <button
                onClick={() => {
                  setPaymentForm((f) => ({
                    ...f,
                    amount: balance.toFixed(2),
                  }));
                  setShowPaymentForm(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Record Payment
              </button>
            )}
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={balance}
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Max: {formatCurrency(balance)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, method: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        reference: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Cheque #1234, TXN-ABC..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Payment notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={paymentLoading}
                  className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {paymentLoading ? "Recording..." : "Record Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payment List */}
        <div className="divide-y divide-gray-100">
          {invoice.payments.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 text-center">
              No payments recorded yet
            </p>
          ) : (
            invoice.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {payment.paymentNo}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {paymentMethodLabels[payment.method] || payment.method}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(payment.paymentDate)}
                    {payment.reference && ` | Ref: ${payment.reference}`}
                  </p>
                  {payment.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {payment.notes}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold text-emerald-600">
                  +{formatCurrency(payment.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
