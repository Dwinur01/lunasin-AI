import express from "express";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb.js";
import { dbService } from "../lib/dbService.js";

const router = express.Router();
const tenantId = "default-tenant";

// Check if Gemini API key is valid and not a placeholder
function isGeminiKeyConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim() !== "" && !key.includes("YOUR_") && !key.includes("placeholder");
}

router.post("/risk-insight", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch all clients for the tenant
    const clientsQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `TENANT#${tenantId}`,
        ":skPrefix": "CLIENT#",
      },
    });

    const clientsResult = await docClient.send(clientsQuery);
    const clients = clientsResult.Items || [];

    if (clients.length === 0) {
      return res.json({ riskyClients: [] });
    }

    // 2. Fetch all invoices for the tenant to count overdue
    const invoicesQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `TENANT#${tenantId}`,
        ":skPrefix": "INVOICE#",
      },
    });
    const invoicesResult = await docClient.send(invoicesQuery);
    const invoices = invoicesResult.Items || [];

    // 3. Compile payment history summary for each client
    const clientHistorySummary = await Promise.all(
      clients.map(async (client) => {
        const clientId = client.SK.split("#")[1];

        // Filter invoices for this client
        const clientInvoices = invoices.filter((i) => i.clientId === clientId);
        
        // Active overdue invoices
        const activeOverdue = clientInvoices.filter(
          (i) => i.status === "OVERDUE" || (i.status === "UNPAID" && i.dueDate < today)
        );

        // Fetch payment history records
        const paymentsQuery = new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
          ExpressionAttributeValues: {
            ":pk": `CLIENT#${clientId}`,
            ":skPrefix": "PAYMENT#",
          },
        });

        const paymentsResult = await docClient.send(paymentsQuery);
        const payments = paymentsResult.Items || [];

        const totalPayments = payments.length;
        const latePayments = payments.filter((p) => p.wasLate);
        const onTimePayments = totalPayments - latePayments.length;
        const avgDaysLate = latePayments.length > 0
          ? Math.round(latePayments.reduce((sum, p) => sum + (p.daysLate || 0), 0) / latePayments.length)
          : 0;

        return {
          clientId,
          name: client.name,
          totalInvoicesBilled: clientInvoices.length,
          totalPaymentsMade: totalPayments,
          onTimePaymentsCount: onTimePayments,
          latePaymentsCount: latePayments.length,
          avgDaysLate,
          activeOverdueInvoicesCount: activeOverdue.length,
          recentDaysLateHistory: payments.map((p) => ({
            invoiceId: p.invoiceId,
            paidDate: p.paidDate,
            wasLate: p.wasLate,
            daysLate: p.daysLate
          }))
        };
      })
    );

    // Rule-based Fallback Generator (if Gemini is not configured or fails)
    const generateFallbackInsights = () => {
      console.log("Generating credit risk insights via local rule-based fallback...");
      const risky = [];
      for (const summary of clientHistorySummary) {
        if (summary.activeOverdueInvoicesCount > 0) {
          risky.push({
            clientId: summary.clientId,
            name: summary.name,
            riskLevel: "high",
            reason: `Klien memiliki ${summary.activeOverdueInvoicesCount} invoice overdue yang belum diselesaikan.`,
          });
        } else if (summary.latePaymentsCount > 0) {
          const riskLevel = summary.latePaymentsCount >= 2 || summary.avgDaysLate > 10 ? "medium" : "low";
          risky.push({
            clientId: summary.clientId,
            name: summary.name,
            riskLevel,
            reason: `Riwayat pembayaran terlambat sebanyak ${summary.latePaymentsCount} kali dengan rata-rata keterlambatan ${summary.avgDaysLate} hari.`,
          });
        }
      }
      return risky;
    };

    // 4. Check if Gemini API is configured
    if (!isGeminiKeyConfigured()) {
      return res.json({
        riskyClients: generateFallbackInsights(),
        _aiGenerated: false,
        _warning: "Gemini API Key is not configured. Displaying local rule-based fallback insights."
      });
    }

    // 5. Build prompt for Gemini API
    const systemPrompt = `Kamu adalah analis kredit untuk UMKM. Berdasarkan data histori pembayaran klien berikut, identifikasi klien yang berisiko terlambat bayar invoice berikutnya. Jawab singkat, maksimal 2 kalimat per klien, sertakan alasan berbasis data (jangan mengada-ada).

Format output harus berupa JSON saja seperti struktur berikut:
[{"clientId": "...", "name": "...", "riskLevel": "high|medium|low", "reason": "..."}]`;

    const userPrompt = `Data klien (JSON):
${JSON.stringify(clientHistorySummary, null, 2)}`;

    try {
      // 6. Call Gemini 1.5 Flash API
      const apiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\n${userPrompt}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`Gemini API returned status ${apiResponse.status}: ${errorBody}`);
      }

      const resData = (await apiResponse.json()) as any;
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty content returned from Gemini API");
      }

      // 7. Parse structured response
      const riskyClients = JSON.parse(rawText.trim());

      res.json({
        riskyClients,
        _aiGenerated: true
      });
    } catch (apiError: any) {
      console.error("Gemini API call failed, generating fallback:", apiError);
      res.json({
        riskyClients: generateFallbackInsights(),
        _aiGenerated: false,
        _warning: "Gemini API call failed. Displaying local rule-based fallback insights.",
        _error: apiError.message || String(apiError)
      });
    }
  } catch (error: any) {
    console.error("Critical error in risk-insight API:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to generate risk insights.",
      error: error.message || String(error),
    });
  }
});

