import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Acme Industries",
        email: "billing@acme.com",
        phone: "+1-555-0101",
        company: "Acme Industries Ltd.",
        city: "Houston",
        country: "USA",
      },
    }),
    prisma.customer.create({
      data: {
        name: "TechFlow Solutions",
        email: "accounts@techflow.io",
        phone: "+1-555-0202",
        company: "TechFlow Solutions Inc.",
        city: "Dallas",
        country: "USA",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Gulf Engineering",
        email: "finance@gulfeng.com",
        phone: "+971-4-555-0303",
        company: "Gulf Engineering LLC",
        city: "Dubai",
        country: "UAE",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Pacific Motors",
        email: "service@pacificmotors.com",
        phone: "+1-555-0404",
        company: "Pacific Motors Group",
        city: "Los Angeles",
        country: "USA",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Northern Logistics",
        email: "ops@northlog.ca",
        phone: "+1-555-0505",
        company: "Northern Logistics Corp.",
        city: "Toronto",
        country: "Canada",
      },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: { name: "Industrial Pump X200", sku: "PMP-X200", category: "Pumps", warrantyMonths: 24 },
    }),
    prisma.product.create({
      data: { name: "Compressor Unit C500", sku: "CMP-C500", category: "Compressors", warrantyMonths: 18 },
    }),
    prisma.product.create({
      data: { name: "Generator Set G1000", sku: "GEN-G1000", category: "Generators", warrantyMonths: 36 },
    }),
  ]);

  // Create parts
  const parts = await Promise.all([
    prisma.part.create({
      data: { name: "Bearing Assembly", partNo: "PRT-BRG001", quantity: 45, unitPrice: 125.00, location: "Shelf A1" },
    }),
    prisma.part.create({
      data: { name: "Impeller Kit", partNo: "PRT-IMP002", quantity: 20, unitPrice: 340.00, location: "Shelf B3" },
    }),
    prisma.part.create({
      data: { name: "Seal Ring Set", partNo: "PRT-SRL003", quantity: 100, unitPrice: 45.50, location: "Shelf A2" },
    }),
    prisma.part.create({
      data: { name: "Control Board", partNo: "PRT-CTL004", quantity: 12, unitPrice: 890.00, location: "Shelf C1" },
    }),
    prisma.part.create({
      data: { name: "Motor Coupling", partNo: "PRT-MCP005", quantity: 30, unitPrice: 210.00, location: "Shelf B1" },
    }),
    prisma.part.create({
      data: { name: "Filter Element", partNo: "PRT-FLT006", quantity: 60, unitPrice: 78.00, location: "Shelf A3" },
    }),
  ]);

  // Create tickets
  const tickets = await Promise.all([
    prisma.ticket.create({
      data: {
        ticketNo: "TKT-00001",
        subject: "Pump vibration issue - urgent",
        description: "Customer reports excessive vibration on X200 pump after 6 months of operation.",
        status: "in-progress",
        priority: "high",
        category: "Maintenance",
        assignedTo: "John Smith",
        customerId: customers[0].id,
        productId: products[0].id,
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNo: "TKT-00002",
        subject: "Compressor oil leak",
        description: "Small oil leak detected at the shaft seal area.",
        status: "open",
        priority: "medium",
        category: "Repair",
        assignedTo: "Mike Johnson",
        customerId: customers[1].id,
        productId: products[1].id,
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNo: "TKT-00003",
        subject: "Generator annual maintenance",
        description: "Scheduled annual maintenance for G1000 generator set.",
        status: "open",
        priority: "low",
        category: "Maintenance",
        assignedTo: "Sarah Williams",
        customerId: customers[2].id,
        productId: products[2].id,
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNo: "TKT-00004",
        subject: "Control board replacement",
        description: "Control board showing intermittent faults, needs replacement.",
        status: "resolved",
        priority: "critical",
        category: "Repair",
        assignedTo: "John Smith",
        customerId: customers[3].id,
        productId: products[0].id,
      },
    }),
    prisma.ticket.create({
      data: {
        ticketNo: "TKT-00005",
        subject: "Pump startup calibration",
        description: "New pump installation requires startup calibration.",
        status: "open",
        priority: "medium",
        category: "Installation",
        assignedTo: "Mike Johnson",
        customerId: customers[4].id,
        productId: products[0].id,
      },
    }),
  ]);

  // Create warranty claims
  await Promise.all([
    prisma.warrantyClaim.create({
      data: {
        claimNo: "WRC-00001",
        status: "approved",
        issueDescription: "Premature bearing failure within warranty period",
        resolution: "Bearing assembly replaced under warranty",
        purchaseDate: new Date("2025-06-15"),
        expiryDate: new Date("2027-06-15"),
        customerId: customers[0].id,
        productId: products[0].id,
      },
    }),
    prisma.warrantyClaim.create({
      data: {
        claimNo: "WRC-00002",
        status: "pending",
        issueDescription: "Compressor unit showing reduced performance",
        purchaseDate: new Date("2025-09-01"),
        expiryDate: new Date("2027-03-01"),
        customerId: customers[1].id,
        productId: products[1].id,
      },
    }),
    prisma.warrantyClaim.create({
      data: {
        claimNo: "WRC-00003",
        status: "rejected",
        issueDescription: "Generator fuel system issue",
        resolution: "Damage caused by improper fuel - not covered",
        purchaseDate: new Date("2024-12-01"),
        expiryDate: new Date("2027-12-01"),
        customerId: customers[2].id,
        productId: products[2].id,
      },
    }),
  ]);

  // Create invoices across multiple months for monthly tracking demo
  const now = new Date();
  const currentYear = now.getFullYear();

  // January invoices
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0001",
      status: "paid",
      issueDate: new Date(currentYear, 0, 10),
      dueDate: new Date(currentYear, 1, 9),
      subtotal: 2350.00,
      taxRate: 5,
      taxAmount: 117.50,
      totalAmount: 2467.50,
      paidAmount: 2467.50,
      paymentTerms: "Net 30",
      customerId: customers[0].id,
      ticketId: tickets[3].id,
      items: {
        create: [
          { description: "Control Board Replacement", quantity: 1, unitPrice: 890.00, amount: 890.00, partId: parts[3].id },
          { description: "Labor - Board Installation (4 hrs)", quantity: 4, unitPrice: 150.00, amount: 600.00 },
          { description: "Bearing Assembly", quantity: 2, unitPrice: 125.00, amount: 250.00, partId: parts[0].id },
          { description: "System Testing & Calibration", quantity: 1, unitPrice: 610.00, amount: 610.00 },
        ],
      },
      payments: {
        create: [
          { paymentNo: "PAY-2026-0001", amount: 2467.50, paymentDate: new Date(currentYear, 0, 25), method: "bank_transfer", reference: "TXN-98201" },
        ],
      },
    },
  });

  // February invoices
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0002",
      status: "paid",
      issueDate: new Date(currentYear, 1, 5),
      dueDate: new Date(currentYear, 2, 7),
      subtotal: 4560.00,
      taxRate: 5,
      taxAmount: 228.00,
      totalAmount: 4788.00,
      paidAmount: 4788.00,
      paymentTerms: "Net 30",
      customerId: customers[2].id,
      items: {
        create: [
          { description: "Generator Annual Maintenance Service", quantity: 1, unitPrice: 2500.00, amount: 2500.00 },
          { description: "Filter Element Replacement", quantity: 4, unitPrice: 78.00, amount: 312.00, partId: parts[5].id },
          { description: "Motor Coupling Inspection & Service", quantity: 1, unitPrice: 210.00, amount: 210.00, partId: parts[4].id },
          { description: "Oil & Fluids", quantity: 1, unitPrice: 538.00, amount: 538.00 },
          { description: "Travel & Logistics (Dubai)", quantity: 1, unitPrice: 1000.00, amount: 1000.00 },
        ],
      },
      payments: {
        create: [
          { paymentNo: "PAY-2026-0002", amount: 2000.00, paymentDate: new Date(currentYear, 1, 20), method: "bank_transfer", reference: "TXN-10442" },
          { paymentNo: "PAY-2026-0003", amount: 2788.00, paymentDate: new Date(currentYear, 2, 1), method: "bank_transfer", reference: "TXN-10587" },
        ],
      },
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0003",
      status: "paid",
      issueDate: new Date(currentYear, 1, 18),
      dueDate: new Date(currentYear, 2, 20),
      subtotal: 1680.00,
      taxRate: 5,
      taxAmount: 84.00,
      totalAmount: 1764.00,
      paidAmount: 1764.00,
      paymentTerms: "Net 30",
      customerId: customers[1].id,
      items: {
        create: [
          { description: "Seal Ring Set Replacement", quantity: 2, unitPrice: 45.50, amount: 91.00, partId: parts[2].id },
          { description: "Impeller Kit", quantity: 1, unitPrice: 340.00, amount: 340.00, partId: parts[1].id },
          { description: "Labor - Compressor Overhaul (6 hrs)", quantity: 6, unitPrice: 150.00, amount: 900.00 },
          { description: "Diagnostic Testing", quantity: 1, unitPrice: 349.00, amount: 349.00 },
        ],
      },
      payments: {
        create: [
          { paymentNo: "PAY-2026-0004", amount: 1764.00, paymentDate: new Date(currentYear, 2, 10), method: "cheque", reference: "CHQ-44521" },
        ],
      },
    },
  });

  // March invoices (current month - mix of statuses)
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0004",
      status: "partial",
      issueDate: new Date(currentYear, 2, 1),
      dueDate: new Date(currentYear, 2, 31),
      subtotal: 5200.00,
      taxRate: 5,
      taxAmount: 260.00,
      totalAmount: 5460.00,
      paidAmount: 3000.00,
      paymentTerms: "Net 30",
      customerId: customers[3].id,
      items: {
        create: [
          { description: "Complete Pump Overhaul Service", quantity: 1, unitPrice: 3500.00, amount: 3500.00 },
          { description: "Bearing Assembly", quantity: 4, unitPrice: 125.00, amount: 500.00, partId: parts[0].id },
          { description: "Impeller Kit", quantity: 1, unitPrice: 340.00, amount: 340.00, partId: parts[1].id },
          { description: "Seal Ring Set", quantity: 4, unitPrice: 45.50, amount: 182.00, partId: parts[2].id },
          { description: "Performance Testing", quantity: 1, unitPrice: 678.00, amount: 678.00 },
        ],
      },
      payments: {
        create: [
          { paymentNo: "PAY-2026-0005", amount: 3000.00, paymentDate: new Date(currentYear, 2, 5), method: "bank_transfer", reference: "TXN-11023", notes: "Partial payment - balance due by month end" },
        ],
      },
    },
  });

  const inv5 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0005",
      status: "sent",
      issueDate: new Date(currentYear, 2, 3),
      dueDate: new Date(currentYear, 3, 2),
      subtotal: 3150.00,
      taxRate: 5,
      taxAmount: 157.50,
      totalAmount: 3307.50,
      paidAmount: 0,
      paymentTerms: "Net 30",
      customerId: customers[4].id,
      ticketId: tickets[4].id,
      items: {
        create: [
          { description: "Pump Installation & Commissioning", quantity: 1, unitPrice: 2000.00, amount: 2000.00 },
          { description: "Motor Coupling", quantity: 2, unitPrice: 210.00, amount: 420.00, partId: parts[4].id },
          { description: "Startup Calibration Service", quantity: 1, unitPrice: 730.00, amount: 730.00 },
        ],
      },
    },
  });

  const inv6 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0006",
      status: "draft",
      issueDate: new Date(currentYear, 2, 7),
      dueDate: new Date(currentYear, 3, 6),
      subtotal: 1240.00,
      taxRate: 5,
      taxAmount: 62.00,
      totalAmount: 1302.00,
      paidAmount: 0,
      paymentTerms: "Net 30",
      customerId: customers[0].id,
      ticketId: tickets[0].id,
      items: {
        create: [
          { description: "Vibration Analysis & Diagnostics", quantity: 1, unitPrice: 450.00, amount: 450.00 },
          { description: "Bearing Assembly", quantity: 2, unitPrice: 125.00, amount: 250.00, partId: parts[0].id },
          { description: "Dynamic Balancing Service", quantity: 1, unitPrice: 540.00, amount: 540.00 },
        ],
      },
    },
  });

  // An overdue invoice from January
  const inv7 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2026-0007",
      status: "overdue",
      issueDate: new Date(currentYear, 0, 20),
      dueDate: new Date(currentYear, 1, 19),
      subtotal: 2100.00,
      taxRate: 5,
      taxAmount: 105.00,
      totalAmount: 2205.00,
      paidAmount: 0,
      paymentTerms: "Net 30",
      notes: "Multiple follow-ups sent. Customer requesting extension.",
      customerId: customers[1].id,
      items: {
        create: [
          { description: "Emergency Compressor Repair", quantity: 1, unitPrice: 1500.00, amount: 1500.00 },
          { description: "Seal Ring Set", quantity: 6, unitPrice: 45.50, amount: 273.00, partId: parts[2].id },
          { description: "After-hours Service Surcharge", quantity: 1, unitPrice: 327.00, amount: 327.00 },
        ],
      },
    },
  });

  console.log("Seed complete!");
  console.log(`Created: ${customers.length} customers, ${products.length} products, ${parts.length} parts`);
  console.log(`Created: ${tickets.length} tickets, 3 warranty claims, 7 invoices with payments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
