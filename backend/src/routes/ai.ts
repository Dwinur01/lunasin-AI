import express from "express";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb.js";

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

// New Endpoint: Parse Natural Language to Invoice Data
router.post("/parse-invoice", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ status: "error", message: "Text parameter is required." });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 1. Fetch all clients to provide as matching context
    const clientsQuery = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `TENANT#${tenantId}`,
        ":skPrefix": "CLIENT#",
      },
    });
    const clientsResult = await docClient.send(clientsQuery);
    const clientsList = (clientsResult.Items || []).map((c) => ({
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

export default router;

