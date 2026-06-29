import express from "express";
import { runSeeding } from "../lib/seed.js";

const router = express.Router();

const handleSeed = async (req: express.Request, res: express.Response) => {
  try {
    const result = await runSeeding();
    res.json({
      status: "success",
      message: "Database seeded successfully!",
      data: result,
    });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    res.status(500).json({
      status: "error",
      message: "Seeding failed.",
      error: error.message || String(error),
    });
  }
};

router.post("/", handleSeed);
router.get("/", handleSeed);

export default router;
