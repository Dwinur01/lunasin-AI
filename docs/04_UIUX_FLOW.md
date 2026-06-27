# UI/UX Flow — Lunasin AI
Termasuk template prompt v0 siap pakai untuk tiap screen.

---

## 1. User Flow (urutan layar)

```
[Dashboard] ──(+ New Invoice)──▶ [Form Tambah Invoice] ──(save)──▶ [Dashboard, updated]
     │
     ├──(klik "Invoices")──▶ [List Invoice] ──(klik invoice)──▶ [Detail/Mark Paid]
     │
     ├──(klik "Clients")──▶ [List Client] ──(klik klien)──▶ [Detail Klien + Risk Insight]
     │
     └──(AI Risk Banner muncul otomatis di Dashboard)
```

Tidak ada auth flow untuk MVP — user langsung masuk ke Dashboard sebagai single-tenant.

---

## 2. Detail per Screen

### Screen 1: Dashboard (halaman utama)
**Komponen:**
- 3 summary card: "Total Outstanding", "Overdue", "Projected Cash In (7 days)"
- AI Risk Banner (highlight warna kuning/merah): "2 klien berisiko nunggak: [nama] — [alasan singkat]"
- Tombol utama "+ New Invoice"
- List ringkas 5 invoice terbaru

**v0 Prompt Template:**
> Build a B2B finance dashboard page in Next.js with Tailwind. Top section: 3 summary stat cards (Total Outstanding, Overdue Amount, Projected Cash In - 7 days), each with a large number and small label. Below: an alert banner component for AI risk warnings (list of client names with short reasons, yellow/red styling based on risk level). Below that: a table showing 5 most recent invoices (client name, amount, due date, status badge). Top right: a primary button "+ New Invoice". Clean, professional fintech style, not generic.

---

### Screen 2: List Invoice
**Komponen:**
- Tab filter: All / Unpaid / Overdue / Paid
- Tabel: Client, Amount, Due Date, Status (badge warna), Action (Mark Paid)
- Tombol "+ New Invoice"

**v0 Prompt Template:**
> Build an invoice list page with filter tabs (All, Unpaid, Overdue, Paid) above a data table. Table columns: Client Name, Amount (formatted as Rupiah), Due Date, Status (colored badge: green=Paid, red=Overdue, gray=Unpaid), and an action button "Mark as Paid" per row. Include a "+ New Invoice" button at top right that opens a modal form.

---

### Screen 3: Form Tambah/Edit Invoice (modal)
**Field:** Client (dropdown + opsi "add new client"), Amount, Issue Date, Due Date, Notes (optional)

**v0 Prompt Template:**
> Build a modal form for creating an invoice with fields: Client (searchable dropdown with an "add new client" inline option), Amount (number input with Rupiah prefix), Issue Date (date picker), Due Date (date picker), Notes (textarea, optional). Submit and Cancel buttons.

---

### Screen 4: List & Detail Klien
**List:** Nama klien, Total Invoiced, % Tepat Waktu
**Detail:** info klien + tabel histori pembayaran + AI risk reason (kalau ada)

**v0 Prompt Template:**
> Build a client list page: table with Client Name, Total Invoiced (sum), On-Time Payment Rate (%). Clicking a row opens a detail view showing client info, a payment history table (Invoice ID, Paid Date, Was Late, Days Late), and an AI risk insight card explaining the client's risk level if applicable.

---

## 3. Catatan untuk Vibe Coding
- Generate screen **satu per satu**, jangan minta v0 generate semua sekaligus — hasilnya lebih konsisten dan gampang di-debug
- Setelah generate, langsung sambungkan ke API route asli (jangan biarkan AI bikin data dummy hardcoded di komponen — ganti dengan `fetch` ke endpoint dari SRS)
- Kalau hasil v0 kebanyakan fitur yang gak diminta, jangan ragu re-prompt: "remove X, keep it minimal, focus only on Y"
