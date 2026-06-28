import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

// GET /api/clients - List all clients with their payment stats
export async function GET() {
  try {
    // 1. Get all clients for this tenant
    const clients = await dbService.getClients();

    // 2. Get all invoices for this tenant to compute total invoiced per client
    const invoices = await dbService.getInvoices();

    // 3. For each client, fetch payment stats & history
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const clientId = client.SK.split("#")[1];

        // Filter invoices billed to this client
        const clientInvoices = invoices.filter((inv) => inv.clientId === clientId);
        const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Query payment history for this client
        const paymentHistory = await dbService.getPaymentHistory(clientId);

        const totalPayments = paymentHistory.length;
        const onTimePayments = paymentHistory.filter((pay) => !pay.wasLate).length;
        const onTimeRate = totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 100;

        return {
          clientId,
          name: client.name,
          contactInfo: client.contactInfo,
          totalInvoiced,
          onTimeRate,
          paymentHistory: paymentHistory.map((pay) => ({
            paymentId: pay.SK.split("#")[1],
            invoiceId: pay.invoiceId,
            paidDate: pay.paidDate,
            wasLate: pay.wasLate,
            daysLate: pay.daysLate,
          })),
        };
      })
    );

    return NextResponse.json(clientsWithStats);
  } catch (error: any) {
    console.error("Failed to list clients:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to list clients.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contactInfo } = body;

    if (!name) {
      return NextResponse.json({
        status: "error",
        message: "Client name is required."
      }, { status: 400 });
    }

    const clientId = `c_${Date.now()}`;
    await dbService.addClient({ clientId, name, contactInfo: contactInfo || "" });

    return NextResponse.json({
      clientId,
      name,
      contactInfo: contactInfo || "",
      totalInvoiced: 0,
      onTimeRate: 100,
      paymentHistory: []
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to create client.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
