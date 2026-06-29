import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

interface Client {
  clientId: string;
  name: string;
  contactInfo: string;
}

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState("");
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices?status=${activeTab}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [activeTab]);

  useEffect(() => {
    fetchClients();
    
    // Auto-open modal if new=true is in URL
    if (searchParams.get("new") === "true") {
      resetForm();
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const resetForm = () => {
    setClientId("");
    setIsNewClientMode(false);
    setNewClientName("");
    setNewClientContact("");
    setAmount("");
    
    const today = new Date().toISOString().split("T")[0];
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
    const due = twoWeeksLater.toISOString().split("T")[0];
    
    setIssueDate(today);
    setDueDate(due);
    setNotes("");
  };

  const handleMarkPaid = async (id: string) => {
    if (!confirm("Tandai invoice ini sebagai LUNAS?")) return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidDate: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Invoice berhasil dilunasi!");
        fetchInvoices();
      } else {
        alert("Gagal melunasi: " + data.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let finalClientId = clientId;

      // 1. Create client first if new client mode
      if (isNewClientMode) {
        if (!newClientName.trim()) {
          alert("Nama klien baru tidak boleh kosong.");
          setSubmitting(false);
          return;
        }

        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newClientName, contactInfo: newClientContact }),
        });
        const clientData = await clientRes.json();
        if (clientRes.ok) {
          finalClientId = clientData.clientId;
        } else {
          throw new Error(clientData.message || "Gagal membuat klien baru");
        }
      }

      if (!finalClientId) {
        alert("Silakan pilih atau tambahkan klien.");
        setSubmitting(false);
        return;
      }

      // 2. Create Invoice
      const invoiceRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: finalClientId,
          amount: Number(amount),
          issueDate,
          dueDate,
          notes,
        }),
      });

      const invoiceData = await invoiceRes.json();
      if (invoiceRes.ok) {
        alert("Invoice baru berhasil dibuat!");
        setIsModalOpen(false);
        resetForm();
        fetchInvoices();
        fetchClients(); // Refresh client dropdown
      } else {
        alert("Gagal membuat invoice: " + invoiceData.message);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Kelola Invoice</h1>
          <p className="text-slate-400">Buat invoice baru, pantau status, dan tandai pembayaran lunas.</p>
        </div>
        <div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer"
          >
            + New Invoice
          </button>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="border-b border-slate-800 flex space-x-2">
        {["ALL", "UNPAID", "OVERDUE", "PAID"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 border-b-2 font-semibold text-sm transition-all cursor-pointer ${
              activeTab === tab
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="bg-slate-900/10 border border-slate-900 rounded-xl p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-full" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-12 text-center text-slate-500">
          Tidak ada invoice dalam kategori ini.
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-900 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 tracking-wider bg-slate-900/50">
                  <th className="px-6 py-4">Invoice ID</th>
                  <th className="px-6 py-4">Klien</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-900/40 hover:scale-[1.002] transition-all duration-200 origin-left">
                    <td className="px-6 py-4 font-mono text-slate-300">{inv.invoiceId}</td>
                    <td className="px-6 py-4 text-slate-100 font-semibold">{inv.clientName}</td>
                    <td className="px-6 py-4 font-mono text-slate-200">{formatRupiah(inv.amount)}</td>
                    <td className="px-6 py-4 text-slate-400">{inv.dueDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : inv.status === "OVERDUE"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status !== "PAID" && (
                        <button
                          onClick={() => handleMarkPaid(inv.invoiceId)}
                          className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded text-xs font-semibold transition-all cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form New Invoice */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Buat Invoice Baru</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Klien
                </label>
                {!isNewClientMode ? (
                  <div className="flex space-x-2">
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required={!isNewClientMode}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Pilih Klien --</option>
                      {clients.map((c) => (
                        <option key={c.clientId} value={c.clientId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsNewClientMode(true)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      + Klien Baru
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-800/80 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-indigo-400">Tambah Klien Baru</span>
                      <button
                        type="button"
                        onClick={() => setIsNewClientMode(false)}
                        className="text-slate-400 hover:text-slate-200 text-xs font-semibold underline cursor-pointer"
                      >
                        Pilih Klien Terdaftar
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Klien/UMKM Baru"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        required={isNewClientMode}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email Klien (opsional)"
                        value={newClientContact}
                        onChange={(e) => setNewClientContact(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nominal Tagihan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="15000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Terbit
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Catatan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Layanan pengerjaan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Buat Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
