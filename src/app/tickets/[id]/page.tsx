"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import DocumentSection from "@/components/DocumentSection";
import { formatDate } from "@/lib/utils";

interface Ticket {
  id: string;
  ticketNo: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  assignedTo: string | null;
  resolution: string | null;
  customerId: string;
  customer: { id: string; name: string; email: string | null; phone: string | null };
  product: { id: string; name: string; sku: string } | null;
  documents: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    filePath: string;
    label: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    resolution: "",
  });

  function loadTicket() {
    fetch(`/api/tickets/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTicket(data);
        setForm({
          status: data.status,
          priority: data.priority,
          assignedTo: data.assignedTo || "",
          resolution: data.resolution || "",
        });
      });
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function handleUpdate() {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...ticket,
        ...form,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket({ ...ticket!, ...updated });
      setEditing(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/tickets");
      router.refresh();
    }
  }

  if (!ticket) {
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
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
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
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket ${ticket.ticketNo}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">{ticket.ticketNo}</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">
              {ticket.subject}
            </h3>
          </div>
          <div className="flex gap-2">
            <StatusBadge value={ticket.status} />
            <StatusBadge value={ticket.priority} type="priority" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Customer
            </p>
            <Link
              href={`/customers/${ticket.customer.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {ticket.customer.name}
            </Link>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Category
            </p>
            <p className="text-sm capitalize">{ticket.category}</p>
          </div>
          {ticket.product && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Product
              </p>
              <Link
                href={`/products/${ticket.product.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {ticket.product.name}
              </Link>
              <p className="text-xs text-gray-400">{ticket.product.sku}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Assigned To
            </p>
            <p className="text-sm">{ticket.assignedTo || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Created
            </p>
            <p className="text-sm">{formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        {ticket.description && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Description
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        )}

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Update Ticket
          </button>
        ) : (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Update Ticket</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution Notes
              </label>
              <textarea
                value={form.resolution}
                onChange={(e) =>
                  setForm({ ...form, resolution: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Resolution details..."
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

        <DocumentSection
          documents={ticket.documents}
          entityType="ticketId"
          entityId={ticket.id}
          onUpdate={loadTicket}
        />
      </div>
    </div>
  );
}
