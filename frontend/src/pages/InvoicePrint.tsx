import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface InvoiceDetails {
  invoiceId: string;
  clientId: string;
  clientName: string;
  clientContact: string;
  amount: number;
  status: "PAID" | "UNPAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
  notes: string;
}

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        } else {
          console.error("Failed to fetch invoice details");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold">Memuat dokumen invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 p-4">
        <div className="text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-white">Invoice Tidak Ditemukan</h2>
          <p className="text-sm max-w-xs mx-auto">Dokumen dengan ID tersebut tidak terdaftar atau telah dihapus.</p>
          <button
            onClick={() => navigate("/invoices")}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Kembali ke Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 md:py-10 print:bg-white print:py-0">
      {/* Print Action Bar */}
      <div className="max-w-3xl mx-auto mb-6 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.close()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
          >
            ← Tutup Tab
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-medium">
            Status: <span className={`font-bold ${invoice.status === "PAID" ? "text-emerald-400" : "text-amber-400"}`}>{invoice.status}</span>
          </span>
          <button
            onClick={handlePrint}
            className="px-5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center space-x-1"
          >
            <span>🖨️ Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Paper Document */}
      <div className="max-w-3xl mx-auto bg-white text-slate-800 p-8 md:p-12 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-0">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-wider text-slate-900">INVOICE</h1>
            <p className="text-xs font-bold text-slate-500 font-mono">NOMOR: {invoice.invoiceId.toUpperCase()}</p>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-xl font-black text-indigo-600">Mitra Abadi Jaya</h2>
            <p className="text-xs text-slate-500">Penyedia Layanan IT & Pengadaan</p>
            <p className="text-xs text-slate-500">Jakarta, Indonesia</p>
          </div>
        </div>

        {/* Invoice Addresses */}
        <div className="grid grid-cols-2 gap-8 py-8 border-b border-slate-100 text-sm">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diterbitkan Oleh:</h3>
            <p className="font-bold text-slate-800">Mitra Abadi Jaya</p>
            <p className="text-slate-500 text-xs">Email: finance@mitraabadijaya.com</p>
            <p className="text-slate-500 text-xs">Telepon: +62 812-3456-7890</p>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ditujukan Kepada:</h3>
            <p className="font-bold text-slate-800">{invoice.clientName}</p>
            <p className="text-slate-500 text-xs">Kontak: {invoice.clientContact}</p>
          </div>
        </div>

        {/* Invoice Dates */}
        <div className="grid grid-cols-3 gap-4 py-6 bg-slate-50 rounded-xl px-6 my-6 text-xs font-medium">
          <div>
            <span className="block text-slate-400 uppercase font-bold tracking-wider mb-1">Tanggal Terbit</span>
            <span className="text-slate-800 font-bold">{invoice.issueDate}</span>
          </div>
          <div>
            <span className="block text-slate-400 uppercase font-bold tracking-wider mb-1">Tanggal Jatuh Tempo</span>
            <span className="text-slate-800 font-bold">{invoice.dueDate}</span>
          </div>
          <div className="text-right">
            <span className="block text-slate-400 uppercase font-bold tracking-wider mb-1">Status Pembayaran</span>
            <span className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
              invoice.status === "PAID"
                ? "bg-emerald-100 text-emerald-700"
                : invoice.status === "OVERDUE"
                ? "bg-rose-100 text-rose-700"
                : "bg-slate-200 text-slate-700"
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="my-8">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase text-left">
                <th className="pb-3">Deskripsi Pekerjaan / Layanan</th>
                <th className="pb-3 text-center w-24">Jumlah</th>
                <th className="pb-3 text-right w-36">Harga Satuan</th>
                <th className="pb-3 text-right w-36">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-4 text-slate-800 font-semibold">{invoice.notes || "Tagihan Layanan / Pengadaan"}</td>
                <td className="py-4 text-center text-slate-600 font-mono">1</td>
                <td className="py-4 text-right text-slate-600 font-mono">{formatRupiah(invoice.amount)}</td>
                <td className="py-4 text-right text-slate-900 font-bold font-mono">{formatRupiah(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-80 space-y-3 text-sm">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Subtotal:</span>
              <span className="font-mono">{formatRupiah(invoice.amount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Pajak (0%):</span>
              <span className="font-mono">Rp 0</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-lg pt-3 border-t border-slate-100">
              <span>Total Tagihan:</span>
              <span className="font-mono text-indigo-600">{formatRupiah(invoice.amount)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Payment Instructions & Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider">Instruksi Pembayaran:</h4>
            <p>Silakan lakukan transfer bank ke rekening berikut:</p>
            <p className="font-bold text-slate-800">Bank Central Asia (BCA)</p>
            <p className="font-bold text-slate-800 font-mono">No. Rekening: 123-456-7890</p>
            <p className="font-medium text-slate-700">Atas Nama: PT Mitra Abadi Jaya</p>
          </div>
          <div className="text-right flex flex-col justify-end space-y-1">
            <p className="font-bold text-slate-800">Terima kasih atas kerja sama Anda!</p>
            <p>Jika ada pertanyaan mengenai invoice ini, silakan hubungi finance@mitraabadijaya.com.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
