import express from "express";
import { dbService } from "../lib/dbService.js";

const router = express.Router();

// GET /api/invoices - List invoices with optional status filter
router.get("/", async (req, res) => {
  try {
    const filterStatus = (req.query.status as string) || "ALL"; // ALL, UNPAID, OVERDUE, PAID
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch all invoices for the tenant
    const rawInvoices = await dbService.getInvoices();

    // 2. Fetch all clients to map name
    const clients = await dbService.getClients();
    const clientMap = new Map(clients.map((c) => [c.SK.split("#")[1], c.name]));

    // 3. Map and dynamically adjust status if UNPAID but past due date
    const invoicesWithClient = rawInvoices.map((inv) => {
      const invoiceId = inv.SK.split("#")[1];
      let status = inv.status;
      
      // Dynamic overdue check
      if (status === "UNPAID" && inv.dueDate < today) {
        status = "OVERDUE";
      }

      return {
        invoiceId,
        clientId: inv.clientId,
        clientName: clientMap.get(inv.clientId) || "Unknown Client",
        amount: inv.amount,
        status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        notes: inv.notes || "",
      };
    });

    // 4. Apply status filter
    const filteredInvoices = invoicesWithClient.filter((inv) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "UNPAID") return inv.status === "UNPAID";
      if (filterStatus === "OVERDUE") return inv.status === "OVERDUE";
      if (filterStatus === "PAID") return inv.status === "PAID";
      return true;
    });

    // Sort by due date descending (most urgent or recent first)
    filteredInvoices.sort((a, b) => b.dueDate.localeCompare(a.dueDate));

    res.json(filteredInvoices);
  } catch (error: any) {
    console.error("Failed to list invoices:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to list invoices.",
      error: error.message || String(error),
    });
  }
});

// POST /api/invoices - Create a new invoice
router.post("/", async (req, res) => {
  try {
    const { clientId, amount, issueDate, dueDate, notes } = req.body;

    if (!clientId || !amount || !issueDate || !dueDate) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: clientId, amount, issueDate, dueDate are required."
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const invoiceId = `inv_${Date.now()}`;
    
    // Determine initial status based on due date
    const status = dueDate < today ? "OVERDUE" : "UNPAID";

    await dbService.addInvoice({
      invoiceId,
      clientId,
      amount: Number(amount),
      status,
      issueDate,
      dueDate,
      notes: notes || "",
    });

    // Fetch client name for the response
    const client = await dbService.getClient(clientId);
    const clientName = client?.name || "Unknown Client";

    res.status(201).json({
      invoiceId,
      clientId,
      clientName,
      amount: Number(amount),
      status,
      issueDate,
      dueDate,
      notes: notes || "",
    });
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create invoice.",
      error: error.message || String(error),
    });
  }
});

// GET /api/invoices/:id - Get a single invoice details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const invoices = await dbService.getInvoices();
    const invoice = invoices.find((inv) => inv.SK === `INVOICE#${id}`);

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: `Invoice dengan ID '${id}' tidak ditemukan.`
      });
    }

    const client = await dbService.getClient(invoice.clientId);
    const today = new Date().toISOString().split("T")[0];
    let status = invoice.status;
    if (status === "UNPAID" && invoice.dueDate < today) {
      status = "OVERDUE";
    }

    res.json({
      invoiceId: id,
      clientId: invoice.clientId,
      clientName: client?.name || "Klien Tidak Diketahui",
      clientContact: client?.contactInfo || "Kontak belum diatur",
      amount: invoice.amount,
      status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes || "",
    });
  } catch (error: any) {
    console.error("Failed to get invoice:", error);
    res.status(500).json({
      status: "error",
      message: "Gagal memuat detail invoice.",
      error: error.message || String(error),
    });
  }
});

// PATCH /api/invoices/:id - Mark invoice as paid
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paidDate } = req.body;

    const today = new Date().toISOString().split("T")[0];
    const actualPaidDate = paidDate || today;

    // 1. Fetch all invoices to find ours (so we can calculate daysLate)
    const invoices = await dbService.getInvoices();
    const invoice = invoices.find((inv) => inv.SK === `INVOICE#${id}`);

    if (!invoice) {
      return res.status(404).json({
        status: "error",
        message: `Invoice with ID '${id}' not found.`
      });
    }

    if (invoice.status === "PAID") {
      return res.status(400).json({
        status: "error",
        message: "Invoice is already paid."
      });
    }

    // 2. Calculate payment delay stats
    const dueDate = invoice.dueDate;
    const isLate = actualPaidDate > dueDate;
    let daysLate = 0;

    if (isLate) {
      const dueTime = new Date(dueDate).getTime();
      const paidTime = new Date(actualPaidDate).getTime();
      const diffMs = paidTime - dueTime;
      daysLate = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // 3. Mark paid via dbService
    const result = await dbService.markInvoicePaid(id, actualPaidDate, isLate, daysLate);

    res.json({
      status: "success",
      message: "Invoice marked as paid successfully.",
      invoice: {
        invoiceId: id,
        clientId: result.invoice.clientId,
        amount: result.invoice.amount,
        status: "PAID",
        issueDate: result.invoice.issueDate,
        dueDate: result.invoice.dueDate,
        notes: result.invoice.notes || "",
      },
      paymentHistory: {
        paymentId: result.paymentHistory.SK.split("#")[1],
        invoiceId: id,
        clientId: result.invoice.clientId,
        paidDate: actualPaidDate,
        wasLate: isLate,
        daysLate,
      }
    });
  } catch (error: any) {
    console.error("Failed to mark invoice as paid:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark invoice as paid.",
      error: error.message || String(error),
    });
  }
});

export default router;
