"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Mail, Phone, MapPin, Building } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  createdAt: string;
  tickets: Array<{
    id: string;
    ticketNo: string;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  warrantyClaims: Array<{
    id: string;
    claimNo: string;
    status: string;
    createdAt: string;
  }>;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomer(data);
        setForm({
          name: data.name,
          email: data.email || "",
          phone: data.phone || "",
          company: data.company || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
          notes: data.notes || "",
        });
      });
  }, [id]);

  async function handleUpdate() {
    setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer({ ...customer!, ...updated });
      setEditing(false);
    } else {
      const err = await res.json().catch(() => ({ error: "Failed to update customer" }));
      setError(err.error || "Failed to update customer");
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/customers");
      router.refresh();
    }
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name}? This will also affect related tickets and claims.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="text-sm text-gray-500">{customer.company}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400" />
              {customer.phone}
            </div>
          )}
          {(customer.city || customer.country) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              {[customer.address, customer.city, customer.country]
                .filter(Boolean)
                .join(", ")}
            </div>
          )}
          {customer.company && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4 text-gray-400" />
              {customer.company}
            </div>
          )}
        </div>

        {customer.notes && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Notes
            </p>
            <p className="text-sm text-gray-700">{customer.notes}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-4">
          Customer since {formatDate(customer.createdAt)}
        </p>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Edit Customer
          </button>
        ) : (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Edit Customer</h4>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Service Tickets ({customer.tickets.length})
          </h4>
          <Link
            href={`/tickets/new?customerId=${customer.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            New Ticket
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {customer.tickets.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 text-center">
              No tickets yet
            </p>
          ) : (
            customer.tickets.map((ticket) => (
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
                    {ticket.ticketNo} &middot; {formatDate(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={ticket.status} />
                  <StatusBadge value={ticket.priority} type="priority" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Warranty Claims */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Warranty Claims ({customer.warrantyClaims.length})
          </h4>
          <Link
            href={`/warranty/new?customerId=${customer.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            New Claim
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {customer.warrantyClaims.length === 0 ? (
            <p className="p-5 text-sm text-gray-500 text-center">
              No claims yet
            </p>
          ) : (
            customer.warrantyClaims.map((claim) => (
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
                    {formatDate(claim.createdAt)}
                  </p>
                </div>
                <StatusBadge value={claim.status} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
