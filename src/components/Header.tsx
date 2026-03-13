"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tickets": "Service Tickets",
  "/customers": "Customers",
  "/products": "Products",
  "/warranty": "Warranty Claims",
  "/parts": "Parts & Inventory",
  "/payments/monthly": "Monthly Revenue",
  "/payments": "Payments & Invoices",
};

function getPageTitle(pathname: string): string {
  if (pathname.includes("/new")) {
    const base = pathname.split("/").slice(0, -1).join("/");
    return `New ${pageTitles[base]?.replace(/s$/, "") || "Item"}`;
  }
  // Check exact match first, then startsWith (longer paths first)
  if (pageTitles[pathname]) return pageTitles[pathname];
  const sorted = Object.entries(pageTitles).sort((a, b) => b[0].length - a[0].length);
  for (const [path, title] of sorted) {
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
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
