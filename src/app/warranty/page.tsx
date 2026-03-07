import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WarrantyPage() {
  const claims = await prisma.warrantyClaim.findMany({
    include: { customer: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {claims.length} total claims
        </p>
        <Link
          href="/warranty/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Claim
        </Link>
      </div>

      {claims.length === 0 ? (
        <EmptyState
          title="No warranty claims"
          description="Create your first warranty claim to get started."
          actionLabel="New Claim"
          actionHref="/warranty/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/warranty/${claim.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {claim.claimNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.product?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge value={claim.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {claim.purchaseDate
                      ? formatDate(claim.purchaseDate)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(claim.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
