import { dbService } from "./dbService.js";

export const dummyClients = [
  { clientId: "c1", name: "CV Abadi Jaya", contactInfo: "abadi.jaya@mail.com" },
  { clientId: "c2", name: "PT Maju Bersama", contactInfo: "contact@majubersama.co.id" },
  { clientId: "c3", name: "Toko Berkah Mandiri", contactInfo: "berkah.mandiri@gmail.com" },
  { clientId: "c4", name: "PT Indo Supply", contactInfo: "finance@indosupply.com" },
  { clientId: "c5", name: "Sinar Surya Agency", contactInfo: "sinarsurya.agency@mail.com" }
];

export const dummyInvoices = [
  { invoiceId: "inv1", clientId: "c1", amount: 15000000, status: "PAID", issueDate: "2026-06-01", dueDate: "2026-06-15", notes: "Layanan IT Support Juni" },
  { invoiceId: "inv2", clientId: "c1", amount: 12500000, status: "UNPAID", issueDate: "2026-06-20", dueDate: "2026-07-05", notes: "Layanan IT Support Juli" },
  { invoiceId: "inv3", clientId: "c2", amount: 25000000, status: "PAID", issueDate: "2026-05-01", dueDate: "2026-05-15", notes: "Supply Bahan Baku Kloter 1" },
  { invoiceId: "inv4", clientId: "c2", amount: 25000000, status: "PAID", issueDate: "2026-05-20", dueDate: "2026-06-05", notes: "Supply Bahan Baku Kloter 2" },
  { invoiceId: "inv5", clientId: "c2", amount: 35000000, status: "OVERDUE", issueDate: "2026-06-01", dueDate: "2026-06-15", notes: "Supply Bahan Baku Kloter 3" },
  { invoiceId: "inv6", clientId: "c3", amount: 8000000, status: "PAID", issueDate: "2026-05-10", dueDate: "2026-05-24", notes: "Pembelian Inventaris" },
  { invoiceId: "inv7", clientId: "c3", amount: 9500000, status: "PAID", issueDate: "2026-06-05", dueDate: "2026-06-19", notes: "Servis Mesin Produksi" },
  { invoiceId: "inv8", clientId: "c3", amount: 12000000, status: "UNPAID", issueDate: "2026-06-25", dueDate: "2026-07-09", notes: "Sewa Peralatan Tambahan" },
  { invoiceId: "inv9", clientId: "c4", amount: 18000000, status: "PAID", issueDate: "2026-06-10", dueDate: "2026-06-24", notes: "Pengiriman Spareparts A" },
  { invoiceId: "inv10", clientId: "c4", amount: 22000000, status: "UNPAID", issueDate: "2026-06-20", dueDate: "2026-07-02", notes: "Pengiriman Spareparts B" },
  { invoiceId: "inv11", clientId: "c5", amount: 5000000, status: "UNPAID", issueDate: "2026-06-22", dueDate: "2026-07-07", notes: "Desain Konten Sosmed Juni" }
];

export const dummyPaymentHistories = [
  { paymentId: "p1", clientId: "c1", invoiceId: "inv1", paidDate: "2026-06-14", wasLate: false, daysLate: 0 },
  { paymentId: "p2", clientId: "c2", invoiceId: "inv3", paidDate: "2026-05-25", wasLate: true, daysLate: 10 },
  { paymentId: "p3", clientId: "c2", invoiceId: "inv4", paidDate: "2026-06-22", wasLate: true, daysLate: 17 },
  { paymentId: "p4", clientId: "c3", invoiceId: "inv6", paidDate: "2026-05-24", wasLate: false, daysLate: 0 },
  { paymentId: "p5", clientId: "c3", invoiceId: "inv7", paidDate: "2026-06-25", wasLate: true, daysLate: 6 },
  { paymentId: "p6", clientId: "c4", invoiceId: "inv9", paidDate: "2026-06-23", wasLate: false, daysLate: 0 }
];

export async function runSeeding() {
  console.log("Starting database seeding via dbService...");
  
  await dbService.seed(
    dummyClients,
    dummyInvoices,
    dummyPaymentHistories
  );

  console.log("Database seeded successfully!");
  return {
    clientsSeeded: dummyClients.length,
    invoicesSeeded: dummyInvoices.length,
    paymentsSeeded: dummyPaymentHistories.length,
  };
}
