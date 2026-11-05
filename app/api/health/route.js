import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const provider = process.env.CLOUD_PROVIDER || "local";
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    return NextResponse.json({
      status: "ok",
      database: "connected",
      provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check failed:", error.message);
    return NextResponse.json({
      status: "degraded",
      database: "unavailable",
      provider,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
