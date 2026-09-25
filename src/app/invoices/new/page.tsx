import InvoiceComposer from "@/components/invoices/InvoiceComposer";
import { newKey } from "@/lib/invoices/config";
import { formOptions } from "@/lib/invoices/formData";
import { daysFromTodayISO, todayISO } from "@/lib/invoices/config";

export const dynamic = "force-dynamic";

// /invoices/new?client=id          → starts with that client chosen
// /invoices/new?vouchers=id1,id2   → starts with those uploaded vouchers as lines
export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ vouchers?: string; client?: string }> }) {
  const sp = await searchParams;
  const { clients, vouchers } = await formOptions();
  const picked = vouchers.filter((v) => sp.vouchers?.split(",").includes(v.id));
  const clientId = sp.client ?? picked.find((v) => v.clientId)?.clientId ?? "";
  const client = clients.find((c) => c.id === clientId);

  return (
    <InvoiceComposer
      clients={clients}
      vouchers={vouchers}
      initial={{
        clientId: client?.id ?? "",
        partyName: client?.name ?? "",
        partyAddress: "",
        partyEmail: client?.email ?? "",
        partyTaxId: client?.passportNo ?? "",
        issueDate: todayISO(),
        dueDate: daysFromTodayISO(14),
        currency: picked.find((v) => v.currency)?.currency ?? "USD",
        vatRate: 20,
        notes: "",
        rows: picked.map((v) => ({
          key: newKey(),
          category: v.category,
          details: v.description ?? v.vendor ?? "",
          amount: v.amount ?? 0,
          voucherId: v.id,
          voucherRef: v.refCode,
        })),
      }}
    />
  );
}
