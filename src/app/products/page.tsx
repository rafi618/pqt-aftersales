import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Box } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      _count: { select: { tickets: true, warrantyClaims: true, parts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {products.length} total products
        </p>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products"
          description="Add your first product to get started."
          actionLabel="Add Product"
          actionHref="/products/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono">
                    {product.sku}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Box className="h-5 w-5" />
                </div>
              </div>

              {product.category && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 mt-2">
                  {product.category}
                </span>
              )}

              {product.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="mt-4 flex gap-4 text-xs text-gray-400">
                <span>{product._count.parts} parts</span>
                <span>{product._count.tickets} tickets</span>
                <span>{product._count.warrantyClaims} claims</span>
                <span>{product.warrantyMonths}mo warranty</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
