import { NextResponse } from "next/server";
import { runSeeding } from "@/lib/seed";

export async function POST() {
  try {
    const result = await runSeeding();
    return NextResponse.json({
      status: "success",
      message: "Database seeded successfully!",
      data: result,
    });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return NextResponse.json({
      status: "error",
      message: "Seeding failed.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await runSeeding();
    return NextResponse.json({
      status: "success",
      message: "Database seeded successfully!",
      data: result,
    });
  } catch (error: any) {
    console.error("Seeding failed:", error);
    return NextResponse.json({
      status: "error",
      message: "Seeding failed.",
      error: error.message || String(error),
    }, { status: 500 });
  }
}
