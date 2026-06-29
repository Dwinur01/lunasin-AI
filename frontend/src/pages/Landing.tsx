import { Link } from "react-router-dom";
import { useState } from "react";

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      title: "Analisis Risiko Kredit Gemini AI",
      desc: "Menggunakan kecerdasan buatan Google Gemini 1.5 Flash untuk memprediksi ketepatan waktu pembayaran klien secara dinamis berdasarkan data transaksi.",
      icon: "🤖",
      badge: "Gemini 1.5 Flash",
      color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30"
    },
    {
      title: "Proyeksi & Simulasi Kas (What-If)",
      desc: "Simulasikan penundaan bayar klien dan biaya tak terduga dengan slider interaktif. Grafik dual-bar diperbarui secara real-time.",
      icon: "🎛️",
      badge: "Sandbox",
      color: "from-indigo-500/20 to-sky-500/20 border-indigo-500/30"
    },
    {
      title: "AI Quick Invoice ⚡",
      desc: "Buat invoice instan hanya dengan menulis satu kalimat bebas. AI akan otomatis mengisi data klien, nominal, dan jatuh tempo secara instan.",
      icon: "⚡",
      badge: "Generative AI",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30"
    },
    {
      title: "AI Verifikasi Bukti Transfer (Vision)",
      desc: "Unggah foto bukti transfer. Gemini Vision OCR akan membaca nominal, nama pengirim, bank secara instan dan mencocokkannya dengan invoice.",
      icon: "📸",
      badge: "Gemini Vision",
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30"
    },
    {
      title: "AI Email Billing Draft Generator",
      desc: "Minta Gemini menyusun draf email penagihan resmi dalam Bahasa Indonesia yang disesuaikan dengan status risiko klien (sopan atau tegas).",
      icon: "📧",
      badge: "Gemini 1.5 Flash",
      color: "from-sky-500/20 to-blue-500/20 border-sky-500/30"
    },
    {
      title: "Expense Tracker & Laba Bersih",
      desc: "Catat pengeluaran operasional usaha Anda dan pantau laba bersih (Net Profit) riil secara otomatis di Dashboard.",
      icon: "💸",
      badge: "Accounting",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
    },
    {
      title: "Cetak Laporan Word (Kop Surat)",
      desc: "Ekspor laporan keuangan bulanan lengkap dengan Kop Surat resmi PT Mitra Abadi Jaya ke dalam format Microsoft Word (.doc) sekali klik.",
      icon: "📄",
      badge: "Official Document",
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30"
    },
    {
      title: "Pengingat Pembayaran WhatsApp & PDF",
      desc: "Hubungi klien via WhatsApp otomatis dengan pesan terformat, serta cetak invoice ramah printer dengan format cetak profesional.",
      icon: "💬",
      badge: "1-Click PDF",
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30"
    }
  ];

  const faqs = [
    {
      q: "Bagaimana cara kerja AI dalam menganalisis risiko kredit?",
      a: "AI Lunasin menganalisis riwayat ketepatan waktu pembayaran sebelumnya, jumlah tagihan aktif, serta status jatuh tempo klien, kemudian memberikan rekomendasi tingkat risiko (Tinggi, Sedang, Rendah) beserta alasan analitisnya."
    },
    {
      q: "Apakah saya harus selalu terhubung ke AWS DynamoDB?",
      a: "Tidak. Lunasin AI dilengkapi dengan sistem fallback lokal berbasis JSON. Jika Anda tidak mengatur kredensial AWS, aplikasi akan otomatis menyimpan data pada database lokal yang aman."
    },
    {
      q: "Apakah data transaksi keuangan saya aman?",
      a: "Sangat aman. Jika menggunakan mode AWS, seluruh data disimpan langsung di akun DynamoDB pribadi Anda. Jika menggunakan mode lokal, data tetap berada di komputer lokal Anda."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Lunasin AI
            </span>
            <span className="bg-indigo-500/10 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">
              v1.0
            </span>
          </div>
          <div>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-500/20 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Masuk ke Aplikasi
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Background Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800/80 rounded-full px-4 py-1.5 hover:border-slate-700 transition-all duration-300">
            <span className="text-xs font-semibold text-indigo-300">🚀 Built for H0 Hackathon</span>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl mx-auto">
            Kelola Keuangan & Analisis Risiko Kredit Klien dengan{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Kecerdasan AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Asisten Keuangan pintar khusus UMKM Indonesia. Otomatiskan pelacakan invoice, proyeksikan kas masuk 7 hari ke depan, dan deteksi risiko keterlambatan bayar klien sebelum terjadi.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-650 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-center"
            >
              Mulai Demo Sekarang
            </Link>
            <a
              href="#fitur"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl border border-slate-850 hover:border-slate-750 transition-all hover:scale-[1.03] active:scale-[0.97] text-center"
            >
              Pelajari Fitur
            </a>
          </div>

          {/* Dashboard Mockup Preview */}
          <div className="pt-12 sm:pt-16 max-w-5xl mx-auto animate-zoom-in">
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-60" />
              {/* Glassmorphic overlay on hover */}
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden aspect-[16/9] flex flex-col justify-between p-6 relative">
                {/* Header Mockup */}
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-4">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs text-slate-500 font-mono pl-4">lunasin-ai.app/dashboard</span>
                  </div>
                  <div className="h-5 w-20 bg-indigo-500/10 border border-indigo-500/20 rounded-md" />
                </div>
                {/* Main Content Mockup */}
                <div className="grid grid-cols-3 gap-4 my-auto">
                  <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-lg text-left space-y-2">
                    <span className="text-[10px] text-indigo-400 uppercase font-bold">Total Outstanding</span>
                    <div className="h-6 w-3/4 bg-slate-800 rounded animate-pulse" />
                  </div>
                  <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-lg text-left space-y-2">
                    <span className="text-[10px] text-rose-400 uppercase font-bold">Total Overdue</span>
                    <div className="h-6 w-1/2 bg-slate-800 rounded" />
                  </div>
                  <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-lg text-left space-y-2">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold">Projected Income</span>
                    <div className="h-6 w-2/3 bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
                {/* Bottom Mockup */}
                <div className="border-t border-slate-800/60 pt-4 text-left text-xs text-slate-500 flex justify-between">
                  <span>✨ AI Kredit Analisis: CV Abadi Jaya dinilai AMAN.</span>
                  <span>Database: AWS DynamoDB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="fitur" className="py-20 bg-slate-950/40 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Didesain Khusus untuk Efisiensi UMKM
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Fitur inovatif berbasis AI untuk merampingkan pencatatan invoice dan mengurangi risiko kredit piutang usaha.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                onClick={() => setActiveFeature(idx)}
                className={`cursor-pointer p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 relative overflow-hidden group ${
                  activeFeature === idx
                    ? `${feat.color} shadow-[0_4px_25px_rgba(99,102,241,0.06)] scale-[1.01]`
                    : "from-slate-900/40 to-slate-900/10 border-slate-900 hover:border-slate-800 hover:scale-[1.005]"
                }`}
              >
                <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-bl-3xl flex items-center justify-center text-2xl">
                  {feat.icon}
                </div>
                <div className="space-y-3 pr-10">
                  <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    activeFeature === idx ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {feat.badge}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive AI Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900/60 to-indigo-950/20 border border-indigo-900/20 rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-40 w-40 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 bg-purple-500/5 rounded-full blur-2xl" />

            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Preview Fitur Baru</span>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Bagaimana AI Mendeteksi Klien yang Bermasalah?
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Di dalam dashboard Lunasin AI, AI Agent kami (Gemini 1.5 Flash) secara aktif memindai data histori pembayaran klien di masa lampau, rata-rata keterlambatan hari, serta jumlah tagihan jatuh tempo yang belum diselesaikan.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <span className="text-indigo-400">✔</span>
                  <span>Mendeteksi tren keterlambatan pembayaran musiman.</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <span className="text-indigo-400">✔</span>
                  <span>Menghitung secara cerdas tingkat risiko Kredit (Tinggi, Sedang, Rendah).</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <span className="text-indigo-400">✔</span>
                  <span>Memberikan rekomendasi tindakan preventif dalam bahasa alami.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-950/85 border border-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-slate-400 font-mono">AI CREDIT RISK ANALYSYS</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">PROSES SELESAI</span>
              </div>

              {/* Mock AI Output Card */}
              <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">PT Maju Bersama</span>
                  <span className="px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    High Risk Warning
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  • AI Analysis: Klien dinilai **berisiko tinggi** karena memiliki 1 invoice overdue senilai Rp 35.000.000 yang belum dilunasi selama 14 hari, ditambah riwayat 2 transaksi terakhir yang rata-rata terlambat 13 hari.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">CV Abadi Jaya</span>
                  <span className="px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Low Risk / Safe
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  • AI Analysis: Klien dinilai **sangat aman**. Seluruh invoice sebelumnya selalu dibayar tepat waktu (rata-rata 1 hari sebelum jatuh tempo).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-950/20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-slate-400">
              Beberapa info teknis mengenai integrasi dan cara kerja aplikasi Lunasin AI.
            </p>
          </div>

          <div className="space-y-6 text-left">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-2">
                <h4 className="font-bold text-white text-base">
                  💡 {faq.q}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
            Siap untuk Mengamankan Cashflow Bisnis Anda?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Mulai sekarang secara gratis menggunakan database lokal atau AWS DynamoDB pribadi Anda. Integrasi Gemini AI siap membantu dalam hitungan detik.
          </p>
          <div>
            <Link
              to="/dashboard"
              className="inline-block px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-650 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              Mulai Demo Sekarang (Gratis)
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <div>
            Lunasin AI © {new Date().getFullYear()} — Built for H0 Hackathon (Vercel v0 + AWS Databases)
          </div>
          <div className="text-slate-600 font-mono">
            Powered by Google Gemini 1.5 Flash & AWS DynamoDB
          </div>
        </div>
      </footer>
    </div>
  );
}
