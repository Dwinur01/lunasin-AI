import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

// GET /api/invoices - List invoices with optional status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status") || "ALL"; // ALL, UNPAID, OVERDUE, PAID

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

    return NextResponse.json(filteredInvoices);
  } catch (error: any) {
    console.error("Failed to list invoices:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to list invoices.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, amount, issueDate, dueDate, notes } = body;

    if (!clientId || !amount || !issueDate || !dueDate) {
      return NextResponse.json({
        status: "error",
        message: "Missing required fields: clientId, amount, issueDate, dueDate are required."
      }, { status: 400 });
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

    return NextResponse.json({
      invoiceId,
      clientId,
      clientName,
      amount: Number(amount),
      status,
      issueDate,
      dueDate,
      notes: notes || "",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to create invoice.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
