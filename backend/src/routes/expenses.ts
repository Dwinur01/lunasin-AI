import express from "express";
import { dbService } from "../lib/dbService.js";

const router = express.Router();

// GET /api/expenses - List all expenses
router.get("/", async (req, res) => {
  try {
    const rawExpenses = await dbService.getExpenses();
    
    // Map response
    const expenses = rawExpenses.map((exp) => {
      return {
        expenseId: exp.SK.split("#")[1],
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        date: exp.date,
      };
    });

    // Sort by date descending
    expenses.sort((a, b) => b.date.localeCompare(a.date));

    res.json(expenses);
  } catch (error: any) {
    console.error("Failed to list expenses:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to list expenses.",
      error: error.message || String(error),
    });
  }
});

// POST /api/expenses - Create a new expense
router.post("/", async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({
        status: "error",
        message: "Missing required fields: amount, category, date are required."
      });
    }

    const expenseId = `exp_${Date.now()}`;

    await dbService.addExpense({
      expenseId,
      amount: Number(amount),
      category,
      description: description || "",
      date,
    });

    res.status(201).json({
      status: "success",
      expense: {
        expenseId,
        amount: Number(amount),
        category,
        description: description || "",
        date,
      }
    });
  } catch (error: any) {
    console.error("Failed to create expense:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create expense.",
      error: error.message || String(error),
    });
  }
});

export default router;
