"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/archive/upload": "Upload Documents",
  "/archive/links": "Share Links",
  "/archive/activity": "Activity Log",
  "/archive/clients/new": "New Client",
  "/archive/clients": "Client File",
  "/archive/documents": "Document",
  "/archive": "Client Archive",
  "/invoices/new": "Create Invoice",
  "/invoices/upload": "Upload Voucher / Invoice",
  "/invoices/vouchers": "Voucher",
  "/invoices": "Invoices & Vouchers",
  "/dashboard": "Dashboard",
  "/tickets": "Service Tickets",
  "/customers": "Customers",
  "/warranty": "Warranty Claims",
  "/parts": "Parts & Inventory",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.includes("/new") && !pathname.startsWith("/archive")) {
    const base = pathname.split("/").slice(0, -1).join("/");
    return `New ${pageTitles[base]?.replace(/s$/, "") || "Item"}`;
  }
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Dashboard";
}

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold text-gray-800">
        {getPageTitle(pathname)}
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <form action="/archive" method="get">
          <input
            type="text"
            name="q"
            placeholder="Search clients, ref codes, documents…"
            className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          </form>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
