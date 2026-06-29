import { useEffect, useState } from "react";

interface PaymentHistory {
  paymentId: string;
  invoiceId: string;
  paidDate: string;
  wasLate: boolean;
  daysLate: number;
}

interface Client {
  clientId: string;
  name: string;
  contactInfo: string;
  totalInvoiced: number;
  onTimeRate: number;
  paymentHistory: PaymentHistory[];
}

interface RiskyClient {
  clientId: string;
  name: string;
  riskLevel: "high" | "medium" | "low";
  reason: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [riskyClients, setRiskyClients] = useState<RiskyClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Client Form State
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  const fetchClientsAndInsights = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Clients
      const clientsRes = await fetch("/api/clients");
      const clientsData = await clientsRes.json();
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
        // Retain selection if client still exists
        if (selectedClient) {
          const updated = clientsData.find((c) => c.clientId === selectedClient.clientId);
          if (updated) setSelectedClient(updated);
        }
      }

      // 2. Fetch AI Insights
      const riskRes = await fetch("/api/ai/risk-insight", { method: "POST" });
      const riskData = await riskRes.json();
      if (riskData && Array.isArray(riskData.riskyClients)) {
        setRiskyClients(riskData.riskyClients);
      }
    } catch (err) {
      console.error("Error fetching clients data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsAndInsights();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactInfo }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Klien baru berhasil ditambahkan!");
        setName("");
        setContactInfo("");
        setIsAddingClient(false);
        await fetchClientsAndInsights();
        // Select the newly created client
        const newClient = clients.find((c) => c.clientId === data.clientId) || data;
        setSelectedClient(newClient);
      } else {
        alert("Gagal menambahkan klien: " + data.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getClientRiskInsight = (clientId: string) => {
    return riskyClients.find((rc) => rc.clientId === clientId) || null;
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
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Kelola Klien</h1>
        <p className="text-slate-400">Pantau profil klien, histori ketepatan waktu pembayaran, dan status risiko piutang.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 h-96 bg-slate-900/50 border border-slate-800 rounded-xl" />
          <div className="h-96 bg-slate-900/50 border border-slate-800 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Clients List */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-900 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Daftar Klien</h2>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setIsAddingClient(true);
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 hover:scale-[1.02] active:scale-[0.98] text-slate-200 text-xs font-semibold rounded border border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer"
              >
                + Tambah Klien
              </button>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Belum ada klien terdaftar. Klik "+ Tambah Klien" untuk menambahkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-850">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-400 tracking-wider">
                      <th className="pb-3 px-3">Nama Klien</th>
                      <th className="pb-3 px-3">Total Transaksi</th>
                      <th className="pb-3 px-3">Ketepatan Waktu</th>
                      <th className="pb-3 px-3 text-right">Status Risiko</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {clients.map((client) => {
                      const risk = getClientRiskInsight(client.clientId);
                      const isSelected = selectedClient?.clientId === client.clientId;

                      return (
                        <tr
                          key={client.clientId}
                          onClick={() => {
                            setSelectedClient(client);
                            setIsAddingClient(false);
                          }}
                          className={`cursor-pointer hover:bg-slate-900/40 transition-colors duration-200 ${
                            isSelected ? "bg-indigo-500/15 border-l-2 border-indigo-500 shadow-sm" : ""
                          }`}
                        >
                          <td className="py-4 px-3 font-semibold text-slate-200">{client.name}</td>
                          <td className="py-4 px-3 font-mono text-slate-300">
                            {formatRupiah(client.totalInvoiced)}
                          </td>
                          <td className="py-4 px-3">
                            <span
                              className={`font-semibold ${
                                client.onTimeRate >= 80
                                  ? "text-emerald-400"
                                  : client.onTimeRate >= 50
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {client.onTimeRate}% Tepat Waktu
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            {risk ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  risk.riskLevel === "high"
                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {risk.riskLevel} Risk
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Low Risk
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column: Detail Pane OR Add Client Form */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-6">
            {isAddingClient ? (
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-bold text-white">Klien Baru</h2>
                  <button
                    type="button"
                    onClick={() => setIsAddingClient(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Klien / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Sumber Rejeki"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Info Kontak (Email/WA)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: billing@sumberrejeki.com"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Klien"}
                </button>
              </form>
            ) : selectedClient ? (
              <div className="space-y-6">
                {/* Header Client Info */}
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{selectedClient.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedClient.clientId}</p>
                  <p className="text-sm text-slate-300 mt-2">
                    📧 {selectedClient.contactInfo || "Kontak belum diatur"}
                  </p>
                </div>

                {/* AI Risk Card */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Analisis Risiko Kredit (AI)
                  </h3>
                  {(() => {
                    const risk = getClientRiskInsight(selectedClient.clientId);
                    if (risk) {
                      return (
                        <div className={`p-4 rounded-lg border text-sm font-medium ${
                          risk.riskLevel === "high"
                            ? "bg-rose-500/5 border-rose-500/20 text-rose-200"
                            : "bg-amber-500/5 border-amber-500/20 text-amber-200"
                        }`}>
                          <div className="flex items-center space-x-2 mb-1.5">
                            <span className="text-lg">⚠️</span>
                            <span className="font-extrabold uppercase text-xs">
                              {risk.riskLevel} Risk Warning
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{risk.reason}</p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-200 text-sm font-medium">
                          <div className="flex items-center space-x-2 mb-1.5">
                            <span className="text-lg">✅</span>
                            <span className="font-extrabold uppercase text-xs">Aman / Low Risk</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Berdasarkan histori transaksi, klien ini memiliki catatan pembayaran yang tepat waktu.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Riwayat Pembayaran ({selectedClient.paymentHistory.length})
                  </h3>
                  {selectedClient.paymentHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">Belum ada riwayat pembayaran untuk klien ini.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedClient.paymentHistory.map((pay) => (
                        <div
                          key={pay.paymentId}
                          className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-mono text-slate-300">Invoice: {pay.invoiceId}</p>
                            <p className="text-slate-400 mt-0.5">Paid: {pay.paidDate}</p>
                          </div>
                          <div className="text-right">
                            {pay.wasLate ? (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold font-mono">
                                Late (+{pay.daysLate}d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                                On Time
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 space-y-4">
                <div className="text-4xl">🏢</div>
                <p className="text-sm">Pilih klien dari daftar untuk melihat detail profil, riwayat pembayaran, dan analisis risiko.</p>
                <button
                  onClick={() => setIsAddingClient(true)}
                  className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white text-xs font-semibold rounded transition-all cursor-pointer"
                >
                  Tambah Klien Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
