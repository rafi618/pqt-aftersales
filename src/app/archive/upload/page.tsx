import { prisma } from "@/lib/prisma";
import UploadBox from "@/components/archive/UploadBox";
import { SECTIONS } from "@/lib/archive/taxonomy";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const clients = await prisma.client.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upload client documents</h3>
        <p className="text-sm text-gray-500">
          Type the client&apos;s name, drop the files, and the agent does the rest: each file gets a permanent reference number and goes into the right folder.
        </p>
      </div>
      <UploadBox endpoint="/api/archive/upload" askClientName clientNames={clients.map((c) => c.name)} />
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold mb-3">Where things go</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.filter((s) => s.id !== "unsorted").map((s) => (
            <div key={s.id}>
              <p className="text-sm font-medium"><span className={`mr-1 rounded px-1 font-mono text-xs ${s.color}`}>{s.code}</span>{s.label}</p>
              <p className="text-xs text-gray-500">{s.categories.map((c) => c.label).join(" · ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
