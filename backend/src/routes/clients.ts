import express from "express";
import { dbService } from "../lib/dbService.js";

const router = express.Router();

// GET /api/clients - List all clients with their payment stats
router.get("/", async (req, res) => {
  try {
    const clients = await dbService.getClients();
    const invoices = await dbService.getInvoices();

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

    res.json(clientsWithStats);
  } catch (error: any) {
    console.error("Failed to list clients:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to list clients.",
      error: error.message || String(error),
    });
  }
});

// POST /api/clients - Create a new client
router.post("/", async (req, res) => {
  try {
    const { name, contactInfo } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "error",
        message: "Client name is required."
      });
    }

    const clientId = `c_${Date.now()}`;
    await dbService.addClient({ clientId, name, contactInfo: contactInfo || "" });

    res.status(201).json({
      clientId,
      name,
      contactInfo: contactInfo || "",
      totalInvoiced: 0,
      onTimeRate: 100,
      paymentHistory: []
    });
  } catch (error: any) {
    console.error("Failed to create client:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create client.",
      error: error.message || String(error),
    });
  }
});

export default router;
