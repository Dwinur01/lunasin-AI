# Task Breakdown — Lunasin AI
**Solo dev, deadline submission ~30 Juni 2026 07:00 WIB. Target selesai: 29 Juni 23:00 WIB.**

---

## Day 1 — Sabtu 27 Juni (Setup + Foundation)

**Sore/Malam (target 4-5 jam)**
- [ ] Buat AWS account (kalau belum) + IAM user dengan akses DynamoDB (`AmazonDynamoDBFullAccess` untuk hackathon, ketatkan kalau ada waktu)
- [ ] Buat tabel DynamoDB manual via AWS Console sesuai schema di SRS (`LunasinTable`, PK/SK, GSI1 jika dipakai)
- [ ] Buat project Vercel baru, catat **Vercel Team ID**
- [ ] Setup Gemini API key
- [ ] Inisialisasi project Next.js (via v0.app generate awal: "B2B invoice dashboard app")
- [ ] Set semua env vars di Vercel & local `.env.local`
- [ ] Test koneksi DynamoDB dari API route (1 endpoint dummy: list table)

**Checkpoint malam:** project bisa deploy ke Vercel walau masih kosong, koneksi DB sukses.

---

## Day 2 — Minggu 28 Juni (Core Features)

**Pagi-Siang**
- [ ] Implementasi FR1 + FR2: Create & List Invoice (UI dari v0 + API route)
- [ ] Implementasi FR5: Client management (create & list)
- [ ] Seed data dummy: 5-8 klien, 15-20 invoice dengan variasi status & due date (realistis, ada yang overdue, ada yang akan datang)

**Sore-Malam**
- [ ] Implementasi FR3: Update status invoice (mark paid)
- [ ] Implementasi FR4: Cashflow projection (hitung di API atau client-side)
- [ ] Dashboard: rangkai semua angka (outstanding, overdue, projected income)

**Checkpoint malam:** semua fitur P0 kecuali AI insight sudah jalan dengan data dummy.

---

## Day 3 — Senin 29 Juni (AI Feature + Polish + Submission)

**Pagi**
- [ ] Implementasi FR6: AI Risk Insight (Gemini API call + tampilkan di dashboard)
- [ ] Testing end-to-end: semua flow dicoba manual sekali penuh

**Siang**
- [ ] Polish UI (spacing, warna status badge, loading state)
- [ ] Ambil screenshot **Storage Configuration** (DynamoDB) untuk submission
- [ ] Buat architecture diagram (boleh pakai draw.io / excalidraw / minta dibantu Claude)

**Sore**
- [ ] Rekam video demo (≤3 menit) sesuai storyboard:
  1. Problem (15 detik)
  2. Solusi & arsitektur singkat — sebut DynamoDB & Vercel (30 detik)
  3. Live demo: tambah invoice → dashboard update → AI risk insight muncul (90 detik)
  4. Penutup: impact untuk UMKM (15 detik)
- [ ] Upload video ke YouTube (set Public, bukan Unlisted)
- [ ] Tulis text description submission (English)

**Malam (target selesai 23:00 WIB, buffer ~8 jam sebelum deadline)**
- [ ] Isi form submission Devpost lengkap (cek checklist di PRD section 10)
- [ ] Double-check: link Vercel published & bisa diakses publik tanpa login
- [ ] Submit

**Buffer pagi 30 Juni (kalau ada sisa waktu sebelum 07:00 WIB):**
- [ ] (Opsional) Publish konten blog/video proses build untuk bonus +0.6 poin, hashtag #H0Hackathon

---

## Prinsip Selama Vibe Coding
- Jangan biarkan AI nambah fitur di luar P0 — kalau AI generate sesuatu yang gak ada di scope, tolak/skip
- Setiap selesai 1 fitur, langsung deploy ke Vercel (jangan numpuk perubahan), supaya kalau ada yang error gampang dilacak
- Kalau stuck >30 menit di 1 bug non-kritikal, skip dan lanjut fitur lain — waktu lebih berharga dari kesempurnaan 1 fitur
