import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession, verifyPassword, hashPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      )
    }

    // Get current admin
    const admins = await sql`
      SELECT * FROM admins WHERE id = ${session.adminId}
    `

    if (admins.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, admins[0].password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const newHash = await hashPassword(newPassword)

    // Update password
    await sql`
      UPDATE admins 
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${session.adminId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    )
  }
}
