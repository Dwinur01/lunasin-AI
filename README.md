# Lunasin AI — Smart Cashflow & Invoice Agent for MSMEs

**Lunasin AI** is an AI-powered financial management and credit risk analysis platform designed for Indonesian Micro, Small, and Medium Enterprises (MSMEs/UMKM). It automates invoice tracking, provides 7-day cashflow projections, and leverages generative AI to deliver early warnings on potential client payment delays.

Built for the **H0 — Hack the Zero Stack (Vercel v0 + AWS Databases)** hackathon.

---

## 🚀 Core Features (MVP)

1. **Intelligent Dashboard**: Displays critical financial metrics (Total Outstanding, Overdue Amount, and Projected Cash Inflow for the next 7 days).
2. **AI Credit Risk Analyzer**: Uses **Gemini 1.5 Flash** to evaluate historical client payment behaviors and dynamically flags clients at high or medium risk of late payment with clear, data-driven explanations.
3. **Invoice Management**: Complete CRUD operations for invoices. Create new invoices, filter by status (All, Unpaid, Overdue, Paid), and mark them as paid.
4. **Client CRM & Payment Ledger**: Displays client profiles, cumulative transactions, on-time payment rates, and comprehensive payment history logs.
5. **Seamless Local Fallback**: Automatically falls back to local JSON-based analytical credit scoring if AWS credentials are not configured, ensuring zero-config local testing.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 16 (App Router) + Tailwind CSS 4
* **Backend**: Next.js API Routes (Serverless Functions)
* **Database**: AWS DynamoDB (Single-Table Design) / Local JSON Fallback
* **AI Engine**: Google Gemini 1.5 Flash (via Google AI Studio REST API)
* **Hosting**: Vercel

---

## 📐 DynamoDB Single-Table Schema

All application entities are stored in a single table (`LunasinTable`) using the following keys:

| Entity | Partition Key (PK) | Sort Key (SK) | Key Attributes |
|---|---|---|---|
| **Client** | `TENANT#<tenantId>` | `CLIENT#<clientId>` | `name`, `contactInfo` |
| **Invoice** | `TENANT#<tenantId>` | `INVOICE#<invoiceId>` | `clientId`, `amount`, `status`, `issueDate`, `dueDate`, `notes` |
| **Payment History** | `CLIENT#<clientId>` | `PAYMENT#<paymentId>` | `invoiceId`, `paidDate`, `wasLate` (bool), `daysLate` |

### Global Secondary Indexes (GSI)
* **GSI1**: Used for querying invoices by due date range.
  * `GSI1PK`: `TENANT#<tenantId>`
  * `GSI1SK`: `DUEDATE#<YYYY-MM-DD>#INVOICE#<invoiceId>`

---

## 💻 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Dwinur01/lunasin-AI.git
cd lunasin-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following variables:

```env
# AWS DynamoDB Configuration (Optional - Falls back to local JSON if left empty)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_NAME=LunasinTable

# Gemini API Configuration (Required for AI insights)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

*Note: If you do not provide AWS credentials, the application will automatically read and write data to the local file `src/lib/local_db.json`. The app comes pre-seeded out of the box!*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Seeding Data
If you are connected to AWS DynamoDB and want to populate your table with realistic test data, click the **"Seed Dummy Data"** button on the dashboard or visit:
`http://localhost:3000/api/seed`
