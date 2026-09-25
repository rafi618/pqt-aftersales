"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// Public share pages, login and the print sheet render without the staff chrome.
const BARE = [/^\/s\//, /^\/login/, /^\/archive\/tags/];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (BARE.some((re) => re.test(pathname))) return <>{children}</>;
  return (
    <>
      <Sidebar />
      <div className="ml-64 min-h-screen">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </>
  );
}
