import InvoiceForm from "@/components/invoices/InvoiceForm";
import { formOptions } from "@/lib/invoices/formData";
import { daysFromTodayISO, todayISO } from "@/lib/invoices/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// /invoices/new?vouchers=id1,id2  → pre-fills lines from those vouchers
// /invoices/new?client=id         → pre-fills the customer from a client file
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ vouchers?: string; client?: string }> }) {
  const sp = await searchParams;
  const { clients, vouchers } = await formOptions();
  const picked = vouchers.filter((v) => sp.vouchers?.split(",").includes(v.id));
  const clientId = sp.client ?? picked.find((v) => v.clientId)?.clientId ?? "";
  const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;
  const due = daysFromTodayISO(14);

  return (
    <InvoiceForm
      clients={clients}
      vouchers={vouchers}
      initial={{
        clientId: client?.id ?? "",
        partyName: client?.name ?? "",
        partyAddress: "",
        partyEmail: client?.email ?? "",
        partyTaxId: client?.passportNo ?? "",
        issueDate: todayISO(),
        dueDate: due,
        currency: picked.find((v) => v.currency)?.currency ?? "USD",
        vatRate: 20,
        notes: "",
        items: picked.length
          ? picked.map((v) => ({ description: `${v.label} (${v.refCode})`, quantity: 1, unitPrice: v.amount ?? 0 }))
          : [{ description: "", quantity: 1, unitPrice: 0 }],
        voucherIds: picked.map((v) => v.id),
      }}
    />
  );
}
