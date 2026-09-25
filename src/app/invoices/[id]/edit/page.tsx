import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { formOptions } from "@/lib/invoices/formData";
import { parseItems } from "@/lib/invoices/service";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { vouchers: { select: { id: true } } } });
  if (!inv) notFound();
  const uploaded = inv.source === "uploaded";
  if (!uploaded && inv.status !== "draft") redirect(`/invoices/${id}`);
  const { clients, vouchers } = await formOptions(id);
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Editing <span className="font-mono text-blue-700">{inv.number}</span></p>
      <InvoiceForm
        invoiceId={id}
        uploaded={uploaded}
        clients={clients}
        vouchers={vouchers}
        initial={{
          clientId: inv.clientId ?? "",
          partyName: inv.partyName,
          partyAddress: inv.partyAddress ?? "",
          partyEmail: inv.partyEmail ?? "",
          partyTaxId: inv.partyTaxId ?? "",
          issueDate: inv.issueDate,
          dueDate: inv.dueDate ?? "",
          currency: inv.currency,
          vatRate: inv.vatRate,
          notes: inv.notes ?? "",
          items: parseItems(inv.itemsJson),
          voucherIds: inv.vouchers.map((v) => v.id),
          externalNo: inv.externalNo ?? "",
          direction: inv.direction,
          total: inv.total,
          vatAmount: inv.vatAmount,
        }}
      />
    </div>
  );
}
