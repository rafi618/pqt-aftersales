"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ ids }: { ids: string[] }) {
  async function print() {
    // remember that tags were printed, then open the browser print dialog
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/archive/documents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagPrinted: true }),
        })
      )
    ).catch(() => {});
    window.print();
  }
  return (
    <button onClick={print} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
      <Printer className="h-4 w-4" /> Print
    </button>
  );
}
