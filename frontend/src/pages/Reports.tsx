import { useEffect, useState } from "react";

interface Invoice {
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
}

interface Expense {
  expenseId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Client {
  clientId: string;
  name: string;
  totalInvoiced: number;
}

export default function Reports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreviewTab, setActivePreviewTab] = useState<"invoices" | "expenses">("invoices");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Invoices
        const invRes = await fetch("/api/invoices?status=ALL");
        const invData = await invRes.json();
        if (Array.isArray(invData)) setInvoices(invData);

        // Fetch Expenses
        const expRes = await fetch("/api/expenses");
        const expData = await expRes.json();
        if (Array.isArray(expData)) setExpenses(expData);

        // Fetch Clients
        const clientRes = await fetch("/api/clients");
        const clientData = await clientRes.json();
        if (Array.isArray(clientData)) {
          const mapped = clientData.map((c: any) => ({
            clientId: c.SK.split("#")[1],
            name: c.name,
            totalInvoiced: c.totalInvoiced || 0,
          }));
          setClients(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculations
  const revenuePaid = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
  const revenueOutstanding = invoices.filter((i) => i.status !== "PAID").reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = revenuePaid + revenueOutstanding;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = revenuePaid - totalExpenses;
  const netProfitMargin = revenuePaid > 0 ? Math.round((netProfit / revenuePaid) * 100) : 0;

  // Expense by categories
  const expenseCategories = ["Gaji & Operasional", "Sewa & Utilitas", "IT & Software", "Pemasaran", "Lainnya"];
  const getExpenseByCategory = (cat: string) => {
    return expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
  };

  // Export CSV functions
  const exportInvoicesToCSV = () => {
    if (invoices.length === 0) return alert("Tidak ada data invoice untuk diekspor");
    const headers = ["Invoice ID", "Klien", "Nominal", "Tanggal Terbit", "Tanggal Jatuh Tempo", "Status"];
    const rows = invoices.map((i) => [
      i.invoiceId,
      i.clientName,
      i.amount,
      i.issueDate,
      i.dueDate,
      i.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Invoice_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExpensesToCSV = () => {
    if (expenses.length === 0) return alert("Tidak ada data pengeluaran untuk diekspor");
    const headers = ["Expense ID", "Kategori", "Deskripsi", "Nominal", "Tanggal"];
    const rows = expenses.map((e) => [
      e.expenseId,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.date,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Pengeluaran_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToDocx = () => {
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Laporan Keuangan</title>
        <style>
          body { font-family: 'Arial', sans-serif; color: #333333; line-height: 1.5; padding: 40px; }
          .header { text-align: center; border-bottom: 3px double #333333; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { margin: 0; font-size: 22px; color: #111111; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 3px 0; font-size: 11px; color: #555555; }
          .title-area { text-align: center; margin-bottom: 30px; }
          .title-area h2 { margin: 0; font-size: 18px; text-decoration: underline; color: #222222; }
          .title-area p { margin: 4px 0 0 0; font-size: 11px; color: #666666; }
          .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #bbbbbb; padding-bottom: 3px; color: #1a365d; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th, td { border: 1px solid #cccccc; padding: 7px 10px; text-align: left; }
          th { background-color: #f4f6f9; font-weight: bold; color: #2d3748; }
          .text-right { text-align: right; }
          .font-mono { font-family: 'Courier New', monospace; }
          .font-bold { font-weight: bold; }
          .bg-gray { background-color: #f7fafc; }
          .footer-sig { margin-top: 50px; float: right; text-align: center; width: 220px; font-size: 11px; }
          .sig-space { height: 70px; }
        </style>
      </head>
      <body>
        <!-- Kop Surat Resmi -->
        <div class="header">
          <h1>PT MITRA ABADI JAYA</h1>
          <p>Layanan Pengadaan IT, Perangkat Lunak, & Konsultan Bisnis</p>
          <p>Jl. Jenderal Sudirman No. 12, Jakarta Selatan, Indonesia | Telp: +62 812-3456-7890</p>
          <p>Email: finance@mitraabadijaya.com | Website: www.mitraabadijaya.com</p>
        </div>

        <!-- Judul Laporan -->
        <div class="title-area">
          <h2>LAPORAN KEUANGAN BULANAN</h2>
          <p>Periode Laporan: s/d ${todayStr}</p>
          <p>Tanggal Cetak: ${todayStr}</p>
        </div>

        <!-- Ringkasan Kinerja -->
        <div class="section-title">I. Ringkasan Kinerja Keuangan</div>
        <table>
          <thead>
            <tr>
              <th>Parameter Analisis</th>
              <th class="text-right">Nilai / Rasio</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Margin Laba Bersih (Net Profit Margin)</td>
              <td class="text-right font-mono font-bold">${netProfitMargin}%</td>
              <td>Rasio realisasi laba bersih terhadap kas masuk.</td>
            </tr>
            <tr>
              <td>Rasio Kolektibilitas Piutang</td>
              <td class="text-right font-mono font-bold">${totalRevenue > 0 ? Math.round((revenuePaid / totalRevenue) * 100) : 0}%</td>
              <td>Persentase piutang terbayar dari seluruh tagihan diterbitkan.</td>
            </tr>
            <tr>
              <td>Total Pengeluaran Operasional</td>
              <td class="text-right font-mono">${formatRupiah(totalExpenses)}</td>
              <td>Akumulasi pengeluaran operasional usaha.</td>
            </tr>
          </tbody>
        </table>

        <!-- Laba Rugi -->
        <div class="section-title">II. Laporan Laba Rugi (Profit & Loss)</div>
        <table>
          <thead>
            <tr class="bg-gray">
              <th colspan="2">Deskripsi Akun</th>
              <th class="text-right">Jumlah (Rupiah)</th>
            </tr>
          </thead>
          <tbody>
            <!-- Pendapatan -->
            <tr class="font-bold">
              <td colspan="2" style="background-color: #ebf8ff; color: #2b6cb0;">1. PENDAPATAN USAHA</td>
              <td class="text-right"></td>
            </tr>
            <tr>
              <td style="padding-left: 20px;">1.1 Pendapatan Realisasi (Tagihan Lunas)</td>
              <td></td>
              <td class="text-right font-mono">${formatRupiah(revenuePaid)}</td>
            </tr>
            <tr>
              <td style="padding-left: 20px;">1.2 Piutang Aktif (Belum Lunas)</td>
              <td></td>
              <td class="text-right font-mono">${formatRupiah(revenueOutstanding)}</td>
            </tr>
            <tr class="font-bold bg-gray">
              <td style="padding-left: 20px;">Total Pendapatan Usaha</td>
              <td></td>
              <td class="text-right font-mono">${formatRupiah(totalRevenue)}</td>
            </tr>
            <!-- Pengeluaran -->
            <tr class="font-bold">
              <td colspan="2" style="background-color: #fff5f5; color: #c53030;">2. PENGELUARAN OPERASIONAL</td>
              <td class="text-right"></td>
            </tr>
            ${expenseCategories.map(cat => `
              <tr>
                <td style="padding-left: 20px;">2.${expenseCategories.indexOf(cat) + 1} ${cat}</td>
                <td></td>
                <td class="text-right font-mono">${formatRupiah(getExpenseByCategory(cat))}</td>
              </tr>
            `).join("")}
            <tr class="font-bold bg-gray">
              <td style="padding-left: 20px;">Total Pengeluaran Operasional</td>
              <td></td>
              <td class="text-right font-mono">${formatRupiah(totalExpenses)}</td>
            </tr>
            <!-- Laba Bersih -->
            <tr class="font-bold bg-gray" style="font-size: 12px; background-color: #f0fff4;">
              <td colspan="2" style="color: #2f855a;">LABA BERSIH (REALISASI KAS)</td>
              <td class="text-right font-mono" style="color: #2f855a;">${formatRupiah(netProfit)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Tanda Tangan -->
        <div class="footer-sig">
          <p>Jakarta, ${todayStr}</p>
          <p>Dibuat Oleh,</p>
          <div class="sig-space"></div>
          <p class="font-bold" style="text-decoration: underline;">Departemen Keuangan</p>
          <p>PT Mitra Abadi Jaya</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: "application/msword",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Keuangan_MAJ_${new Date().toISOString().split("T")[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Laporan Keuangan</h1>
          <p className="text-slate-400">Analisis laba rugi, efisiensi kas, dan ekspor data pembukuan usaha Anda.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToDocx}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <span>📄 Cetak Laporan (Word)</span>
          </button>
          <button
            onClick={exportInvoicesToCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
          >
            Invoices (CSV)
          </button>
          <button
            onClick={exportExpensesToCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-sm"
          >
            Pengeluaran (CSV)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Menyusun laporan keuangan...</p>
        </div>
      ) : (
        <>
          {/* Performance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
              <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Margin Laba Bersih</p>
              <h2 className="text-3xl font-bold text-white mt-2 font-mono">{netProfitMargin}%</h2>
              <p className="text-xs text-slate-400 mt-2">Rasio laba bersih terhadap kas masuk</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
              <p className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Rata-rata Invoice</p>
              <h2 className="text-3xl font-bold text-white mt-2 font-mono">
                {formatRupiah(invoices.length > 0 ? Math.round(totalRevenue / invoices.length) : 0)}
              </h2>
              <p className="text-xs text-slate-400 mt-2">Nilai rata-rata setiap penagihan</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
              <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase">Rasio Kolektibilitas</p>
              <h2 className="text-3xl font-bold text-white mt-2 font-mono">
                {totalRevenue > 0 ? Math.round((revenuePaid / totalRevenue) * 100) : 0}%
              </h2>
              <p className="text-xs text-slate-400 mt-2">Persentase piutang yang berhasil ditagih</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profit & Loss Statement (Col Span 2) */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 border-b border-slate-850 pb-3">Laporan Laba Rugi</h3>
              
              <div className="space-y-4 text-sm">
                {/* REVENUE */}
                <div className="space-y-2">
                  <h4 className="font-bold text-indigo-400 uppercase tracking-wider text-xs">I. Pendapatan Usaha</h4>
                  <div className="flex justify-between pl-4 text-slate-300 py-1 border-b border-slate-850/40">
                    <span>Pendapatan Cair (Tagihan Lunas)</span>
                    <span className="font-mono">{formatRupiah(revenuePaid)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-500 py-1 border-b border-slate-850/40">
                    <span>Pendapatan Tertunda (Piutang Aktif)</span>
                    <span className="font-mono">{formatRupiah(revenueOutstanding)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-white font-bold py-1.5 bg-slate-950/40 rounded px-2">
                    <span>Total Pendapatan</span>
                    <span className="font-mono text-emerald-400">{formatRupiah(totalRevenue)}</span>
                  </div>
                </div>

                {/* EXPENSES */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-rose-400 uppercase tracking-wider text-xs">II. Pengeluaran Operasional</h4>
                  {expenseCategories.map((cat) => {
                    const amt = getExpenseByCategory(cat);
                    return (
                      <div key={cat} className="flex justify-between pl-4 text-slate-300 py-1 border-b border-slate-850/40">
                        <span>{cat}</span>
                        <span className="font-mono">{formatRupiah(amt)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pl-4 text-white font-bold py-1.5 bg-slate-950/40 rounded px-2">
                    <span>Total Pengeluaran</span>
                    <span className="font-mono text-rose-400">{formatRupiah(totalExpenses)}</span>
                  </div>
                </div>

                {/* NET PROFIT */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex justify-between text-base font-extrabold text-white py-2.5 bg-slate-950/70 rounded-lg px-4 border border-slate-850">
                    <span>Laba Bersih (Realisasi Kas)</span>
                    <span className={`font-mono ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatRupiah(netProfit)}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 pl-2">
                    * Laba bersih dihitung berdasarkan kas riil yang masuk (tagihan lunas) dikurangi total biaya operasional.
                  </p>
                </div>
              </div>
            </div>

            {/* Top Clients & Category Breakdown (Col Span 1) */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-3 mb-4">Kontribusi Klien Terbesar</h3>
                {clients.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Belum ada data klien.</p>
                ) : (
                  <div className="space-y-3">
                    {clients
                      .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
                      .slice(0, 4)
                      .map((c, index) => (
                        <div key={c.clientId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="h-5 w-5 bg-slate-950 rounded flex items-center justify-center font-bold text-[10px] text-slate-400">
                              {index + 1}
                            </span>
                            <span className="font-semibold text-slate-300 truncate w-32">{c.name}</span>
                          </div>
                          <span className="font-mono font-bold text-white">{formatRupiah(c.totalInvoiced)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-850">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-3 mb-4">Efisiensi Biaya Operasional</h3>
                <div className="space-y-4">
                  {expenseCategories.map((cat) => {
                    const amt = getExpenseByCategory(cat);
                    const calculatedPercent = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{cat}</span>
                          <span className="font-mono font-semibold text-slate-200">{calculatedPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${calculatedPercent}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Export Preview Section */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-200">Pratinjau Data Ekspor</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tampilan data mentah yang akan diekspor ke dalam file CSV.</p>
              </div>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setActivePreviewTab("invoices")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    activePreviewTab === "invoices" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActivePreviewTab("expenses")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                    activePreviewTab === "expenses" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pengeluaran ({expenses.length})
                </button>
              </div>
            </div>

            {activePreviewTab === "invoices" ? (
              invoices.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Tidak ada data invoice untuk ditampilkan.</p>
              ) : (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="min-w-full text-xs text-left text-slate-300 divide-y divide-slate-850 font-mono">
                    <thead className="text-slate-500 uppercase font-bold bg-slate-950/40">
                      <tr>
                        <th className="px-4 py-2">Invoice ID</th>
                        <th className="px-4 py-2">Klien</th>
                        <th className="px-4 py-2">Nominal</th>
                        <th className="px-4 py-2">Terbit</th>
                        <th className="px-4 py-2">Tempo</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                      {invoices.map((i) => (
                        <tr key={i.invoiceId} className="hover:bg-slate-800/15 transition-colors">
                          <td className="px-4 py-2 text-indigo-400">{i.invoiceId}</td>
                          <td className="px-4 py-2 text-slate-300 font-sans font-semibold">{i.clientName}</td>
                          <td className="px-4 py-2 text-slate-200">{formatRupiah(i.amount)}</td>
                          <td className="px-4 py-2">{i.issueDate}</td>
                          <td className="px-4 py-2">{i.dueDate}</td>
                          <td className="px-4 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              i.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              expenses.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Tidak ada data pengeluaran untuk ditampilkan.</p>
              ) : (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="min-w-full text-xs text-left text-slate-300 divide-y divide-slate-850 font-mono">
                    <thead className="text-slate-500 uppercase font-bold bg-slate-950/40">
                      <tr>
                        <th className="px-4 py-2">Expense ID</th>
                        <th className="px-4 py-2">Kategori</th>
                        <th className="px-4 py-2">Deskripsi</th>
                        <th className="px-4 py-2">Nominal</th>
                        <th className="px-4 py-2">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                      {expenses.map((e) => (
                        <tr key={e.expenseId} className="hover:bg-slate-800/15 transition-colors">
                          <td className="px-4 py-2 text-rose-400">{e.expenseId}</td>
                          <td className="px-4 py-2 text-slate-300 font-sans font-semibold">{e.category}</td>
                          <td className="px-4 py-2 text-slate-400 font-sans">{e.description || "-"}</td>
                          <td className="px-4 py-2 text-slate-200">{formatRupiah(e.amount)}</td>
                          <td className="px-4 py-2">{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
