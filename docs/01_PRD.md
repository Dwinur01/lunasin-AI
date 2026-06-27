# PRD — Lunasin AI
**AI Cashflow & Invoice Agent untuk UMKM Indonesia**
Hackathon: H0 — Hack the Zero Stack (Vercel v0 + AWS Databases) | Track: B2B App

---

## 1. Overview
Lunasin AI adalah aplikasi B2B yang membantu UMKM mengelola invoice dan memproyeksikan cashflow, dengan AI agent yang memberi peringatan dini klien yang berisiko nunggak bayar.

## 2. Problem Statement
UMKM Indonesia sering kehilangan kendali cashflow karena:
- Invoice dicatat manual (Excel/WA), gak ada visibilitas kapan kas akan masuk
- Tidak ada sistem yang menandai klien berisiko terlambat bayar sebelum jadi masalah
- Owner baru tahu "kas seret" setelah kejadian, bukan sebelum

## 3. Goals
- Memberi owner UMKM visibilitas real-time atas piutang & proyeksi kas masuk
- Memberi early-warning berbasis AI terhadap klien berisiko nunggak
- Menjadi demo yang solid untuk kriteria judging: Technical Implementation, Design, Impact, Originality

## 4. Target User
Owner/admin UMKM jasa atau B2B kecil-menengah (1-20 karyawan) yang menerbitkan invoice ke beberapa klien rutin (agency, supplier, kontraktor, konsultan, dll).

## 5. Hackathon Constraints (wajib dipatuhi)
- Backend **harus** pakai DynamoDB (dipilih karena single-table design cocok untuk access pattern invoice/klien yang simpel & cepat dibangun)
- Frontend **harus** deploy di Vercel/v0.app
- Submission materials (deskripsi, video) **harus Bahasa Inggris**
- Deadline: 29 Juni 2026 17:00 PDT (~30 Juni 07:00 WIB) — target internal selesai **29 Juni 23:00 WIB** untuk buffer

## 6. MVP Scope (P0 — wajib jalan saat demo)
1. Tambah & lihat invoice (klien, nominal, tanggal jatuh tempo, status)
2. Dashboard: total outstanding, overdue, proyeksi kas masuk 7 hari ke depan
3. AI Risk Insight: AI agent (Gemini API) menandai klien berisiko nunggak + alasan singkat
4. Tandai invoice sebagai "paid"
5. List klien dengan ringkasan histori pembayaran

## 7. Out of Scope (P1 — jangan dikerjakan dulu)
- Login/auth multi-user (cukup single-tenant hardcoded untuk demo)
- Payment gateway sungguhan
- Email/WA reminder otomatis (boleh disebut sebagai "roadmap" di video)
- Multi-currency, multi-bahasa UI
- Export PDF/laporan

## 8. Success Metrics (untuk demo, bukan produksi)
- App jalan stabil end-to-end di Vercel
- DynamoDB terintegrasi nyata (terlihat di screenshot Storage Configuration)
- AI insight memberi output yang masuk akal dari data dummy
- Video demo ≤3 menit menjelaskan database & arsitektur dengan jelas

## 9. Fitur Utama (ringkas)
| Fitur | Deskripsi |
|---|---|
| Dashboard | Ringkasan kondisi cashflow & AI risk banner |
| Invoice Management | CRUD dasar invoice |
| Client Management | List klien + histori pembayaran |
| AI Risk Insight | Analisis Gemini atas pola pembayaran klien |
| Cashflow Projection | Hitung proyeksi kas masuk dari invoice belum lunas |

## 10. Submission Checklist (Devpost)
- [ ] Text description (English)
- [ ] Demo video ≤3 menit (English/subtitle), jelaskan DynamoDB usage
- [ ] Architecture diagram
- [ ] Link Vercel project (published)
- [ ] Screenshot Storage Configuration (bukti DynamoDB)
- [ ] Vercel Team ID
- [ ] (Opsional) Konten blog/video proses build untuk bonus 0.6 poin, hashtag #H0Hackathon
