import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, AlertTriangle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const parts = await prisma.part.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{parts.length} total parts</p>
        <Link
          href="/parts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Part
        </Link>
      </div>

      {parts.length === 0 ? (
        <EmptyState
          title="No parts in inventory"
          description="Add your first part to start tracking inventory."
          actionLabel="Add Part"
          actionHref="/parts/new"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parts.map((part) => {
                const isLowStock = part.quantity <= part.minStock;
                return (
                  <tr
                    key={part.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/parts/${part.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {part.name}
                      </Link>
                      {part.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                          {part.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {part.partNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {part.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      ${part.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {part.location || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
