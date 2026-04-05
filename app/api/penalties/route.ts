import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const penalties = await sql`
      SELECT p.*, m.name as member_name
      FROM penalties p
      JOIN members m ON p.member_id = m.id
      ORDER BY p.month_year DESC, p.created_at DESC
    `
    return NextResponse.json({ penalties })
  } catch (error) {
    console.error("Error fetching penalties:", error)
    return NextResponse.json({ error: "Failed to fetch penalties" }, { status: 500 })
  }
}
