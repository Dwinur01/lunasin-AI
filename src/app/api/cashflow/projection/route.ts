import { NextResponse } from "next/server";
import { dbService } from "@/lib/dbService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days") || "7";
    const days = parseInt(daysParam, 10);

    if (isNaN(days) || days <= 0) {
      return NextResponse.json({
        status: "error",
        message: "Invalid 'days' parameter. It must be a positive integer."
      }, { status: 400 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    // 1. Fetch all invoices
    const invoices = await dbService.getInvoices();

    // 2. Sum the amount of UNPAID invoices with due dates within the range
    let projectedIncome = 0;
    const includedInvoices: any[] = [];

    for (const inv of invoices) {
      const invoiceId = inv.SK.split("#")[1];
      
      // Dynamic status: if UNPAID but dueDate has passed, it's OVERDUE.
      // So it is UNPAID only if status is UNPAID and dueDate >= todayStr.
      const isUnpaid = inv.status === "UNPAID" && inv.dueDate >= todayStr;

      if (isUnpaid && inv.dueDate >= todayStr && inv.dueDate <= futureDateStr) {
        projectedIncome += Number(inv.amount || 0);
        includedInvoices.push({
          invoiceId,
          clientId: inv.clientId,
          amount: inv.amount,
          dueDate: inv.dueDate,
        });
      }
    }

    return NextResponse.json({
      projectedIncome,
      days,
      range: {
        start: todayStr,
        end: futureDateStr,
      },
      invoiceCount: includedInvoices.length,
      invoices: includedInvoices,
    });
  } catch (error: any) {
    console.error("Failed to project cashflow:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to project cashflow.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
