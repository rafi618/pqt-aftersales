# PQT Client Archive

A private, organised "Google Drive" for Property Quest Turkey's client documents.
Staff (or anyone with a share link) upload files under a client's name, and a sorting
agent files each one in the right folder with a permanent reference number.

## What it does

- **One folder per client.** Every client gets a permanent code: `PQT-0001`, `PQT-0002`, …
- **Five sections, 60+ categories:**
  - **Legal:** POA, passport, translations, apostille, tax number, …
  - **Title Deed & Property:** reservation, sales contract, tapu, takyidat, subscription numbers, buyer/seller data, DAB, valuation, iskan, DASK, …
  - **Citizenship (CBI):** conformity letter, şerh, application, photos, birth/marriage certificates, … It also has an 18-step CBI checklist that ticks itself off.
  - **Aftersales:** rental agreement, tenant and owner info, management agreement, aidat, maintenance, …
  - **Needs Review:** where the agent puts anything it isn't sure about.
- **Sorting agent.** With an Anthropic API key, Claude reads each PDF or photo, including Turkish documents, and picks the category. It also reads the title, the date and the flat number. Without a key, a keyword sorter files documents by their file names.
- **Reference numbers and printable tags.** Every document gets a code like `PQT-0001-0005` that never changes. The tag page prints stickers with the code, client, section and a QR code. They're sized for A4 sheets of 24 labels (70 × 37 mm).
- **Share links.**
  - *Upload links* let anyone send documents without an account. The link can be for one client, or for any client (the person types the client's name).
  - *Download links* let someone view and download one client's documents, one by one or as a ZIP.
  - Links can expire and can be switched off at any time.
- **Archival rules.**
  - Files are never overwritten or deleted. A wrong or old document is *retired* (hidden, still kept), or replaced by a *newer version* that keeps the history.
  - Every file gets a digital fingerprint (SHA-256), so "Verify integrity" can prove it hasn't changed.
  - Uploading the same file twice for the same client is blocked.
  - Every upload, download, move and link use goes into the **Activity Log**.
- **ZIP export.** "Download all" gives a tidy folder tree (`Client / Section / Category / file`) plus an `INDEX.tsv` list.

## Invoices & vouchers (separate section)

Invoices are kept apart from the client document folders, under **Invoices** in the menu.

- **Create an invoice:**
  - Pick a client, or type any customer.
  - Add lines, VAT and currency (USD / EUR / GBP / TRY). The total adds itself up.
  - Save as a draft, or issue it straight away.
  - The PDF carries the PQT logo, company details and tax number.
  - Invoices are numbered `PQT-INV-2026-0001`, `0002` … with no gaps.
- **Upload vouchers:** receipts, bills, bank slips, photos. Each one gets a `PQT-VCH-…` number. The AI agent (or the file name, without a key) reads the category, vendor, amount and date.
- **Create an invoice from vouchers:** tick any vouchers and they become invoice lines, with the receipts attached.
- **Upload invoices made elsewhere:** PQT's official e-Arşiv / e-Fatura PDFs, or invoices from suppliers.
- **Share:**
  - Each invoice can get a private link, where the customer views and downloads the PDF.
  - A **voucher upload link** lets drivers, partners or staff send receipts from their phone.
- **Archive rules:**
  - Once issued, an invoice cannot be edited, only marked paid / unpaid or cancelled with a reason.
  - Nothing is deleted, and every action is in the history.

Company details printed on invoices (address, tax number, bank details) are in `src/lib/invoices/config.ts`.

> Note: invoices created here are PQT's own invoices / proformas. Official Turkish e-Fatura / e-Arşiv invoices must still come from a GİB-approved system. Upload those PDFs here so everything is in one place.

## Running it on your server

Your hosting needs to run **Node.js 20 or newer**. On cPanel hosting, look for "Setup Node.js App". A VPS works too.

```bash
cp .env.example .env      # then edit .env (see below)
npm run setup             # installs everything and creates the database
npm run build
npm start                 # site runs on port 3000
```

Settings in `.env`:

| Setting | What it is |
|---|---|
| `ADMIN_PASSWORD` | Staff password. **Set this before going online.** Share links still work without it. |
| `ANTHROPIC_API_KEY` | Turns on the AI sorting agent. Get a key at console.anthropic.com. |
| `PUBLIC_BASE_URL` | Your site address, e.g. `https://docs.propertyquestturkey.com`. Used in QR codes. |
| `ARCHIVE_STORAGE_DIR` | Folder where the files are kept (default `./storage`). |

**Back up two things every day:** the `storage/` folder (the files) and `dev.db` (the index).

## Where things are in the code

- `src/lib/archive/taxonomy.ts`: sections, categories, keywords and the CBI checklist. Edit this file to add or rename categories.
- `src/lib/archive/classifier.ts`: the sorting agent.
- `src/lib/archive/service.ts`: upload, reference numbers, duplicate check, activity log.
- `src/lib/invoices/`: invoice settings, the PDF layout, and voucher reading.
- `src/app/archive/…` and `src/app/invoices/…`: staff pages. `src/app/s/…`: public share-link pages.
