import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "PQT After-Sales Management",
  description:
    "Professional after-sales service management system for PQT - manage tickets, warranties, customers, and parts inventory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Sidebar />
        <div className="ml-64 min-h-screen">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
