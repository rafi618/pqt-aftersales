// The archive's filing plan. Every document lives in exactly one section and
// one category. Keywords feed the offline sorter and are also given to the AI
// agent as hints — add Turkish and English variants when you add a category.

export type SectionId =
  | "legal"
  | "property"
  | "citizenship"
  | "aftersales"
  | "invoices"
  | "unsorted";

export interface Category {
  id: string;
  label: string;
  keywords: string[];
  /** generic categories lose ties against more specific ones (offline sorter only) */
  weak?: boolean;
}

export interface Section {
  id: SectionId;
  code: string; // two letters, shown on printed tags
  label: string;
  description: string;
  color: string; // tailwind classes for badges
  categories: Category[];
}

export const SECTIONS: Section[] = [
  {
    id: "legal",
    code: "LG",
    label: "Legal",
    description: "Power of attorney, identity and other legal papers",
    color: "bg-indigo-100 text-indigo-800",
    categories: [
      { id: "poa", label: "Power of Attorney (POA / Vekaletname)", keywords: ["poa", "power of attorney", "vekalet", "vekaletname"] },
      { id: "poa-revocation", label: "POA Revocation (Azilname)", keywords: ["azil", "azilname", "revocation", "revoke"] },
      { id: "passport", label: "Passport Copy", keywords: ["passport", "pasaport"] },
      { id: "translation", weak: true, label: "Sworn / Notarised Translation", keywords: ["translation", "tercume", "tercüme", "yeminli", "noter"] },
      { id: "apostille", weak: true, label: "Apostille", keywords: ["apostil", "apostille"] },
      { id: "tax-number", label: "Tax Number (Vergi No)", keywords: ["tax number", "vergi", "tax id"] },
      { id: "id-card", label: "ID Card / Residence Permit (İkamet)", keywords: ["id card", "kimlik", "ikamet", "residence permit", "residency"] },
      { id: "lawyer-engagement", label: "Lawyer Engagement / Fee Agreement", keywords: ["lawyer", "avukat", "engagement", "legal fee"] },
      { id: "court", label: "Court & Litigation", keywords: ["court", "mahkeme", "dava", "lawsuit", "icra"] },
      { id: "legal-correspondence", weak: true, label: "Legal Correspondence / Notices", keywords: ["ihtar", "notice", "letter", "ihtarname"] },
      { id: "legal-other", label: "Other Legal", keywords: [] },
    ],
  },
  {
    id: "property",
    code: "TD",
    label: "Title Deed & Property",
    description: "Everything from reservation to tapu for each flat",
    color: "bg-emerald-100 text-emerald-800",
    categories: [
      { id: "reservation", label: "Reservation Form", keywords: ["reservation", "rezervasyon", "booking", "deposit form"] },
      { id: "sales-contract", label: "Sales Contract / Promise to Sell", keywords: ["sales contract", "satis", "satış", "sozlesme", "sözleşme", "purchase agreement", "spa", "satış vaadi", "vaad"] },
      { id: "payment-plan", label: "Payment Plan & Payment Receipts", keywords: ["payment plan", "odeme plani", "ödeme planı", "installment", "taksit"] },
      { id: "tapu", label: "Title Deed (Tapu)", keywords: ["tapu", "title deed", "deed"] },
      { id: "takyidat", label: "Takyidat (Encumbrance Report)", keywords: ["takyidat", "takyıdat", "encumbrance", "ipotek", "haciz"] },
      { id: "subscriptions", label: "Subscription Numbers (Electric / Water / Gas / Internet)", keywords: ["abone", "subscription", "elektrik", "su abonelik", "dogalgaz", "doğalgaz", "igdas", "iski", "bedas", "ck enerji"] },
      { id: "buyer-seller", weak: true, label: "Buyer & Seller Data", keywords: ["buyer", "seller", "alici", "alıcı", "satici", "satıcı", "party info"] },
      { id: "fx-certificate", label: "Foreign Exchange Certificate (DAB)", keywords: ["dab", "doviz alim", "döviz alım", "foreign exchange", "exchange certificate", "fx"] },
      { id: "valuation", label: "Valuation Report (Ekspertiz)", keywords: ["valuation", "ekspertiz", "degerleme", "değerleme", "appraisal"] },
      { id: "iskan", label: "Occupancy Permit (İskan)", keywords: ["iskan", "occupancy", "yapi kullanma", "yapı kullanma"] },
      { id: "dask", label: "Earthquake Insurance (DASK)", keywords: ["dask", "earthquake", "deprem"] },
      { id: "plans", weak: true, label: "Floor Plans & Project Documents", keywords: ["floor plan", "plan", "kat plani", "project brochure", "brochure", "layout"] },
      { id: "handover", label: "Handover / Key Delivery Protocol", keywords: ["handover", "teslim", "key delivery", "anahtar"] },
      { id: "property-other", label: "Other Property", keywords: [] },
    ],
  },
  {
    id: "citizenship",
    code: "CZ",
    label: "Citizenship (CBI)",
    description: "Step-by-step Turkish Citizenship by Investment file",
    color: "bg-rose-100 text-rose-800",
    categories: [
      { id: "conformity-letter", label: "Conformity Letter (Uygunluk Belgesi)", keywords: ["conformity", "uygunluk"] },
      { id: "no-sale-annotation", label: "3-Year No-Sale Commitment (Şerh)", keywords: ["serh", "şerh", "annotation", "commitment", "taahhut", "taahhüt"] },
      { id: "cbi-application", label: "CBI Application Form / Petition", keywords: ["application", "basvuru", "başvuru", "dilekce", "dilekçe", "petition", "cbi"] },
      { id: "photos", label: "Biometric Photos", keywords: ["photo", "biometric", "fotograf", "fotoğraf", "vesikalik"] },
      { id: "birth-certificate", label: "Birth Certificate", keywords: ["birth", "dogum", "doğum"] },
      { id: "marriage-certificate", label: "Marriage Certificate", keywords: ["marriage", "evlilik", "nikah"] },
      { id: "family-docs", label: "Family Members' Documents", keywords: ["family", "spouse", "child", "aile", "es ", "eş", "cocuk", "çocuk"] },
      { id: "bank-transfer", label: "Bank Transfer / SWIFT Proof", keywords: ["swift", "bank transfer", "havale", "dekont", "wire"] },
      { id: "residence-permit-app", label: "Residence Permit Application", keywords: ["residence application", "ikamet basvuru", "e-ikamet"] },
      { id: "health-insurance", label: "Health Insurance", keywords: ["health insurance", "saglik sigortasi", "sağlık sigortası"] },
      { id: "fees-receipts", label: "Government Fee Receipts", keywords: ["harc", "harç", "fee receipt", "makbuz"] },
      { id: "citizenship-approval", label: "Citizenship Approval / Turkish ID & Passport", keywords: ["approval", "vatandaslik", "vatandaşlık", "citizenship", "turkish passport", "nufus", "nüfus"] },
      { id: "citizenship-other", label: "Other Citizenship", keywords: [] },
    ],
  },
  {
    id: "aftersales",
    code: "AS",
    label: "Aftersales",
    description: "Rental, management, tenants and owners after purchase",
    color: "bg-amber-100 text-amber-800",
    categories: [
      { id: "rental-agreement", label: "Rental / Lease Agreement", keywords: ["rental", "lease", "kira", "kira sozlesmesi", "tenancy"] },
      { id: "management-agreement", label: "Property Management Agreement", keywords: ["management agreement", "yonetim", "yönetim sözleşmesi", "property management"] },
      { id: "tenant-info", label: "Tenant Information", keywords: ["tenant", "kiraci", "kiracı"] },
      { id: "owner-info", label: "Owner Information", keywords: ["owner", "malik", "ev sahibi", "landlord"] },
      { id: "furnishing", label: "Furnishing Agreement & Inventory", keywords: ["furniture", "furnishing", "mobilya", "inventory", "demirbas", "demirbaş"] },
      { id: "utility-bills", label: "Utility Bills", keywords: ["utility", "fatura elektrik", "water bill", "electric bill", "gas bill"] },
      { id: "dues", label: "Building Dues (Aidat)", keywords: ["aidat", "dues", "site yonetimi", "maintenance fee"] },
      { id: "maintenance", label: "Maintenance & Repair Reports", keywords: ["repair", "maintenance", "tamir", "bakim", "bakım"] },
      { id: "home-insurance", label: "Home Insurance Policy", keywords: ["konut sigortasi", "home insurance", "policy", "police", "poliçe"] },
      { id: "check-in-out", label: "Check-in / Check-out Reports & Photos", keywords: ["check-in", "check in", "check-out", "checkout", "condition report"] },
      { id: "resale", label: "Resale / Exit Agreement", keywords: ["resale", "exit", "yeniden satis", "listing agreement"] },
      { id: "aftersales-other", label: "Other Aftersales", keywords: [] },
    ],
  },
  {
    id: "invoices",
    code: "IN",
    label: "Invoices & Finance",
    description: "All invoices, receipts and money-related paperwork",
    color: "bg-sky-100 text-sky-800",
    categories: [
      { id: "commission-invoice", label: "Commission Invoice", keywords: ["commission", "komisyon"] },
      { id: "service-invoice", label: "Service Invoice", keywords: ["service invoice", "hizmet faturasi", "hizmet faturası"] },
      { id: "developer-invoice", label: "Developer / Sales Invoice", keywords: ["developer invoice", "satis faturasi", "satış faturası"] },
      { id: "tapu-fees", label: "Title Deed Fees & Taxes (Tapu Harcı)", keywords: ["tapu harci", "tapu harcı", "doner sermaye", "döner sermaye", "stamp duty"] },
      { id: "payment-receipt", weak: true, label: "Payment Receipt / Dekont", keywords: ["receipt", "dekont", "makbuz", "payment proof"] },
      { id: "credit-note", label: "Refund / Credit Note", keywords: ["refund", "credit note", "iade"] },
      { id: "invoice-other", weak: true, label: "Other Invoice", keywords: ["invoice", "fatura", "e-fatura", "e-arsiv", "e-arşiv", "bill"] },
    ],
  },
  {
    id: "unsorted",
    code: "UN",
    label: "Needs Review",
    description: "The agent was not sure — please check and move",
    color: "bg-gray-200 text-gray-800",
    categories: [{ id: "unsorted", label: "Needs Review", keywords: [] }],
  },
];

