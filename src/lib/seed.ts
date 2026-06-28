import { dbService } from "./dbService";
import { 
  dummyClients, 
  dummyInvoices, 
  dummyPaymentHistories 
} from "./seed";

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
export { dummyClients, dummyInvoices, dummyPaymentHistories };
