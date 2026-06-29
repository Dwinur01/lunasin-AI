# 🛡️ Lunasin AI — Asisten Keuangan & Manajemen Risiko Piutang Pintar untuk UMKM

**Lunasin AI** adalah platform SaaS pengelolaan keuangan, pencatatan pengeluaran, dan analisis risiko kredit piutang berbasis Kecerdasan Buatan (AI) yang dirancang khusus untuk Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia. 

Aplikasi ini tidak hanya mencatat invoice, tetapi juga memproyeksikan arus kas 7 hari ke depan, mensimulasikan skenario keuangan (*What-If Sandbox*), memverifikasi bukti transfer secara otomatis menggunakan AI Vision, hingga mencetak laporan keuangan formal ber-Kop Surat langsung ke format Microsoft Word.

Proyek ini dibangun untuk kompetisi **H0 — Hack the Zero Stack (Vercel v0 + AWS Databases)**.

---

## 🚀 13 Fitur Unggulan (Ultimate Features)

Lunasin AI dilengkapi dengan rangkaian fitur lengkap yang dirancang untuk menjaga kesehatan kas usaha Anda:

1.  **🌐 Landing Page Premium**: Halaman depan bertema gelap (*dark mode*) yang memukau dengan neon glows, daftar fitur interaktif, simulasi visual AI, FAQ, dan pricing.
2.  **🤖 Analisis Risiko Kredit Gemini AI**: Menganalisis riwayat transaksi klien secara cerdas untuk memprediksi risiko keterlambatan bayar (Tinggi, Sedang, Rendah) disertai analisis bahasa alami dari **Gemini 1.5 Flash**.
3.  **🎛️ Cashflow Scenario Simulator (What-If Sandbox)**: Slider interaktif di Dashboard untuk mensimulasikan dampak keterlambatan bayar klien (0-7 hari) dan biaya tak terduga (Rp 0 - Rp 30jt) terhadap arus kas secara real-time pada grafik *dual-bar*.
4.  **⚡ AI Quick Invoice (Natural Language Parsing)**: Membuat invoice instan cukup dengan mengetik satu kalimat bebas (contoh: *"Tolong tagih Toko Berkah 15 juta tempo 2 minggu lagi"*). AI akan otomatis mengekstrak nama klien, nominal, dan tanggal jatuh tempo.
5.  **📸 AI Verifikasi Bukti Transfer (Vision OCR)**: Unggah foto bukti transfer bank. Gemini Vision OCR akan membaca nominal transfer, nama pengirim, bank pengirim, lalu otomatis mencocokkannya dengan invoice belum lunas yang sesuai di database untuk pelunasan 1-klik.
6.  **📧 AI Email Billing Draft Generator**: Menyusun draf email penagihan resmi dalam Bahasa Indonesia yang disesuaikan dengan tingkat risiko klien (sopan untuk pengingat awal, tegas untuk tagihan yang telah terlambat).
7.  **📄 Cetak Laporan Keuangan Word (Kop Surat Resmi)**: Mengekspor Laporan Laba Rugi (Profit & Loss) bulanan lengkap dengan Kop Surat resmi **PT Mitra Abadi Jaya**, tabel perhitungan pendapatan/biaya, dan kolom tanda tangan langsung ke berkas Microsoft Word (`.doc`) sekali klik.
8.  **📈 Laporan Umur Piutang (Invoice Aging Report)**: Diagram batang bertumpuk (*stacked progress bar*) berwarna dinamis untuk mengelompokkan piutang aktif berdasarkan umur (0-30 hari, 31-60 hari, 61-90 hari, dan >90 hari).
9.  **💸 Pencatat Pengeluaran (Expense Tracker) & Laba Bersih**: Halaman khusus untuk mencatat pengeluaran operasional usaha (Gaji, Sewa, IT, Pemasaran) untuk menghitung Laba Bersih riil secara otomatis pada Dashboard.
10. **📊 Analisis Kinerja Klien (Client Analytics)**: Grid metrik 2x2 pada profil klien yang menampilkan akumulasi transaksi, tingkat ketepatan waktu (*on-time rate*), jumlah pelunasan, dan rata-rata keterlambatan hari.
11. **⭕ Credit Score Meter Klien**: Cincin progres lingkaran (*Circular Progress Ring*) interaktif yang menunjukkan skor kredit klien secara visual dengan warna dinamis (Hijau = Aman, Kuning = Siaga, Merah = Bahaya).
12. **💬 Pengingat Pembayaran WhatsApp**: Tombol instan untuk membuka chat WhatsApp dengan draf pesan penagihan yang sopan dan terformat rapi sesuai detail invoice terkait.
13. **🖨️ Cetak PDF Invoice Instan**: Template invoice profesional ramah printer dengan tombol cetak otomatis (`window.print()`) yang menyembunyikan tombol navigasi secara cerdas saat dicetak (`print:hidden`).

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Vite + React Router DOM
*   **Backend**: Node.js + Express.js (TypeScript via `tsx` compiler)
*   **Database**: AWS DynamoDB (Single-Table Design) / Database JSON Lokal (Sistem Fallback Otomatis)
*   **AI Engine**: Google Gemini 1.5 Flash (Generative Text & Multimodal Vision via REST API)