// New Endpoint: AI Financial Advisory
router.post("/financial-advisory", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch invoices and clients to build context
    const invoices = await dbService.getInvoices();
    const clients = await dbService.getClients();

    const totalOutstanding = invoices
      .filter((inv: any) => inv.status === "UNPAID" || (inv.status === "UNPAID" && inv.dueDate < today))
      .reduce((sum: number, inv: any) => sum + inv.amount, 0);

    const overdueInvoices = invoices.filter(
      (inv: any) => inv.status === "OVERDUE" || (inv.status === "UNPAID" && inv.dueDate < today)
    );
    const totalOverdue = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);

    // Get risky clients (simple calculation)
    interface RiskyClientItem {
      name: string;
      overdueCount: number;
      overdueAmount: number;
    }
    
    const riskyClientsList: RiskyClientItem[] = [];
    for (const client of clients) {
      const clientId = client.SK.split("#")[1];
      const clientInvoices = invoices.filter((i: any) => i.clientId === clientId);
      const overdue = clientInvoices.filter((i: any) => i.status === "OVERDUE" || (i.status === "UNPAID" && i.dueDate < today));
      if (overdue.length > 0) {
        riskyClientsList.push({
          name: client.name,
          overdueCount: overdue.length,
          overdueAmount: overdue.reduce((sum: number, i: any) => sum + i.amount, 0),
        });
      }
    }

    const generateLocalAdvisoryFallback = () => {
      console.log("Generating local rule-based financial advisory fallback...");
      const tips = [];
      if (totalOverdue > 0) {
        tips.push(
          `Anda memiliki tagihan overdue sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totalOverdue)}. Prioritaskan pengiriman pengingat WhatsApp kepada klien terkait hari ini.`
        );
      } else {
        tips.push("Arus kas Anda saat ini sangat sehat tanpa adanya tagihan yang terlambat bayar (overdue). Pertahankan ritme penagihan ini!");
      }

      if (riskyClientsList.length > 0) {
        const topRisky = riskyClientsList.sort((a: RiskyClientItem, b: RiskyClientItem) => b.overdueAmount - a.overdueAmount)[0];
        tips.push(
          `Klien ${topRisky.name} memiliki tunggakan terbesar senilai ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(topRisky.overdueAmount)}. Disarankan untuk menangguhkan layanan baru bagi klien ini sementara waktu.`
        );
      } else {
        tips.push("Seluruh klien Anda saat ini memiliki reputasi kredit yang baik. Anda dapat mempertimbangkan opsi ekspansi bisnis atau memberikan tenor lebih longgar bagi klien loyal.");
      }

      tips.push("Lakukan review kas mingguan setiap hari Jumat untuk memastikan proyeksi arus kas 7 hari ke depan selalu terpenuhi guna menjaga likuiditas operasional.");
      return tips;
    };

    if (!isGeminiKeyConfigured()) {
      return res.json({
        recommendations: generateLocalAdvisoryFallback(),
        _aiGenerated: false,
        _warning: "Gemini API Key is not configured. Displaying local rule-based financial advisory."
      });
    }

    const systemPrompt = `Kamu adalah konsultan keuangan profesional khusus untuk UMKM Indonesia. Analisis ringkasan kesehatan keuangan usaha berikut dan berikan TEPAT 3 rekomendasi bisnis/tindakan taktis keuangan dalam Bahasa Indonesia.
Setiap rekomendasi harus sangat spesifik, langsung pada inti masalah, dan ditulis maksimal 2 kalimat. Jangan gunakan poin penomoran di dalam teks rekomendasi itu sendiri, cukup kembalikan dalam format JSON array berisi 3 string.

Format output wajib berupa JSON array:
["rekomendasi 1", "rekomendasi 2", "rekomendasi 3"]`;

    const userPrompt = `Data Keuangan Usaha:
- Total Piutang Aktif: ${totalOutstanding}
- Total Tagihan Terlambat (Overdue): ${totalOverdue}
- Jumlah Invoice Overdue: ${overdueInvoices.length}
- Klien Menunggak: ${JSON.stringify(riskyClientsList)}`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini API status ${apiResponse.status}`);
      }

      const resData = (await apiResponse.json()) as any;
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response from Gemini");
      }

      const recommendations = JSON.parse(rawText.trim());

      res.json({
        recommendations,
        _aiGenerated: true
      });
    } catch (apiError) {
      console.error("Gemini financial advisory failed, using fallback:", apiError);
      res.json({
        recommendations: generateLocalAdvisoryFallback(),
        _aiGenerated: false,
        _warning: "Gemini API call failed. Using local rule-based advisory."
      });
    }
  } catch (error: any) {
    console.error("Critical error in financial-advisory API:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal menyusun rekomendasi keuangan.",
      error: error.message || String(error),
    });
  }
});

// New Endpoint: Parse Natural Language to Invoice Data
router.post("/parse-invoice", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ status: "error", message: "Text parameter is required." });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 1. Fetch all clients using dbService (supports AWS & local fallback automatically!)
    const rawClients = await dbService.getClients(tenantId);
    const clientsList = rawClients.map((c: any) => ({
      clientId: c.SK.split("#")[1],
      name: c.name,
    }));

    // Rule-based Fallback Parser (in case Gemini is not configured or fails)
    const runLocalFallbackParser = () => {
      console.log("Running local regex-based invoice parser fallback...");
      const textLower = text.toLowerCase();
      
      // Try to find amount (e.g. "12.000.000", "15 juta", "10jt")
      let amount = 0;
      const millionMatch = textLower.match(/(\d+)\s*(juta|jt)/);
      if (millionMatch) {
        amount = parseInt(millionMatch[1]) * 1000000;
      } else {
        const numberMatch = textLower.match(/[\d.]+/g);
        if (numberMatch) {
          // Find the longest number string that might represent the amount
          const numbers = numberMatch
            .map((n: string) => n.replace(/\./g, ""))
            .filter((n: string) => n.length >= 4)
            .map((n: string) => parseInt(n));
          if (numbers.length > 0) {
            amount = Math.max(...numbers);
          }
        }
      }

      // Try to match client name
      let matchedClientId = "";
      let matchedClientName = "";
      for (const client of clientsList) {
        if (textLower.includes(client.name.toLowerCase())) {
          matchedClientId = client.clientId;
          matchedClientName = client.name;
          break;
        }
      }

      if (!matchedClientName) {
        // Simple extraction for new client name (e.g. "tagih PT ABC", "ke CV XYZ")
        const newClientMatch = text.match(/(tagih|ke|untuk)\s+([A-Z\d\s.a-z]{3,30})/);
        matchedClientName = newClientMatch ? newClientMatch[2].trim() : "Klien Baru";
      }

      // Estimate due date (default to today + 14 days)
      const defaultDueDate = new Date();
      defaultDueDate.setDate(today.getDate() + 14);
      const dueDateStr = defaultDueDate.toISOString().split("T")[0];

      return {
        clientId: matchedClientId,
        clientName: matchedClientName,
        amount,
        dueDate: dueDateStr,
        notes: "Tagihan otomatis dari input teks",
      };
    };

    // 2. Check if Gemini is configured
    if (!isGeminiKeyConfigured()) {
      return res.json({
        data: runLocalFallbackParser(),
        _aiGenerated: false,
        _warning: "Gemini API Key is not configured. Using local regex parser."
      });
    }

    // 3. Prompt for Gemini
    const systemPrompt = `Kamu adalah AI pengolah tagihan UMKM. Tugasmu adalah mengekstrak informasi invoice dari teks bahasa alami yang ditulis pengguna dan merubahnya menjadi JSON terstruktur.
