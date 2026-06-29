import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Invoice {
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
  notes: string;
}

interface RiskyClient {
  clientId: string;
  name: string;
  riskLevel: "high" | "medium" | "low";
  reason: string;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projectedIncome, setProjectedIncome] = useState<number>(0);
  const [riskyClients, setRiskyClients] = useState<RiskyClient[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [advisoryLoading, setAdvisoryLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Simulator States
  const [simDelay, setSimDelay] = useState<number>(0);
  const [simExpense, setSimExpense] = useState<number>(0);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Invoices
      const invRes = await fetch("/api/invoices?status=ALL");
      const invData = await invRes.json();
      if (Array.isArray(invData)) {
        setInvoices(invData);
      }

      // 2. Fetch Cashflow Projection (7 days)
      const cashRes = await fetch("/api/cashflow/projection?days=7");
      const cashData = await cashRes.json();
      if (cashData && typeof cashData.projectedIncome === "number") {
        setProjectedIncome(cashData.projectedIncome);
      }

      // 3. Fetch Expenses
      try {
        const expRes = await fetch("/api/expenses");
        const expData = await expRes.json();
        if (Array.isArray(expData)) {
          const totalExp = expData.reduce((sum: number, e: any) => sum + e.amount, 0);
          setTotalExpenses(totalExp);
        }
      } catch (expErr) {
        console.error("Error fetching expenses:", expErr);
      }

      // 4. Fetch AI Risk Insight
      const riskRes = await fetch("/api/ai/risk-insight", { method: "POST" });
      const riskData = await riskRes.json();
      if (riskData && Array.isArray(riskData.riskyClients)) {
        setRiskyClients(riskData.riskyClients);
      }

      // 5. Fetch AI Financial Advisory
      try {
        setAdvisoryLoading(true);
        const advisoryRes = await fetch("/api/ai/financial-advisory", { method: "POST" });
        const advisoryData = await advisoryRes.json();
        if (advisoryData && Array.isArray(advisoryData.recommendations)) {
          setRecommendations(advisoryData.recommendations);
        }
      } catch (advisoryErr) {
        console.error("Error fetching financial advisory:", advisoryErr);
      } finally {
        setAdvisoryLoading(false);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const triggerSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        alert("Dummy data seeded successfully!");
        fetchDashboardData();
      } else {
        alert("Failed to seed database: " + data.message);
      }
    } catch (err: any) {
      alert("Error seeding: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  // Calculations
  const totalOutstanding = invoices
    .filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOverdue = invoices
    .filter((inv) => inv.status === "OVERDUE")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const recentInvoices = invoices.slice(0, 5);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 7-day cashflow projection data
  const getChartData = () => {
    const today = new Date();
    const data = [];
    const todayStr = today.toISOString().split("T")[0];

    // Calculate original daily amounts first
    const tempOriginal: { dateStr: string; dayLabel: string; dateLabel: string; amount: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date();
      current.setDate(today.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      
      const dailyAmount = invoices
        .filter((inv) => {
          const isUnpaid = inv.status === "UNPAID" && inv.dueDate >= todayStr;
          return isUnpaid && inv.dueDate === dateStr;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      const dayLabel = current.toLocaleDateString("id-ID", { weekday: "short" });
      const dateLabel = current.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      tempOriginal.push({
        dateStr,
        dayLabel,
        dateLabel,
        amount: dailyAmount,
      });
    }

    // Now apply simulation to generate the side-by-side data
    for (let i = 0; i < 7; i++) {
      const orig = tempOriginal[i];
      
      // Simulation logic:
      // 1. Shift payments by simDelay days
      let simulatedAmount = 0;
      if (i >= simDelay) {
        simulatedAmount = tempOriginal[i - simDelay]?.amount || 0;
      }
      
      // 2. Subtract unexpected expenses on Day 1 (today)
      if (i === 0) {
        simulatedAmount -= simExpense;
      }

      data.push({
        ...orig,
        simulatedAmount,
      });
    }
    return data;
  };

  const chartData = getChartData();
  const maxChartAmount = Math.max(
    ...chartData.map((d) => d.amount),
    ...chartData.map((d) => Math.abs(d.simulatedAmount)),
    1
  );

  // Aging Report calculation
  const getAgingData = () => {
    const today = new Date();
    let bucket1 = 0; // 0 - 30 days
    let bucket2 = 0; // 31 - 60 days
    let bucket3 = 0; // 61 - 90 days
    let bucket4 = 0; // > 90 days

    invoices
      .filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE")
      .forEach((inv) => {
        const issue = new Date(inv.issueDate);
        const diffTime = today.getTime() - issue.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          bucket1 += inv.amount;
        } else if (diffDays <= 60) {
          bucket2 += inv.amount;
        } else if (diffDays <= 90) {
          bucket3 += inv.amount;
        } else {
          bucket4 += inv.amount;
        }
      });

    const total = bucket1 + bucket2 + bucket3 + bucket4;
    return {
      bucket1,
      bucket2,
      bucket3,
      bucket4,
      total: total || 1,
    };
  };

  const aging = getAgingData();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Action Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ringkasan Cashflow
          </h1>
          <p className="text-slate-400 mt-1">
            Pantau kas masuk dan analisis risiko piutang usaha Anda.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={triggerSeed}
            disabled={seeding}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-sm cursor-pointer"
          >
            {seeding ? "Seeding..." : "Seed Dummy Data"}
          </button>
          <Link
            to="/invoices?new=true"
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all duration-200 flex items-center space-x-1 cursor-pointer"
          >
            <span>+ New Invoice</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat 1: Total Outstanding */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-indigo-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
              <p className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">
                Total Outstanding
              </p>
              <h2 className="text-2xl font-bold text-white mt-2 font-mono">
                {formatRupiah(totalOutstanding)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-2">
                Piutang usaha belum lunas
              </p>
            </div>

            {/* Stat 2: Overdue Amount */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-rose-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-20 w-20 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
              <p className="text-[10px] font-semibold text-rose-400 tracking-wider uppercase">
                Total Overdue
              </p>
              <h2 className="text-2xl font-bold text-rose-500 mt-2 font-mono">
                {formatRupiah(totalOverdue)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-2">
                Invoice melewati jatuh tempo
              </p>
            </div>

            {/* Stat 3: Total Expenses */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-orange-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-20 w-20 bg-orange-500/5 rounded-full blur-xl group-hover:bg-orange-500/10 transition-all" />
              <p className="text-[10px] font-semibold text-orange-400 tracking-wider uppercase">
                Total Pengeluaran
              </p>
              <h2 className="text-2xl font-bold text-white mt-2 font-mono">
                {formatRupiah(totalExpenses)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-2">
                Biaya operasional perusahaan
              </p>
            </div>

            {/* Stat 4: Net Profit */}
            {(() => {
              const totalPaid = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
              const netProfit = totalPaid - totalExpenses;
              return (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                  <p className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">
                    Laba Bersih
                  </p>
                  <h2 className={`text-2xl font-bold mt-2 font-mono ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatRupiah(netProfit)}
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Total pelunasan dikurangi biaya
                  </p>
                </div>
              );
            })()}
          </div>

          {/* AI Risk Alert Banner (Always Visible) */}
          <div className={`transition-all duration-300 border rounded-xl p-5 relative overflow-hidden ${
            riskyClients.length > 0
              ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
              : "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20"
          }`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
              riskyClients.length > 0
                ? "from-amber-400 to-orange-500"
                : "from-emerald-400 to-teal-500"
            }`} />
            <div className="flex items-start space-x-3">
              <span className="text-2xl mt-0.5">
                {riskyClients.length > 0 ? "⚠️" : "🛡️"}
              </span>
              <div className="space-y-2">
                <h3 className={`text-sm font-bold ${
                  riskyClients.length > 0 ? "text-amber-300" : "text-emerald-300"
                }`}>
                  AI Early Warning: Analisis Risiko Piutang Klien
                </h3>
                {riskyClients.length > 0 ? (
                  <div className="text-xs text-slate-300 space-y-1.5 font-medium font-sans">
                    {riskyClients.map((client) => (
                      <p key={client.clientId}>
                        • Klien{" "}
                        <Link to="/clients" className="text-amber-400 underline hover:text-amber-300">
                          {client.name}
                        </Link>{" "}
                        dinilai berisiko{" "}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          client.riskLevel === "high"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {client.riskLevel}
                        </span>
                        : {client.reason}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 font-medium">
                    Status: <span className="text-emerald-400 font-bold">Aman</span>. Seluruh klien Anda memiliki catatan pembayaran yang baik berdasarkan data transaksi terakhir. Tidak ada risiko keterlambatan pembayaran yang terdetectsi oleh AI saat ini.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Aging Report Card */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-200 mb-2">Analisis Umur Piutang (Aging Report)</h3>
            <p className="text-xs text-slate-400 mb-6">Pembagian total piutang usaha belum lunas berdasarkan jumlah hari sejak tanggal invoice diterbitkan.</p>
            
            <div className="space-y-4">
              {/* Stacked Progress Bar */}
              <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${(aging.bucket1 / aging.total) * 100}%` }} 
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  title={`0-30 Hari: ${formatRupiah(aging.bucket1)}`}
                />
                <div 
                  style={{ width: `${(aging.bucket2 / aging.total) * 100}%` }} 
                  className="bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                  title={`31-60 Hari: ${formatRupiah(aging.bucket2)}`}
                />
                <div 
                  style={{ width: `${(aging.bucket3 / aging.total) * 100}%` }} 
                  className="bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  title={`61-90 Hari: ${formatRupiah(aging.bucket3)}`}
                />
                <div 
                  style={{ width: `${(aging.bucket4 / aging.total) * 100}%` }} 
                  className="bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                  title={`>90 Hari: ${formatRupiah(aging.bucket4)}`}
                />
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>0 - 30 Hari</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono pl-4">{formatRupiah(aging.bucket1)}</p>
                  <p className="text-[10px] text-slate-500 pl-4">({Math.round((aging.bucket1 / aging.total) * 100)}% - Risiko Rendah)</p>
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <span>31 - 60 Hari</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono pl-4">{formatRupiah(aging.bucket2)}</p>
                  <p className="text-[10px] text-slate-500 pl-4">({Math.round((aging.bucket2 / aging.total) * 100)}% - Risiko Menengah)</p>
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span>61 - 90 Hari</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono pl-4">{formatRupiah(aging.bucket3)}</p>
                  <p className="text-[10px] text-slate-500 pl-4">({Math.round((aging.bucket3 / aging.total) * 100)}% - Risiko Tinggi)</p>
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span>&gt; 90 Hari</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono pl-4">{formatRupiah(aging.bucket4)}</p>
                  <p className="text-[10px] text-slate-500 pl-4">({Math.round((aging.bucket4 / aging.total) * 100)}% - Risiko Macet)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Layout: Invoices & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Invoices Table (Col Span 2) */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-200">5 Invoice Terbaru</h3>
                  <Link to="/invoices" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline">
                    Lihat Semua Invoice
                  </Link>
                </div>

                {recentInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    Belum ada invoice yang terdaftar. Klik "+ New Invoice" untuk membuat baru.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800/80">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-slate-400 tracking-wider">
                          <th className="pb-3">Invoice ID</th>
                          <th className="pb-3">Klien</th>
                          <th className="pb-3">Nominal</th>
                          <th className="pb-3">Jatuh Tempo</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {recentInvoices.map((inv) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-900/40 transition-colors duration-200">
                            <td className="py-3.5 font-mono text-slate-300">{inv.invoiceId}</td>
                            <td className="py-3.5 text-slate-200 font-semibold">{inv.clientName}</td>
                            <td className="py-3.5 font-mono text-slate-100">{formatRupiah(inv.amount)}</td>
                            <td className="py-3.5 text-slate-400">{inv.dueDate}</td>
                            <td className="py-3.5 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                inv.status === "PAID"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : inv.status === "OVERDUE"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            {/* Proyeksi Arus Kas 7 Hari (Col Span 1) */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-300">Proyeksi & Simulasi Kas</h3>
                  <div className="flex items-center space-x-2 text-[10px] font-medium">
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>Asli</span>
                    </span>
                    <span className="flex items-center space-x-1 text-indigo-400">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      <span>Simulasi</span>
                    </span>
                  </div>
                </div>
                
                {/* Chart Bars */}
                <div className="h-48 flex items-end justify-between gap-3 pt-4 border-b border-slate-800/60 pb-2">
                  {chartData.map((day) => {
                    const origHeight = (day.amount / maxChartAmount) * 100;
                    const simHeight = (day.simulatedAmount / maxChartAmount) * 100;
                    return (
                      <div key={day.dateStr} className="flex-1 flex flex-col items-center group/bar relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-300 pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-all duration-200 z-10 shadow-xl w-36 text-center space-y-1">
                          <p className="font-bold text-white border-b border-slate-850 pb-0.5">{day.dateLabel}</p>
                          <p className="flex justify-between"><span>Asli:</span> <span className="font-mono text-emerald-400">{formatRupiah(day.amount)}</span></p>
                          <p className="flex justify-between"><span>Simulasi:</span> <span className="font-mono text-indigo-400">{formatRupiah(day.simulatedAmount)}</span></p>
                        </div>

                        {/* Bars Container */}
                        <div className="w-full flex items-end justify-center space-x-1 h-full">
                          {/* Original Bar */}
                          <div 
                            style={{ height: `${Math.max(origHeight > 0 ? 4 : 0, origHeight)}%` }} 
                            className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                          />
                          {/* Simulated Bar */}
                          <div 
                            style={{ height: `${Math.max(Math.abs(simHeight) > 0 ? 4 : 0, Math.abs(simHeight))}%` }} 
                            className={`w-1/2 rounded-t-sm transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.1)] ${
                              simHeight < 0 
                                ? "bg-gradient-to-t from-rose-600 to-rose-400" 
                                : "bg-gradient-to-t from-indigo-600 to-indigo-400"
                            }`}
                          />
                        </div>

                        {/* Labels */}
                        <span className="text-[9px] font-bold text-slate-400 mt-2 font-mono">{day.dayLabel}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{day.dateLabel.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulator Controls */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Scenario Simulator (What-If)</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Keterlambatan Pembayaran:</span>
                      <span className="font-bold text-white">{simDelay} Hari</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="7"
                      value={simDelay}
                      onChange={(e) => setSimDelay(Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Biaya Tak Terduga (Hari Ini):</span>
                      <span className="font-bold text-white">{formatRupiah(simExpense)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30000000"
                      step="1000000"
                      value={simExpense}
                      onChange={(e) => setSimExpense(Number(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                {(simDelay > 0 || simExpense > 0) && (
                  <div className="bg-rose-500/5 border border-rose-500/15 rounded-lg p-2.5 text-[10px] text-rose-300 leading-relaxed animate-fade-in">
                    ⚠️ <strong>Skenario Aktif:</strong> Kas masuk diproyeksikan berkurang karena adanya potensi penundaan bayar dan pengeluaran darurat.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Proyeksi 7 Hari:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{formatRupiah(projectedIncome)}</span>
              </div>
            </div>
          </div>

          {/* AI Financial Advisory Card */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
              <h3 className="text-base font-bold text-indigo-400 flex items-center space-x-2">
                <span className="text-xl">💡</span>
                <span>AI Financial Advisory: Rekomendasi Kas & Klien</span>
              </h3>
              <span className="bg-indigo-500/10 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono">Gemini 1.5 Flash</span>
            </div>

            {advisoryLoading ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
                <div className="h-4 bg-slate-800 rounded w-5/6" />
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">Gagal memuat rekomendasi keuangan saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((tip, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/45 border border-slate-900 rounded-lg relative overflow-hidden group/card hover:border-indigo-500/20 transition-all duration-300">
                    <div className="absolute top-3 left-3 h-5 w-5 bg-indigo-500/10 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-400">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium pl-6 pt-0.5">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
