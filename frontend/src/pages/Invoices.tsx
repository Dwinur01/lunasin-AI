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
  const [aiText, setAiText] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);

  // AI Receipt Verification State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBase64, setReceiptBase64] = useState("");
  const [receiptMimeType, setReceiptMimeType] = useState("");
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // AI Email Draft State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState<{ subject: string; body: string } | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  const handleAIQuickInvoice = async () => {
    if (!aiText.trim()) return;
    try {
      setAiProcessing(true);
      const res = await fetch("/api/ai/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const result = await res.json();
      if (result.data) {
        const data = result.data;
        
        // Reset and pre-fill form
        resetForm();
        
        if (data.clientId) {
          setClientId(data.clientId);
          setIsNewClientMode(false);
        } else if (data.clientName) {
          setIsNewClientMode(true);
          setNewClientName(data.clientName);
        }
        
        if (data.amount) {
          setAmount(data.amount.toString());
        }
        if (data.dueDate) {
          setDueDate(data.dueDate);
        }
        if (data.notes) {
          setNotes(data.notes);
        }
        
        setIsModalOpen(true);
        setAiText("");
      } else {
        alert("Gagal menganalisis teks: " + (result.message || "Respon tidak valid"));
      }
    } catch (err: any) {
      alert("Error memproses teks: " + err.message);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleWhatsAppReminder = (inv: Invoice) => {
    const message = `Halo *${inv.clientName}*,\n\nKami ingin mengingatkan mengenai tagihan *Invoice #${inv.invoiceId}* sebesar *${formatRupiah(inv.amount)}* yang jatuh tempo pada *${inv.dueDate}*.\n\nPembayaran dapat ditransfer melalui rekening Bank kami. Jika Anda sudah melakukan pembayaran, mohon abaikan pesan ini.\n\nTerima kasih atas kerja samanya.`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptMimeType(file.type);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      setReceiptBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyReceipt = async () => {
    if (!receiptBase64) return;
    try {
      setVerifyingReceipt(true);
      setVerificationResult(null);
      const res = await fetch("/api/ai/verify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: receiptBase64, mimeType: receiptMimeType }),
      });
      const data = await res.json();
      if (data.result) {
        setVerificationResult(data.result);
      } else {
        alert("Gagal memverifikasi bukti: " + (data.message || "Respon tidak valid"));
      }
    } catch (err: any) {
      alert("Error verifikasi: " + err.message);
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const handleConfirmReceiptPayment = async () => {
    if (!verificationResult || !verificationResult.matchedInvoice) return;
    const invId = verificationResult.matchedInvoice.invoiceId;
    try {
      const res = await fetch(`/api/invoices/${invId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidDate: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Pembayaran berhasil diverifikasi & Invoice ditandai LUNAS!");
        setIsReceiptModalOpen(false);
        setReceiptFile(null);
        setReceiptBase64("");
        setVerificationResult(null);
        fetchInvoices();
      } else {
        alert("Gagal melunasi: " + data.message);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleOpenEmailDraft = async (inv: Invoice) => {
    try {
      setIsEmailModalOpen(true);
      setGeneratingEmail(true);
      setEmailDraft(null);
      
      const res = await fetch("/api/ai/billing-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: inv.invoiceId,
          clientName: inv.clientName,
          amount: inv.amount,
          dueDate: inv.dueDate,
          status: inv.status,
        }),
      });
      const data = await res.json();
      if (data.email) {
        setEmailDraft(data.email);
      }
    } catch (err) {
      console.error("Error generating email:", err);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCopyEmail = () => {
    if (!emailDraft) return;
    const fullText = `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setReceiptFile(null);
              setReceiptBase64("");
              setVerificationResult(null);
              setIsReceiptModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-755 hover:scale-[1.02] active:scale-[0.98] text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 hover:border-slate-600 transition-all duration-200 shadow-sm cursor-pointer"
          >
            📸 Verifikasi Bukti
          </button>
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

      {/* AI Quick Invoice Widget */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
        <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center space-x-1.5">
          <span>⚡ AI Quick Invoice</span>
          <span className="bg-indigo-500/10 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-500/20 font-mono">Gemini</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3 font-medium">Tulis kalimat bebas dalam Bahasa Indonesia. AI akan mengekstrak klien, nominal, dan tanggal jatuh tempo secara otomatis.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            disabled={aiProcessing}
            rows={1}
            placeholder="Contoh: Tagih CV Abadi Jaya sebesar 15 juta rupiah untuk pengadaan bahan baku kayu, jatuh tempo 3 minggu lagi"
            className="flex-1 min-h-[40px] px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y"
          />
          <button
            onClick={handleAIQuickInvoice}
            disabled={aiProcessing || !aiText.trim()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap"
          >
            {aiProcessing ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <span>Buat dengan AI</span>
            )}
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
                  <tr key={inv.invoiceId} className="hover:bg-slate-900/40 transition-colors duration-200">
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
                    <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                      <a
                        href={`/invoice-print/${inv.invoiceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Cetak / Simpan PDF"
                        className="p-1.5 bg-slate-800 border border-slate-750 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition-all cursor-pointer flex items-center justify-center shadow-sm"
                      >
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </a>

                      {inv.status !== "PAID" && (
                        <>
                          <button
                            onClick={() => handleWhatsAppReminder(inv)}
                            title="Kirim Pengingat WhatsApp"
                            className="p-1.5 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white rounded transition-all cursor-pointer flex items-center justify-center"
                          >
                            <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.489 5.361 1.49 5.433 0 9.855-4.388 9.858-9.777.001-2.61-1.015-5.064-2.859-6.91C17.124 2.112 14.67 1.096 12.06 1.096c-5.442 0-9.866 4.39-9.869 9.782-.001 2.12.559 4.188 1.624 5.922l-1.063 3.882 3.979-1.036zm10.741-7.39c-.267-.134-1.583-.781-1.829-.871-.247-.09-.427-.134-.607.134-.18.269-.696.871-.853 1.05-.157.18-.315.201-.582.067-.267-.134-1.13-.417-2.153-1.331-.794-.709-1.33-1.583-1.486-1.85-.157-.269-.017-.414.117-.547.12-.12.267-.314.4-.472.133-.157.178-.269.267-.449.09-.18.045-.337-.022-.472-.067-.134-.607-1.462-.831-2.002-.219-.524-.462-.453-.635-.462-.163-.009-.35-.01-.536-.01-.187 0-.49.07-.748.35-.257.28-1.026 1.008-1.026 2.458 0 1.45 1.056 2.85 1.202 3.049.146.2 2.079 3.176 5.037 4.457.704.305 1.254.487 1.681.623.708.225 1.353.193 1.863.118.569-.085 1.583-.648 1.808-1.277.225-.63.225-1.171.157-1.277-.067-.107-.247-.174-.515-.308z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenEmailDraft(inv)}
                            title="Buat Draf Email AI"
                            className="p-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white rounded transition-all cursor-pointer flex items-center justify-center"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleMarkPaid(inv.invoiceId)}
                            className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-white rounded text-xs font-semibold transition-all cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        </>
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
      {/* Modal AI Receipt Verification */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Verifikasi Bukti Transfer</h2>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {!verificationResult ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-medium">Unggah foto atau tangkapan layar bukti transfer bank. Gemini Vision akan mengekstrak informasi penting secara otomatis.</p>
                  
                  {/* Upload Dropzone */}
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-500/50 transition-all relative group bg-slate-950/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptFileChange}
                      disabled={verifyingReceipt}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    
                    {receiptFile ? (
                      <div className="text-center space-y-3">
                        <span className="text-4xl">📄</span>
                        <p className="text-sm font-semibold text-white">{receiptFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <span className="text-4xl group-hover:scale-110 transition-transform inline-block">📸</span>
                        <p className="text-sm font-bold text-slate-300">Pilih File Bukti Transfer</p>
                        <p className="text-[10px] text-slate-500">Mendukung format JPG, PNG</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setIsReceiptModalOpen(false)}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleVerifyReceipt}
                      disabled={verifyingReceipt || !receiptBase64}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      {verifyingReceipt ? (
                        <span className="animate-pulse">Gemini Memindai...</span>
                      ) : (
                        <span>Analisis Bukti Transfer</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hasil Analisis AI Gemini:</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-slate-500 font-bold mb-0.5">Pengirim:</span>
                        <span className="font-semibold text-slate-200">{verificationResult.parsedData.senderName || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-bold mb-0.5">Bank Asal:</span>
                        <span className="font-semibold text-slate-200">{verificationResult.parsedData.bankName || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-bold mb-0.5">Nominal:</span>
                        <span className="font-bold text-indigo-400 font-mono">{formatRupiah(verificationResult.parsedData.amount)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 font-bold mb-0.5">Tanggal:</span>
                        <span className="font-semibold text-slate-200 font-mono">{verificationResult.parsedData.transferDate || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Status */}
                  {verificationResult.matchedInvoice ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                        <span>✅ Cocok dengan Tagihan:</span>
                      </div>
                      <div className="text-xs text-slate-300 space-y-1 pl-1">
                        <p><span className="text-slate-500 font-bold">Klien:</span> {verificationResult.matchedInvoice.clientName}</p>
                        <p><span className="text-slate-500 font-bold">Invoice ID:</span> <span className="font-mono">{verificationResult.matchedInvoice.invoiceId}</span></p>
                        <p><span className="text-slate-500 font-bold">Nominal:</span> <span className="font-mono font-bold text-white">{formatRupiah(verificationResult.matchedInvoice.amount)}</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                        <span>⚠️ Tidak Menemukan Kecocokan:</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kami tidak menemukan invoice belum lunas dengan nominal yang cocok di database. Anda dapat melakukan pelunasan manual melalui tabel invoice.
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <button
                      onClick={() => setVerificationResult(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                    >
                      Unggah Ulang
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsReceiptModalOpen(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                      {verificationResult.matchedInvoice && (
                        <button
                          onClick={handleConfirmReceiptPayment}
                          className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                        >
                          Konfirmasi & Tandai Lunas
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal AI Email Draft */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Draf Email Penagihan AI</h2>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {generatingEmail ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <div className="h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Gemini sedang menyusun draf email penagihan profesional...</p>
                </div>
              ) : emailDraft ? (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-xs text-slate-400 font-medium">Berikut adalah draf email penagihan resmi yang disesuaikan oleh AI. Anda dapat menyalin teks ini untuk dikirimkan melalui platform email Anda.</p>
                  
                  {/* Subject field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subjek Email</label>
                    <input
                      type="text"
                      readOnly
                      value={emailDraft.subject}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-sm text-slate-200 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Body field */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Isi Email</label>
                    <textarea
                      rows={10}
                      readOnly
                      value={emailDraft.body}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-855 rounded-lg text-xs text-slate-350 focus:outline-none font-sans leading-relaxed resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">Didukung oleh Gemini 1.5 Flash</span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsEmailModalOpen(false)}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                      <button
                        onClick={handleCopyEmail}
                        className={`px-5 py-2 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center space-x-1 ${
                          copiedEmail
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white"
                        }`}
                      >
                        <span>{copiedEmail ? "✓ Tersalin!" : "📋 Salin Draf Email"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-rose-400 space-y-2">
                  <span>⚠️</span>
                  <p className="text-sm font-bold">Gagal Menyusun Draf Email</p>
                  <p className="text-xs text-slate-500">Terjadi kesalahan pada sistem penyusunan AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
