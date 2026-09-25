import { prisma } from "@/lib/prisma";
import { voucherCategoryLabel } from "./config";

/** Clients and attachable vouchers for the invoice form. */
export async function formOptions(invoiceId?: string) {
  const [clients, vouchers] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientCode: true, email: true } }),
    prisma.voucher.findMany({
      where: { status: "active", OR: [{ invoiceId: null }, ...(invoiceId ? [{ invoiceId }] : [])] },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    clients,
    vouchers: vouchers.map((v) => ({
      id: v.id,
      refCode: v.refCode,
      clientId: v.clientId,
      label: [voucherCategoryLabel(v.category), v.vendor].filter(Boolean).join(" – "),
      amount: v.amount,
      currency: v.currency,
    })),
  };
}
