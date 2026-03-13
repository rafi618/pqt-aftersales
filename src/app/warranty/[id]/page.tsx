"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface Claim {
  id: string;
  claimNo: string;
  status: string;
  issueDescription: string | null;
  resolution: string | null;
  purchaseDate: string | null;
  expiryDate: string | null;
  customer: { id: string; name: string };
  product: { id: string; name: string } | null;
  createdAt: string;
}

export default function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: "",
    resolution: "",
  });

  useEffect(() => {
    fetch(`/api/warranty/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClaim(data);
        setForm({
          status: data.status,
          resolution: data.resolution || "",
        });
      });
  }, [id]);

  async function handleUpdate() {
    const res = await fetch(`/api/warranty/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setClaim({ ...claim!, ...updated });
      setEditing(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/warranty/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/warranty");
      router.refresh();
    }
  }

  if (!claim) {
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
          href="/warranty"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Warranty Claims
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
        title="Delete Warranty Claim"
        message={`Are you sure you want to delete claim ${claim.claimNo}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">{claim.claimNo}</p>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">
              Warranty Claim
            </h3>
          </div>
          <StatusBadge value={claim.status} />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Customer
            </p>
            <Link
              href={`/customers/${claim.customer.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {claim.customer.name}
            </Link>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Product
            </p>
            {claim.product ? (
              <Link
                href={`/products/${claim.product.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {claim.product.name}
              </Link>
            ) : (
              <p className="text-sm">N/A</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Purchase Date
            </p>
            <p className="text-sm">
              {claim.purchaseDate ? formatDate(claim.purchaseDate) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Warranty Expiry
            </p>
            <p className="text-sm">
              {claim.expiryDate ? formatDate(claim.expiryDate) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Filed On
            </p>
            <p className="text-sm">{formatDate(claim.createdAt)}</p>
          </div>
        </div>

        {claim.issueDescription && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
              Issue Description
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {claim.issueDescription}
            </p>
          </div>
        )}

        {claim.resolution && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <p className="text-xs font-medium text-green-700 uppercase mb-1">
              Resolution
            </p>
            <p className="text-sm text-green-800">{claim.resolution}</p>
          </div>
        )}

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Update Claim
          </button>
        ) : (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h4 className="font-medium text-gray-900">Update Claim</h4>
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resolution
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
      </div>
    </div>
  );
}
