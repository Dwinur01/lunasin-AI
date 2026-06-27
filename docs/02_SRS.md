# SRS — Lunasin AI
**Software Requirements Specification**

---

## 1. Tech Stack
- **Frontend:** Next.js (App Router) — generate & deploy via v0.app / Vercel
- **Backend:** Next.js API Routes (serverless functions di Vercel)
- **Database:** AWS DynamoDB (single-table design)
- **AI:** Gemini API (risk insight generation)
- **Styling:** Tailwind CSS (default v0 output)

## 2. Functional Requirements

**FR1 — Create Invoice**
Input: `clientId` (atau nama klien baru), `amount`, `issueDate`, `dueDate`, `notes`
Output: invoice tersimpan dengan status `UNPAID`
Acceptance: invoice baru langsung muncul di list & dashboard ter-update

**FR2 — List & Filter Invoices**
Filter by status: `ALL | UNPAID | OVERDUE | PAID`
Acceptance: filter mengubah hasil list tanpa reload penuh

**FR3 — Update Invoice Status**
Action: tandai invoice `PAID`
Acceptance: status berubah, dashboard & client history ikut update

**FR4 — Cashflow Projection**
Hitung total nominal invoice `UNPAID` dengan `dueDate` dalam 7 hari ke depan
Acceptance: angka di dashboard sesuai data invoice aktif

**FR5 — Client Management**
CRUD dasar client: `name`, `contactInfo`
Tampilkan: total invoiced, % tepat waktu (dihitung dari invoice `PAID` vs yang pernah `OVERDUE`)

**FR6 — AI Risk Insight**
Input ke Gemini: ringkasan data klien (jumlah invoice overdue historis, rata-rata keterlambatan)
Output: daftar klien berisiko + alasan singkat (1-2 kalimat per klien)
Acceptance: insight berubah sesuai data, bukan teks statis

## 3. Data Model — DynamoDB (Single Table: `LunasinTable`)

**Access Patterns (didefinisikan dulu sebelum schema):**
1. Ambil semua invoice milik 1 tenant
2. Ambil semua invoice dengan due date dalam range tertentu
3. Ambil semua klien milik 1 tenant
4. Ambil histori pembayaran 1 klien

**Schema:**
| Entity | PK | SK | Attributes |
|---|---|---|---|
| Invoice | `TENANT#<tenantId>` | `INVOICE#<invoiceId>` | amount, status, dueDate, issueDate, clientId, notes |
| Client | `TENANT#<tenantId>` | `CLIENT#<clientId>` | name, contactInfo |
| Payment History | `CLIENT#<clientId>` | `PAYMENT#<paymentId>` | invoiceId, paidDate, wasLate (bool), daysLate |

**GSI1** (untuk query by due date — access pattern #2):
- GSI1PK: `TENANT#<tenantId>`
- GSI1SK: `DUEDATE#<YYYY-MM-DD>#INVOICE#<invoiceId>`

> Catatan: untuk MVP, boleh juga skip GSI dan filter due date di application layer kalau dataset dummy kecil (<100 item) — lebih cepat dibangun, masih defensible di video sebagai "trade-off engineering untuk timeline hackathon".

## 4. API Contract

```
POST   /api/invoices          → create invoice
GET    /api/invoices?status=  → list invoices (optional filter)
PATCH  /api/invoices/:id      → update status (mark paid)

GET    /api/clients           → list clients + payment stats
POST   /api/clients           → create client

GET    /api/cashflow/projection?days=7   → { projectedIncome: number }

POST   /api/ai/risk-insight   → body: {} (pakai tenant default)
                                 response: { riskyClients: [{clientId, name, reason}] }
```

## 5. AI Prompt Template (untuk FR6 — Gemini API)

```
System: Kamu adalah analis kredit untuk UMKM. Berdasarkan data histori pembayaran
klien berikut, identifikasi klien yang berisiko terlambat bayar invoice
berikutnya. Jawab singkat, maksimal 2 kalimat per klien, sertakan alasan
berbasis data (jangan mengada-ada).

Data klien (JSON):
{{client_payment_history}}

Format output (JSON only):
[{"clientId": "...", "name": "...", "riskLevel": "high|medium|low", "reason": "..."}]
```

## 6. Non-Functional Requirements
- Aplikasi harus bisa diakses publik tanpa login (sesuai scope MVP)
- Response API < 2 detik untuk operasi CRUD biasa
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `DYNAMODB_TABLE_NAME`, `GEMINI_API_KEY`
- Deployment harus published (bukan preview-only) di Vercel sebelum submission

## 7. External Integrations
| Service | Fungsi |
|---|---|
| AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) | Operasi CRUD ke DynamoDB |
| Gemini API | Generate risk insight (FR6) |
| Vercel | Hosting & deployment frontend + API routes |
