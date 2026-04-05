import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const members = await sql`
      SELECT * FROM members ORDER BY name ASC
    `
    return NextResponse.json({ members })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, monthly_contribution, standard_contribution } = body

    if (!name || !monthly_contribution) {
      return NextResponse.json(
        { error: "Name and monthly contribution are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO members (name, email, phone, monthly_contribution, standard_contribution)
      VALUES (${name}, ${email || null}, ${phone || null}, ${monthly_contribution}, ${standard_contribution || 0})
      RETURNING *
    `

    return NextResponse.json({ member: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating member:", error)
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
