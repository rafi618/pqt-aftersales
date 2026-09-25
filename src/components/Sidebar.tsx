"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Shield,
  Package,
  FolderArchive,
  Upload,
  Link2,
  History,
  Receipt,
  FilePlus2,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const archiveNav = [
  { name: "Client Archive", href: "/archive", icon: FolderArchive, exact: true },
  { name: "Upload Documents", href: "/archive/upload", icon: Upload },
  { name: "Share Links", href: "/archive/links", icon: Link2 },
  { name: "Activity Log", href: "/archive/activity", icon: History },
];

const invoiceNav = [
  { name: "Invoices & Vouchers", href: "/invoices", exact: true },
  { name: "Create Invoice", href: "/invoices/new" },
  { name: "Upload Voucher / Invoice", href: "/invoices/upload" },
];
const invoiceIcons = [Receipt, FilePlus2, ScanLine];

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Service Tickets", href: "/tickets", icon: Ticket },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Warranty Claims", href: "/warranty", icon: Shield },
  { name: "Parts & Inventory", href: "/parts", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-700">
        <FolderArchive className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-lg font-bold tracking-tight">PQT</h1>
          <p className="text-xs text-slate-400 -mt-1">Client Archive</p>
        </div>
      </div>

      <nav className="mt-4 px-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Documents
        </p>
        {archiveNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href ||
              pathname.startsWith("/archive/clients") ||
              pathname.startsWith("/archive/documents")
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Invoices
        </p>
        {invoiceNav.map((item, i) => {
          const Icon = invoiceIcons[i];
          const isActive = item.exact
            ? pathname === item.href || /^\/invoices\/(?!new|upload)/.test(pathname)
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          After-Sales
        </p>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium">PQT Staff</p>
            <p className="text-xs text-slate-400">Property Quest Turkey</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
