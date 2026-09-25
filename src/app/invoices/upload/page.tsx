import { prisma } from "@/lib/prisma";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";

export const dynamic = "force-dynamic";

export default async function InvoiceUploadPage() {
  const clients = await prisma.client.findMany({ select: { name: true }, orderBy: { name: "asc" } });
  return (
    <div className="max-w-4xl space-y-4">
      <p className="text-sm text-gray-500">
        Upload any voucher or invoice. Each file gets its own number (PQT-VCH-… for vouchers, PQT-UPL-… for invoices) and is kept unchanged.
      </p>
      <InvoiceUploader clientNames={clients.map((c) => c.name)} />
    </div>
  );
}
