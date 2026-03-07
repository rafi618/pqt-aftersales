import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  // Get all invoices for the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);

  const invoices = await prisma.invoice.findMany({
    where: {
      issueDate: { gte: startDate, lt: endDate },
      status: { not: "cancelled" },
    },
    include: {
      payments: true,
      customer: true,
    },
    orderBy: { issueDate: "asc" },
  });

  // Build monthly breakdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthInvoices = invoices.filter((inv) => {
      const d = new Date(inv.issueDate);
      return d.getMonth() === i;
    });

    const invoiced = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collected = monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const outstanding = invoiced - collected;
    const overdueAmount = monthInvoices
      .filter((inv) => inv.status === "overdue" || (inv.status !== "paid" && new Date(inv.dueDate) < new Date()))
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

    return {
      month: i + 1,
      invoiceCount: monthInvoices.length,
      invoiced: Math.round(invoiced * 100) / 100,
      collected: Math.round(collected * 100) / 100,
      outstanding: Math.round(outstanding * 100) / 100,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
    };
  });

  // Yearly totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  // Top customers by revenue
  const customerMap = new Map<string, { name: string; total: number; paid: number }>();
  for (const inv of invoices) {
    const existing = customerMap.get(inv.customerId);
    if (existing) {
      existing.total += inv.totalAmount;
      existing.paid += inv.paidAmount;
    } else {
      customerMap.set(inv.customerId, {
        name: inv.customer.name,
        total: inv.totalAmount,
        paid: inv.paidAmount,
      });
    }
  }
  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      total: Math.round(c.total * 100) / 100,
      paid: Math.round(c.paid * 100) / 100,
    }));

  return NextResponse.json({
    year,
    months,
    totals: {
      invoiced: Math.round(totalInvoiced * 100) / 100,
      collected: Math.round(totalCollected * 100) / 100,
      outstanding: Math.round(totalOutstanding * 100) / 100,
      invoiceCount: invoices.length,
    },
    topCustomers,
  });
}
