import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import clientsRouter from "./routes/clients.js";
import invoicesRouter from "./routes/invoices.js";
import aiRouter from "./routes/ai.js";
import cashflowRouter from "./routes/cashflow.js";
import seedRouter from "./routes/seed.js";
import testDbRouter from "./routes/test-db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env.local
dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/clients", clientsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/ai", aiRouter);
app.use("/api/cashflow", cashflowRouter);
app.use("/api/seed", seedRouter);
app.use("/api/test-db", testDbRouter);

// Healthcheck / Welcome route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Lunasin AI Backend is running.",
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`👉 Environment loaded from: ${path.join(__dirname, "../../.env.local")}`);
});
