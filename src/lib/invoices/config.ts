// Company details printed on every invoice created in the system.
// Edit here if the address, tax number or bank details change.
export const COMPANY = {
  brand: "PROPERTY QUEST TURKEY",
  legalName: "Property Quest Global Gayrimenkul Ticaret Ltd. Şti.",
  taxNo: "7331126057",
  taxOffice: "Kozyatağı Vergi Dairesi",
  address:
    "Akşemsettin Mah. Hakperest Aralığı Sk. Altınsaray Apt. No: 7, 2nd Floor, İç Kapı No: 4, 34080 Fatih/İstanbul",
  email: "info@propertyquestturkey.com",
  phone: "+90 506 343 07 09",
  web: "propertyquestturkey.com",
  // Leave empty to hide the "Payment details" box on invoices.
  bank: [] as { label: string; value: string }[],
};

export const CURRENCIES = ["USD", "EUR", "GBP", "TRY"] as const;

export const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  issued: { label: "Issued – unpaid", color: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

// What a voucher (receipt, bill, bank slip…) was for. Keywords help the offline sorter.
export const VOUCHER_CATEGORIES: { id: string; label: string; keywords: string[] }[] = [
  { id: "tapu-fees", label: "Title deed fees & taxes (Tapu harcı / Döner sermaye)", keywords: ["tapu", "harc", "harç", "doner", "döner"] },
  { id: "notary", label: "Notary", keywords: ["noter", "notary"] },
  { id: "translation", label: "Translation", keywords: ["tercume", "tercüme", "translation", "yeminli"] },
  { id: "lawyer", label: "Lawyer / legal fees", keywords: ["avukat", "lawyer", "legal"] },
  { id: "valuation", label: "Valuation report", keywords: ["ekspertiz", "valuation", "degerleme", "değerleme"] },
  { id: "insurance", label: "Insurance (DASK / home / health)", keywords: ["dask", "sigorta", "insurance", "police", "poliçe"] },
  { id: "government", label: "Government & residence fees", keywords: ["ikamet", "residence", "nufus", "nüfus", "government", "gib", "vergi"] },
  { id: "utilities", label: "Utilities (electric, water, gas, internet)", keywords: ["elektrik", "electric", "su ", "water", "dogalgaz", "doğalgaz", "igdas", "iski", "bedas", "internet", "abone"] },
  { id: "dues", label: "Building dues (Aidat)", keywords: ["aidat", "dues", "site yonetim"] },
  { id: "furniture", label: "Furniture & appliances", keywords: ["mobilya", "furniture", "ikea", "koctas", "koçtaş", "beyaz esya", "appliance"] },
  { id: "maintenance", label: "Maintenance & repairs", keywords: ["tamir", "repair", "bakim", "bakım", "maintenance", "usta"] },
  { id: "travel", label: "Transfer, travel & accommodation", keywords: ["taxi", "taksi", "uber", "transfer", "hotel", "otel", "flight", "ucak", "uçak"] },
  { id: "bank", label: "Bank transfer / bank charges", keywords: ["dekont", "swift", "havale", "eft", "bank", "banka"] },
  { id: "commission", label: "Commission", keywords: ["komisyon", "commission"] },
  { id: "other", label: "Other", keywords: [] },
];

export function voucherCategoryLabel(id: string) {
  return VOUCHER_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function computeTotals(items: LineItem[], vatRate: number) {
  const subtotal = round2(items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0));
  const vatAmount = round2((subtotal * (Number(vatRate) || 0)) / 100);
  return { subtotal, vatAmount, total: round2(subtotal + vatAmount) };
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function money(n: number | null | undefined, currency = "USD") {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromTodayISO(days: number) {
  return new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10);
}
