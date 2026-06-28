import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { paidDate } = body;

    const today = new Date().toISOString().split("T")[0];
    const actualPaidDate = paidDate || today;

    // 1. Fetch all invoices to find ours (so we can calculate daysLate)
    const invoices = await dbService.getInvoices();
    const invoice = invoices.find((inv) => inv.SK === `INVOICE#${id}`);

    if (!invoice) {
      return NextResponse.json({
        status: "error",
        message: `Invoice with ID '${id}' not found.`
      }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({
        status: "error",
        message: "Invoice is already paid."
      }, { status: 400 });
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

    return NextResponse.json({
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
    return NextResponse.json({
      status: "error",
      message: "Failed to mark invoice as paid.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
