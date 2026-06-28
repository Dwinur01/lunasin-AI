# Lunasin AI — Asisten Keuangan & Invoice Pintar untuk UMKM

**Lunasin AI** adalah platform pengelolaan keuangan dan analisis risiko kredit berbasis AI yang dirancang khusus untuk Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia. Aplikasi ini mengotomatiskan pelacakan invoice, memproyeksikan arus kas (cashflow) 7 hari ke depan, dan memanfaatkan kecerdasan buatan (AI) untuk memberikan peringatan dini terhadap risiko keterlambatan pembayaran klien.

Proyek ini dibangun untuk kompetisi **H0 — Hack the Zero Stack (Vercel v0 + AWS Databases)**.

---

## 🚀 Fitur Utama (MVP)

1. **Dashboard Arus Kas**: Menampilkan metrik keuangan penting secara real-time (Total Piutang Aktif, Nominal Jatuh Tempo, dan Proyeksi Kas Masuk dalam 7 hari ke depan).
2. **Analisis Risiko Kredit (AI)**: Menggunakan **Gemini 1.5 Flash** untuk menganalisis riwayat pembayaran klien dan memberikan label tingkat risiko secara dinamis disertai alasan analisis berbasis data.
3. **Manajemen Invoice**: Pencatatan invoice dengan filter status lengkap (Semua, Belum Lunas, Jatuh Tempo, Lunas) serta fitur pelunasan invoice dalam satu klik.
4. **Profil & Riwayat Klien**: Menyediakan detail data klien, akumulasi transaksi, persentase ketepatan waktu pembayaran, dan log riwayat transaksi pembayaran.
5. **Sistem Fallback Lokal**: Otomatis beralih ke database lokal berbasis JSON jika kredensial AWS tidak diatur, memudahkan pengujian tanpa konfigurasi rumit.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend**: Next.js 16 (App Router) + Tailwind CSS 4
* **Backend**: Next.js API Routes (Serverless Functions)
* **Database**: AWS DynamoDB (Single-Table Design) / Database JSON Lokal
* **AI Engine**: Google Gemini 1.5 Flash (via Google AI Studio REST API)
* **Hosting**: Vercel

---

## 📐 Desain Single-Table DynamoDB

Seluruh data aplikasi disimpan dalam satu tabel tunggal (`LunasinTable`) menggunakan struktur kunci berikut:

| Entitas | Partition Key (PK) | Sort Key (SK) | Atribut Utama |
|---|---|---|---|
| **Klien** | `TENANT#<tenantId>` | `CLIENT#<clientId>` | `name`, `contactInfo` |
| **Invoice** | `TENANT#<tenantId>` | `INVOICE#<invoiceId>` | `clientId`, `amount`, `status`, `issueDate`, `dueDate`, `notes` |
| **Riwayat Pembayaran** | `CLIENT#<clientId>` | `PAYMENT#<paymentId>` | `invoiceId`, `paidDate`, `wasLate` (bool), `daysLate` |

### Global Secondary Index (GSI)
* **GSI1**: Digunakan untuk query pencarian invoice berdasarkan rentang tanggal jatuh tempo.
  * `GSI1PK`: `TENANT#<tenantId>`
  * `GSI1SK`: `DUEDATE#<YYYY-MM-DD>#INVOICE#<invoiceId>`

---

## 💻 Panduan Instalasi Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/Dwinur01/lunasin-AI.git
cd lunasin-AI
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di direktori utama proyek, lalu isi dengan format berikut:

```env
# Konfigurasi AWS DynamoDB (Opsional - Otomatis beralih ke JSON lokal jika dikosongkan)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_NAME=LunasinTable

# Konfigurasi Gemini API (Diperlukan untuk analisis AI)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

*Catatan: Jika Anda tidak memasukkan kredensial AWS, aplikasi akan otomatis membaca dan menyimpan data pada file lokal `src/lib/local_db.json` yang sudah terisi data bawaan.*

### 4. Jalankan Aplikasi
```bash
npm run dev
```
Buka alamat [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🧪 Mengisi Data Percobaan (Seeding)
Jika Anda terhubung ke AWS DynamoDB dan ingin mengisi tabel Anda dengan data simulasi transaksi secara instan, klik tombol **"Seed Dummy Data"** di dashboard atau kunjungi:
`http://localhost:3000/api/seed`