Hari ini adalah tanggal: ${todayStr} (Gunakan tanggal ini sebagai basis perhitungan tanggal jatuh tempo relatif seperti "2 minggu lagi" atau "bulan depan").

Daftar klien terdaftar saat ini:
${JSON.stringify(clientsList, null, 2)}

Aturan ekstraksi:
1. Tentukan "clientId" dengan mencocokkan nama klien di dalam teks dengan nama klien terdaftar yang paling mirip. Jika tidak ada yang mirip atau merupakan klien baru, isi "clientId" dengan string kosong "".
2. Isi "clientName" dengan nama klien yang berhasil diekstrak dari teks.
3. Ekstrak nominal uang ke "amount" dalam bentuk angka murni (misal: "12 juta" -> 12000000).
4. Hitung tanggal jatuh tempo ke "dueDate" dalam format "YYYY-MM-DD". Jika tidak disebutkan tenggat waktunya, default-kan ke 14 hari dari hari ini (${todayStr}).
5. Ekstrak deskripsi pekerjaan/barang ke "notes" (misal: "jasa pembuatan website" atau "bahan baku kayu"). Jika tidak ada, isi "Tagihan invoice".

Format output harus berupa JSON saja seperti berikut:
{
  "clientId": "string atau kosong",
  "clientName": "string",
  "amount": number,
  "dueDate": "YYYY-MM-DD",
  "notes": "string"
}`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nInput Teks Pengguna: "${text}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini API returned status ${apiResponse.status}`);
      }

      const resData = (await apiResponse.json()) as any;
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response from Gemini");
      }

      const parsedData = JSON.parse(rawText.trim());

      res.json({
        data: parsedData,
        _aiGenerated: true
      });
    } catch (apiError) {
      console.error("Gemini API parsing failed, using fallback:", apiError);
      res.json({
        data: runLocalFallbackParser(),
        _aiGenerated: false,
        _warning: "Gemini parsing failed. Using local regex parser."
      });
    }
  } catch (error: any) {
    console.error("Critical error in parse-invoice API:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to parse invoice text.",
      error: error.message || String(error),
    });
  }
});