export const ALL_CATEGORIES = SECTIONS.flatMap((s) =>
  s.categories.map((c) => ({ ...c, section: s.id }))
);

export function getSection(id: string): Section {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[SECTIONS.length - 1];
}

export function getCategory(id: string) {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export function sectionOfCategory(categoryId: string): SectionId {
  return (getCategory(categoryId)?.section ?? "unsorted") as SectionId;
}

// The Turkish Citizenship by Investment document list, in filing order.
// Each step is satisfied when the client has an active document in any of
// the listed categories.
export const CBI_CHECKLIST: { step: string; categories: string[] }[] = [
  { step: "Passport copies (applicant + family)", categories: ["passport"] },
  { step: "Sworn translations of foreign documents", categories: ["translation"] },
  { step: "Tax number (Vergi No)", categories: ["tax-number"] },
  { step: "Bank transfer / SWIFT proof", categories: ["bank-transfer", "payment-receipt"] },
  { step: "Foreign Exchange Certificate (DAB)", categories: ["fx-certificate"] },
  { step: "Valuation report (Ekspertiz)", categories: ["valuation"] },
  { step: "Sales contract", categories: ["sales-contract"] },
  { step: "Title deed (Tapu)", categories: ["tapu"] },
  { step: "3-year no-sale commitment (Şerh)", categories: ["no-sale-annotation"] },
  { step: "Conformity letter (Uygunluk Belgesi)", categories: ["conformity-letter"] },
  { step: "Biometric photos", categories: ["photos"] },
  { step: "Birth certificate (apostilled + translated)", categories: ["birth-certificate"] },
  { step: "Marriage certificate (if married)", categories: ["marriage-certificate"] },
  { step: "Residence permit application", categories: ["residence-permit-app", "id-card"] },
  { step: "Health insurance", categories: ["health-insurance"] },
  { step: "CBI application / petition", categories: ["cbi-application"] },
  { step: "Government fee receipts", categories: ["fees-receipts"] },
  { step: "Citizenship approval / Turkish ID", categories: ["citizenship-approval"] },
];
