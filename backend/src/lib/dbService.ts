import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { QueryCommand, PutCommand, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "./dynamodb.js";

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.join(__dirname, "local_db.json");

// Helper to check if AWS DynamoDB credentials are set
export function isAWSConfigured(): boolean {
  const key = process.env.AWS_ACCESS_KEY_ID;
  const secret = process.env.AWS_SECRET_ACCESS_KEY;
  return !!(key && secret && !key.includes("YOUR_") && !secret.includes("YOUR_"));
}

// Read all items from local JSON file
function readLocalDb(): any[] {
  try {
    if (!fs.existsSync(localDbPath)) {
      return [];
    }
    const data = fs.readFileSync(localDbPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading local JSON database:", error);
    return [];
  }
}

// Write items to local JSON file
function writeLocalDb(items: any[]): void {
  try {
    const dir = path.dirname(localDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(localDbPath, JSON.stringify(items, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to local JSON database:", error);
  }
}

// Global DB Service
export const dbService = {
  // 1. Get all clients
  async getClients(tenantId: string = "default-tenant") {
    if (isAWSConfigured()) {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${tenantId}`,
          ":skPrefix": "CLIENT#",
        },
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } else {
      const items = readLocalDb();
      return items.filter(
        (item) => item.PK === `TENANT#${tenantId}` && item.SK.startsWith("CLIENT#")
      );
    }
  },

  // 2. Add a client
  async addClient(client: { clientId: string; name: string; contactInfo: string }, tenantId: string = "default-tenant") {
    const item = {
      PK: `TENANT#${tenantId}`,
      SK: `CLIENT#${client.clientId}`,
      name: client.name,
      contactInfo: client.contactInfo,
    };

    if (isAWSConfigured()) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );
    } else {
      const items = readLocalDb();
      items.push(item);
      writeLocalDb(items);
    }
    return item;
  },

  // 3. Get all invoices
  async getInvoices(tenantId: string = "default-tenant") {
    if (isAWSConfigured()) {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `TENANT#${tenantId}`,
          ":skPrefix": "INVOICE#",
        },
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } else {
      const items = readLocalDb();
      return items.filter(
        (item) => item.PK === `TENANT#${tenantId}` && item.SK.startsWith("INVOICE#")
      );
    }
  },

  // 4. Add an invoice
  async addInvoice(
    invoice: {
      invoiceId: string;
      clientId: string;
      amount: number;
      status: string;
      issueDate: string;
      dueDate: string;
      notes: string;
    },
    tenantId: string = "default-tenant"
  ) {
    const item = {
      PK: `TENANT#${tenantId}`,
      SK: `INVOICE#${invoice.invoiceId}`,
      clientId: invoice.clientId,
      amount: invoice.amount,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      GSI1PK: `TENANT#${tenantId}`,
      GSI1SK: `DUEDATE#${invoice.dueDate}#INVOICE#${invoice.invoiceId}`,
    };

    if (isAWSConfigured()) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );
    } else {
      const items = readLocalDb();
      items.push(item);
      writeLocalDb(items);
    }
    return item;
  },

  // 5. Get client details
  async getClient(clientId: string, tenantId: string = "default-tenant") {
    if (isAWSConfigured()) {
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TENANT#${tenantId}`,
          SK: `CLIENT#${clientId}`,
        },
      });
      const result = await docClient.send(command);
      return result.Item;
    } else {
      const items = readLocalDb();
      return items.find(
        (item) => item.PK === `TENANT#${tenantId}` && item.SK === `CLIENT#${clientId}`
      );
    }
  },

  // 6. Mark invoice as paid and add payment history
  async markInvoicePaid(
    invoiceId: string,
    paidDate: string,
    wasLate: boolean,
    daysLate: number,
    tenantId: string = "default-tenant"
  ) {
    // A. Fetch invoice first
    let invoice: any = null;

    if (isAWSConfigured()) {
      const getCommand = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `TENANT#${tenantId}`,
          SK: `INVOICE#${invoiceId}`,
        },
      });
      const res = await docClient.send(getCommand);
      invoice = res.Item;
    } else {
      const items = readLocalDb();
      invoice = items.find(
        (item) => item.PK === `TENANT#${tenantId}` && item.SK === `INVOICE#${invoiceId}`
      );
    }

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // B. Update Invoice Status to PAID
    if (isAWSConfigured()) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `TENANT#${tenantId}`,
            SK: `INVOICE#${invoiceId}`,
          },
          UpdateExpression: "SET #status = :status",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":status": "PAID" },
        })
      );
    } else {
      const items = readLocalDb();
      const idx = items.findIndex(
        (item) => item.PK === `TENANT#${tenantId}` && item.SK === `INVOICE#${invoiceId}`
      );
      if (idx !== -1) {
        items[idx].status = "PAID";
        writeLocalDb(items);
      }
    }

    // C. Add Payment History Item
    const paymentItem = {
      PK: `CLIENT#${invoice.clientId}`,
      SK: `PAYMENT#p_${invoiceId}`,
      invoiceId: invoiceId,
      paidDate: paidDate,
      wasLate: wasLate,
      daysLate: daysLate,
    };

    if (isAWSConfigured()) {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: paymentItem,
        })
      );
    } else {
      const items = readLocalDb();
      items.push(paymentItem);
      writeLocalDb(items);
    }

    return {
      invoice: { ...invoice, status: "PAID" },
      paymentHistory: paymentItem,
    };
  },

  // 7. Get client payment history
  async getPaymentHistory(clientId: string) {
    if (isAWSConfigured()) {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `CLIENT#${clientId}`,
          ":skPrefix": "PAYMENT#",
        },
      });
      const result = await docClient.send(command);
      return result.Items || [];
    } else {
      const items = readLocalDb();
      return items.filter(
        (item) => item.PK === `CLIENT#${clientId}` && item.SK.startsWith("PAYMENT#")
      );
    }
  },

  // 8. Seed database
  async seed(clients: any[], invoices: any[], payments: any[], tenantId: string = "default-tenant") {
    if (isAWSConfigured()) {
      // Seed to AWS
      for (const client of clients) {
        await this.addClient(client, tenantId);
      }
      for (const invoice of invoices) {
        await this.addInvoice(invoice, tenantId);
      }
      for (const payment of payments) {
        const putParams = {
          TableName: TABLE_NAME,
          Item: {
            PK: `CLIENT#${payment.clientId}`,
            SK: `PAYMENT#${payment.paymentId}`,
            invoiceId: payment.invoiceId,
            paidDate: payment.paidDate,
            wasLate: payment.wasLate,
            daysLate: payment.daysLate,
          },
        };
        await docClient.send(new PutCommand(putParams));
      }
    } else {
      // Seed locally (overwrite JSON db)
      const localItems: any[] = [];
      clients.forEach((c) => {
        localItems.push({
          PK: `TENANT#${tenantId}`,
          SK: `CLIENT#${c.clientId}`,
          name: c.name,
          contactInfo: c.contactInfo,
        });
      });
      invoices.forEach((i) => {
        localItems.push({
          PK: `TENANT#${tenantId}`,
          SK: `INVOICE#${i.invoiceId}`,
          clientId: i.clientId,
          amount: i.amount,
          status: i.status,
          issueDate: i.issueDate,
          dueDate: i.dueDate,
          notes: i.notes || "",
          GSI1PK: `TENANT#${tenantId}`,
          GSI1SK: `DUEDATE#${i.dueDate}#INVOICE#${i.invoiceId}`,
        });
      });
      payments.forEach((p) => {
        localItems.push({
          PK: `CLIENT#${p.clientId}`,
          SK: `PAYMENT#${p.paymentId}`,
          invoiceId: p.invoiceId,
          paidDate: p.paidDate,
          wasLate: p.wasLate,
          daysLate: p.daysLate,
        });
      });
      writeLocalDb(localItems);
    }
  },
};