// New Endpoint: AI Payment Receipt Verification (Vision OCR)
router.post("/verify-receipt", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ status: "error", message: "Image data is required." });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Fetch all unpaid/overdue invoices to match against
    const invoices = await dbService.getInvoices();
    const clients = await dbService.getClients();
    const clientMap = new Map(clients.map((c) => [c.SK.split("#")[1], c.name]));
    
    const unpaidInvoices = invoices
      .filter((inv) => inv.status === "UNPAID" || inv.status === "OVERDUE" || (inv.status === "UNPAID" && inv.dueDate < todayStr))
      .map((inv) => ({
        invoiceId: inv.SK.split("#")[1],
        clientId: inv.clientId,
        clientName: clientMap.get(inv.clientId) || "Unknown",
        amount: inv.amount,
        dueDate: inv.dueDate,
      }));

    const runLocalFallbackReceiptVerify = () => {
      console.log("Running local receipt verification fallback...");
      if (unpaidInvoices.length > 0) {
        const mockInv = unpaidInvoices[0];
        return {
          parsedData: {
            senderName: mockInv.clientName,
            bankName: "BCA",
            amount: mockInv.amount,
            transferDate: todayStr,
            invoiceId: mockInv.invoiceId,
          },
          matchedInvoice: mockInv,
        };
      }
      return {
        parsedData: {
          senderName: "CV Abadi Jaya",
          bankName: "BCA",
          amount: 15000000,
          transferDate: todayStr,
          invoiceId: "inv_1",
        },
        matchedInvoice: null,
      };
    };

    if (!isGeminiKeyConfigured()) {
      return res.json({
        result: runLocalFallbackReceiptVerify(),
        _aiGenerated: false,
        _warning: "Gemini API Key is not configured. Using local simulated verification."
      });
    }

    const systemPrompt = `Kamu adalah AI verifikator bukti transfer bank. Tugasmu adalah menganalisis gambar bukti transfer yang diberikan dan mengekstrak data penting menjadi JSON terstruktur.
Ekstrak fields berikut:
- "senderName": Nama pengirim/pemilik rekening pengirim (string).
- "bankName": Nama bank asal/tujuan (string, misal "BCA", "Mandiri", "BRI").
- "amount": Nominal dana yang ditransfer (number murni, tanpa titik/koma/Rp).
- "transferDate": Tanggal transfer (string, format YYYY-MM-DD).
- "invoiceId": Jika tertulis nomor invoice/tagihan di berita acara/keterangan transfer, ekstraksi ke field ini. Jika tidak ada, kosongkan "".

Format output harus berupa JSON saja:
{
  "senderName": "string",
  "bankName": "string",
  "amount": number,
  "transferDate": "YYYY-MM-DD",
  "invoiceId": "string"
}`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini Vision API status ${apiResponse.status}`);
      }

      const resData = (await apiResponse.json()) as any;
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response from Gemini Vision");
      }

      const parsedData = JSON.parse(rawText.trim());

      // Match the parsed data with our unpaid invoices
      let matchedInvoice = null;
      if (parsedData.invoiceId) {
        matchedInvoice = unpaidInvoices.find(
          (inv) => inv.invoiceId.toLowerCase() === parsedData.invoiceId.toLowerCase()
        ) || null;
      }

      if (!matchedInvoice && parsedData.amount) {
        const amountMatches = unpaidInvoices.filter((inv) => inv.amount === parsedData.amount);
        if (amountMatches.length === 1) {
          matchedInvoice = amountMatches[0];
        } else if (amountMatches.length > 1 && parsedData.senderName) {
          const senderLower = parsedData.senderName.toLowerCase();
          matchedInvoice = amountMatches.find(
            (inv) => senderLower.includes(inv.clientName.toLowerCase()) || inv.clientName.toLowerCase().includes(senderLower)
          ) || amountMatches[0];
        }
      }

      res.json({
        result: {
          parsedData,
          matchedInvoice,
        },
        _aiGenerated: true
      });
    } catch (apiError) {
      console.error("Gemini Vision API call failed, using fallback:", apiError);
      res.json({
        result: runLocalFallbackReceiptVerify(),
        _aiGenerated: false,
        _warning: "Gemini Vision API call failed. Using local simulated verification."
      });
    }
  } catch (error: any) {
    console.error("Critical error in verify-receipt API:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal memproses verifikasi bukti transfer.",
      error: error.message || String(error),
    });
  }
});

// New Endpoint: AI Email Billing Draft Generator
router.post("/billing-email", async (req, res) => {
  try {
    const { invoiceId, clientName, amount, dueDate, status } = req.body;
    if (!invoiceId || !clientName || !amount || !dueDate) {
      return res.status(400).json({ status: "error", message: "Missing required fields: invoiceId, clientName, amount, dueDate are required." });
    }

    const isOverdue = status === "OVERDUE";
    
    const generateLocalEmailFallback = () => {
      return {
        subject: `Pemberitahuan Tagihan Pembayaran - Invoice #${invoiceId}`,
        body: `Kepada Yth. Pimpinan ${clientName},\n\nSemoga Bapak/Ibu dalam keadaan sehat walafiat.\n\nMelalui email ini, kami ingin menyampaikan pemberitahuan mengenai tagihan Anda untuk Invoice #${invoiceId} sebesar ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)} yang ${isOverdue ? "telah melewati tanggal jatuh tempo pada" : "akan jatuh tempo pada"} ${dueDate}.\n\nPembayaran dapat ditransfer ke rekening perusahaan kami di:\n- Bank: BCA\n- No. Rekening: 123-456-7890\n- Atas Nama: PT Mitra Abadi Jaya\n\nMohon mengirimkan bukti transfer setelah pembayaran dilakukan. Jika Anda telah menyelesaikan pembayaran, mohon abaikan email ini.\n\nTerima kasih atas perhatian dan kerja samanya.\n\nHormat kami,\nDepartemen Keuangan\nPT Mitra Abadi Jaya`
      };
    };

    if (!isGeminiKeyConfigured()) {
      return res.json({
        email: generateLocalEmailFallback(),
        _aiGenerated: false,
        _warning: "Gemini API Key is not configured. Using local email template."
      });
    }

    const systemPrompt = `Kamu adalah perwakilan Departemen Keuangan profesional di PT Mitra Abadi Jaya. Buatlah draf email penagihan pembayaran yang sangat sopan, formal, dan profesional dalam Bahasa Indonesia untuk klien kami.
Sesuaikan nada bicara:
- Jika tagihan sudah terlambat (OVERDUE): Buat email pengingat yang sopan namun tegas.
- Jika tagihan belum jatuh tempo (UNPAID): Buat email pengingat awal yang bersahabat dan profesional.

Format output wajib berupa JSON dengan fields:
{
  "subject": "Subjek email",
  "body": "Isi email (gunakan \\n untuk baris baru)"
}`;

    const userPrompt = `Detail Tagihan:
- Invoice ID: ${invoiceId}
- Nama Klien: ${clientName}
- Nominal: ${amount}
- Tanggal Jatuh Tempo: ${dueDate}
- Status: ${status}`;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const apiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini API status ${apiResponse.status}`);
      }

      const resData = (await apiResponse.json()) as any;
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response from Gemini");
      }

      const email = JSON.parse(rawText.trim());
      res.json({
        email,
        _aiGenerated: true
      });
    } catch (apiError) {
      console.error("Gemini email generation failed, using fallback:", apiError);
      res.json({
        email: generateLocalEmailFallback(),
        _aiGenerated: false,
        _warning: "Gemini API call failed. Using local email template."
      });
    }
  } catch (error: any) {
    console.error("Critical error in billing-email API:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal menyusun draf email penagihan.",
      error: error.message || String(error),
    });
  }
});

export default router;

