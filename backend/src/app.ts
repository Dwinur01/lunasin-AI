import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import clientsRouter from "./routes/clients.js";
import invoicesRouter from "./routes/invoices.js";
import expensesRouter from "./routes/expenses.js";
import aiRouter from "./routes/ai.js";
import cashflowRouter from "./routes/cashflow.js";
import seedRouter from "./routes/seed.js";
import testDbRouter from "./routes/test-db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/clients", clientsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/cashflow", cashflowRouter);
app.use("/api/seed", seedRouter);
app.use("/api/test-db", testDbRouter);

// Healthcheck / Welcome route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lunasin AI Backend is running on Vercel Serverless.",
    timestamp: new Date().toISOString()
  });
});

export default app;
