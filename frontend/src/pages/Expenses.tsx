import { useEffect, useState } from "react";

interface Expense {
  expenseId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Gaji & Operasional");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          category,
          description,
          date,
        }),
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        setDate(new Date().toISOString().split("T")[0]);
        setIsModalOpen(false);
        fetchExpenses();
      } else {
        alert("Gagal menambahkan pengeluaran");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Calculations
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount), 0) : 0;

  const getTopCategory = () => {
    if (expenses.length === 0) return "-";
    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    let topCat = "-";
    let maxAmt = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > maxAmt) {
        maxAmt = amt;
        topCat = cat;
      }
    });
    return topCat;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Gaji & Operasional":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Sewa & Utilitas":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "IT & Software":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Pemasaran":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Pengeluaran Operasional</h1>
          <p className="text-slate-400">Catat pengeluaran bisnis Anda untuk memantau laba bersih riil.</p>
        </div>
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-rose-500/25 transition-all duration-200 cursor-pointer"
          >
            + Catat Pengeluaran
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
          <p className="text-xs font-semibold text-rose-400 tracking-wider uppercase">Total Pengeluaran</p>
          <h2 className="text-3xl font-bold text-white mt-2 font-mono">{formatRupiah(totalExpenses)}</h2>
          <p className="text-xs text-slate-400 mt-2">Akumulasi pengeluaran tercatat</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
          <p className="text-xs font-semibold text-amber-400 tracking-wider uppercase">Pengeluaran Terbesar</p>
          <h2 className="text-3xl font-bold text-white mt-2 font-mono">{formatRupiah(maxExpense)}</h2>
          <p className="text-xs text-slate-400 mt-2">Nominal pengeluaran tertinggi</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
          <p className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Kategori Terboros</p>
          <h2 className="text-2xl font-bold text-white mt-3 truncate">{getTopCategory()}</h2>
          <p className="text-xs text-slate-400 mt-2">Alokasi biaya operasional terbesar</p>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-850 bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-300">Riwayat Pengeluaran</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Memuat data pengeluaran...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <span className="text-3xl">💸</span>
            <p className="text-sm font-bold text-slate-400">Belum Ada Pengeluaran</p>
            <p className="text-xs max-w-xs mx-auto">Mulai catat biaya sewa, gaji, atau IT perusahaan Anda untuk melihat laporan laba bersih yang komprehensif.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-850 text-left text-sm">
              <thead className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Deskripsi</th>
                  <th className="px-6 py-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/10">
                {expenses.map((exp) => (
                  <tr key={exp.expenseId} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{exp.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryColor(exp.category)}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium">{exp.description || "-"}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">{formatRupiah(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Catat Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Catat Pengeluaran Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer">✕</button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="1500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="Gaji & Operasional">Gaji & Operasional</option>
                  <option value="Sewa & Utilitas">Sewa & Utilitas</option>
                  <option value="IT & Software">IT & Software</option>
                  <option value="Pemasaran">Pemasaran</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Sewa internet kantor, Listrik..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Catat Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
