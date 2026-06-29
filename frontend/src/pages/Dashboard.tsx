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
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

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

      // 3. Fetch AI Risk Insight
      const riskRes = await fetch("/api/ai/risk-insight", { method: "POST" });
      const riskData = await riskRes.json();
      if (riskData && Array.isArray(riskData.riskyClients)) {
        setRiskyClients(riskData.riskyClients);
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

    for (let i = 0; i < 7; i++) {
      const current = new Date();
      current.setDate(today.getDate() + i);
      const dateStr = current.toISOString().split("T")[0];
      
      // Calculate total unpaid due on this specific day
      const dailyAmount = invoices
        .filter((inv) => {
          const isUnpaid = inv.status === "UNPAID" && inv.dueDate >= todayStr;
          return isUnpaid && inv.dueDate === dateStr;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

      // Label (e.g. "Senin", "Selasa" or date "29 Jun")
      const dayLabel = current.toLocaleDateString("id-ID", { weekday: "short" });
      const dateLabel = current.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

      data.push({
        dateStr,
        dayLabel,
        dateLabel,
        amount: dailyAmount,
      });
    }
    return data;
  };

  const chartData = getChartData();
  const maxChartAmount = Math.max(...chartData.map((d) => d.amount), 1);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat 1: Total Outstanding */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(99,102,241,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
              <p className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
                Total Outstanding
              </p>
              <h2 className="text-3xl font-bold text-white mt-2 font-mono">
                {formatRupiah(totalOutstanding)}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Piutang usaha aktif belum lunas
              </p>
            </div>

            {/* Stat 2: Overdue Amount */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-rose-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
              <p className="text-xs font-semibold text-rose-400 tracking-wider uppercase">
                Total Overdue
              </p>
              <h2 className="text-3xl font-bold text-rose-500 mt-2 font-mono">
                {formatRupiah(totalOverdue)}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Invoice melewati tanggal jatuh tempo
              </p>
            </div>

            {/* Stat 3: Projected Cash In */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
              <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                Projected Cash In (7 Days)
              </p>
              <h2 className="text-3xl font-bold text-emerald-400 mt-2 font-mono">
                {formatRupiah(projectedIncome)}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                Proyeksi kas masuk dari jatuh tempo terdekat
              </p>
            </div>
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

            {/* Cashflow Chart (Col Span 1) */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">Proyeksi Kas 7 Hari</h3>
                <p className="text-xs text-slate-400 mb-4">Grafik kas masuk berdasarkan tanggal jatuh tempo terdekat.</p>
                
                <div className="flex items-end justify-between h-48 pt-6 pb-2 px-1 relative">
                  {chartData.map((day, index) => {
                    const percentHeight = (day.amount / maxChartAmount) * 80; // Max 80% height
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 group relative cursor-pointer">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950 border border-slate-800 text-[10px] p-2 rounded-lg pointer-events-none shadow-xl z-20 whitespace-nowrap text-center">
                          <p className="text-slate-400 font-semibold">{day.dateLabel}</p>
                          <p className="text-indigo-400 font-bold font-mono mt-0.5">{formatRupiah(day.amount)}</p>
                        </div>
                        
                        {/* Bar */}
                        <div className="w-5 bg-gradient-to-t from-indigo-650 to-indigo-500 rounded-t-md group-hover:from-indigo-500 group-hover:to-purple-400 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all duration-300 relative"
                             style={{ height: `${Math.max(day.amount > 0 ? 4 : 0, percentHeight)}%` }}>
                          {day.amount > 0 && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/30 rounded-t-md" />
                          )}
                        </div>

                        {/* Labels */}
                        <span className="text-[9px] font-bold text-slate-400 mt-2 font-mono">{day.dayLabel}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{day.dateLabel.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Proyeksi 7 Hari:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{formatRupiah(projectedIncome)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
