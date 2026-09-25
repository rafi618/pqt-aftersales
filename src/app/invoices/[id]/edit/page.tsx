import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import InvoiceComposer from "@/components/invoices/InvoiceComposer";
import { newKey } from "@/lib/invoices/config";
import { formOptions } from "@/lib/invoices/formData";
import { parseItems } from "@/lib/invoices/service";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id }, include: { vouchers: true } });
  if (!inv) notFound();
  const uploaded = inv.source === "uploaded";
  if (!uploaded && inv.status !== "draft") redirect(`/invoices/${id}`);
  const { clients, vouchers } = await formOptions(id);

  if (!uploaded) {
    const refs = Object.fromEntries(inv.vouchers.map((v) => [v.id, v.refCode]));
    return (
      <InvoiceComposer
        clients={clients}
        vouchers={vouchers}
        initial={{
          invoiceId: id,
          number: inv.number,
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
          rows: parseItems(inv.itemsJson).map((it) => ({
            key: newKey(),
            category: it.category ?? "none",
            details: it.details ?? it.description,
            amount: it.quantity * it.unitPrice,
            voucherId: it.voucherId ?? null,
            voucherRef: it.voucherId ? refs[it.voucherId] ?? null : null,
          })),
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Editing <span className="font-mono text-blue-700">{inv.number}</span></p>
      <InvoiceForm
        invoiceId={id}
        uploaded
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
