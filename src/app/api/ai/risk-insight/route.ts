import { NextResponse } from "next/server";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "@/lib/dynamodb";

const tenantId = "default-tenant";

// Check if Gemini API key is valid and not a placeholder
function isGeminiKeyConfigured() {
  const key = process.env.GEMINI_API_KEY;
  return key && key.trim() !== "" && !key.includes("YOUR_") && !key.includes("placeholder");
}

export async function POST() {
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
      return NextResponse.json({ riskyClients: [] });
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
      return NextResponse.json({
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

      const resData = await apiResponse.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty content returned from Gemini API");
      }

      // 7. Parse structured response
      const riskyClients = JSON.parse(rawText.trim());

      return NextResponse.json({
        riskyClients,
        _aiGenerated: true
      });
    } catch (apiError: any) {
      console.error("Gemini API call failed, generating fallback:", apiError);
      return NextResponse.json({
        riskyClients: generateFallbackInsights(),
        _aiGenerated: false,
        _warning: "Gemini API call failed. Displaying local rule-based fallback insights.",
        _error: apiError.message || String(apiError)
      });
    }
  } catch (error: any) {
    console.error("Critical error in risk-insight API:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to generate risk insights.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