---

## 📐 Desain Single-Table DynamoDB

Seluruh data aplikasi disimpan dalam satu tabel tunggal (`LunasinTable`) untuk efisiensi performa dan biaya query:

| Entitas | Partition Key (PK) | Sort Key (SK) | Atribut Utama |
|---|---|---|---|
| **Klien** | `TENANT#<tenantId>` | `CLIENT#<clientId>` | `name`, `contactInfo`, `totalInvoiced`, `onTimePaidCount` |
| **Invoice** | `TENANT#<tenantId>` | `INVOICE#<invoiceId>` | `clientId`, `clientName`, `amount`, `status` (`PAID`/`UNPAID`/`OVERDUE`), `issueDate`, `dueDate`, `paidDate` |
| **Pengeluaran** | `TENANT#<tenantId>` | `EXPENSE#<expenseId>` | `amount`, `category`, `description`, `date` |
| **Riwayat Pembayaran** | `CLIENT#<clientId>` | `PAYMENT#<paymentId>` | `invoiceId`, `paidDate`, `wasLate` (boolean), `daysLate` |

### Global Secondary Index (GSI)
*   **GSI1**: Digunakan untuk query pencarian invoice berdasarkan rentang tanggal jatuh tempo secara cepat.
    *   `GSI1PK`: `TENANT#<tenantId>`
    *   `GSI1SK`: `DUEDATE#<YYYY-MM-DD>#INVOICE#<invoiceId>`

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/Dwinur01/lunasin-AI.git
cd lunasin-AI
```

### 2. Instal Dependensi
Jalankan perintah ini di direktori utama proyek (root monorepo) untuk menginstal semua dependensi backend dan frontend sekaligus:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di direktori utama proyek (root), lalu isi dengan format berikut:

```env
# Konfigurasi AWS DynamoDB (Opsional - Otomatis beralih ke database JSON lokal jika dikosongkan)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-southeast-1
DYNAMODB_TABLE_NAME=LunasinTable

# Konfigurasi Gemini API (Diperlukan untuk seluruh fitur AI)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

> [!NOTE]
> Jika Anda tidak memasukkan kredensial AWS, sistem backend Lunasin AI akan mendeteksi hal ini secara otomatis dan beralih ke **mode Fallback Lokal** menggunakan berkas database JSON aman di `backend/src/lib/local_db.json`. Pengujian fitur tetap berjalan normal!

### 4. Jalankan Aplikasi
Jalankan perintah berikut untuk menjalankan server backend (port `5000`) dan server frontend Vite (port `5173`) secara paralel dalam satu perintah:
```bash
npm run dev
```
Buka alamat **[http://localhost:5173](http://localhost:5173)** pada browser Anda untuk mengakses aplikasi.

---

## 🧪 Mengisi Data Percobaan (Seeding)
Jika Anda terhubung ke AWS DynamoDB dan ingin mengisi tabel Anda dengan data simulasi transaksi secara instan untuk kebutuhan demo/presentasi, silakan kunjungi endpoint berikut pada browser Anda:
`http://localhost:5000/api/seed`

Atau klik tombol **"Seed Dummy Data"** di bagian atas Dashboard aplikasi.
