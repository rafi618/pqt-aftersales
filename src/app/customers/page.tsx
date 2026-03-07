import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Mail, Phone } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: {
      _count: { select: { tickets: true, warrantyClaims: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {customers.length} total customers
        </p>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <EmptyState
          title="No customers"
          description="Add your first customer to get started."
          actionLabel="Add Customer"
          actionHref="/customers/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {customer.name}
                  </h3>
                  {customer.company && (
                    <p className="text-sm text-gray-500">{customer.company}</p>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-4 text-xs text-gray-400">
                <span>{customer._count.tickets} tickets</span>
                <span>{customer._count.warrantyClaims} claims</span>
                <span>Since {formatDate(customer.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
