"use client";

import { useState, useEffect, use } from "react";
import { formatDate, formatCurrency, paymentMethodLabels } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
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
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
}

export default function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data);
        // Auto-trigger print after short delay
        setTimeout(() => window.print(), 500);
      });
  }, [id]);

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading invoice...</div>
      </div>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Print Invoice
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
        >
          Back
        </button>
      </div>

      <div id="print-area" className="max-w-3xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PQT</h1>
            <p className="text-sm text-gray-500">After-Sales Services</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600 font-mono mt-1">
              {invoice.invoiceNo}
            </p>
            <p className={`text-sm font-medium mt-1 capitalize ${
              invoice.status === "paid" ? "text-green-600" :
              invoice.status === "cancelled" ? "text-gray-400" : "text-gray-700"
            }`}>
              {invoice.status}
            </p>
          </div>
        </div>

        {/* Bill To + Dates */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Bill To
            </p>
            <p className="font-medium text-gray-900">{invoice.customer.name}</p>
            {invoice.customer.company && (
              <p className="text-sm text-gray-600">{invoice.customer.company}</p>
            )}
            {invoice.customer.address && (
              <p className="text-sm text-gray-600">{invoice.customer.address}</p>
            )}
            {(invoice.customer.city || invoice.customer.country) && (
              <p className="text-sm text-gray-600">
                {[invoice.customer.city, invoice.customer.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {invoice.customer.email && (
              <p className="text-sm text-gray-600">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            )}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Issue Date:{" "}
                </span>
                <span className="text-sm">{formatDate(invoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  Due Date:{" "}
                </span>
                <span className="text-sm">{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.paymentTerms && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Terms:{" "}
                  </span>
                  <span className="text-sm">{invoice.paymentTerms}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="py-2 text-left text-xs font-bold text-gray-700 uppercase">
                Description
              </th>
              <th className="py-2 text-right text-xs font-bold text-gray-700 uppercase w-16">
                Qty
              </th>
              <th className="py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">
                Unit Price
              </th>
              <th className="py-2 text-right text-xs font-bold text-gray-700 uppercase w-24">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2 text-sm text-gray-900">
                  {item.description}
                </td>
                <td className="py-2 text-sm text-right text-gray-600">
                  {item.quantity}
                </td>
                <td className="py-2 text-sm text-right text-gray-600">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="py-2 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-gray-900">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            {invoice.paidAmount > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>Paid</span>
                <span>-{formatCurrency(invoice.paidAmount)}</span>
              </div>
            )}
            {balance > 0 && (
              <div className="flex justify-between text-base font-bold text-amber-700 pt-1 border-t border-gray-300">
                <span>Balance Due</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Payment History
            </p>
            <div className="space-y-1">
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span>
                    {formatDate(payment.paymentDate)} &middot;{" "}
                    {paymentMethodLabels[payment.method] || payment.method}
                    {payment.reference && ` (${payment.reference})`}
                  </span>
                  <span className="text-green-700 font-medium">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-8 text-center">
          <p className="text-xs text-gray-400">
            Thank you for your business. &middot; PQT After-Sales Services
          </p>
        </div>
      </div>
    </>
  );
}
