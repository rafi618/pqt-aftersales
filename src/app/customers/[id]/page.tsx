"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Mail, Phone, MapPin, Building } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
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

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((res) => res.json())
      .then(setCustomer);
  }, [id]);

  async function handleDelete() {
    if (!confirm("Are you sure? This will also affect related tickets and claims.")) return;
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
          onClick={handleDelete}
          className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

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

        <p className="text-xs text-gray-400">
          Customer since {formatDate(customer.createdAt)}
        </p>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">
            Service Tickets ({customer.tickets.length})
          </h4>
          <Link
            href="/tickets/new"
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
            href="/warranty/new"
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
