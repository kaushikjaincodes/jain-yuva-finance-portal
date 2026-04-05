import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { sql } from "./db"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "bachaat-committee-secret-key-change-in-production"
)

export interface SessionPayload {
  adminId: number
  email: string
  name: string
  expiresAt: Date
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(adminId: number, email: string, name: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const token = await new SignJWT({ adminId, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  // Store session in database
  await sql`
    INSERT INTO sessions (admin_id, token, expires_at)
    VALUES (${adminId}, ${token}, ${expiresAt.toISOString()})
  `

  // Set HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Verify session exists in database
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token} AND expires_at > NOW()
    `
    
    if (sessions.length === 0) return null

    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      name: payload.name as string,
      expiresAt: new Date(payload.exp! * 1000),
    }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`
  }

  cookieStore.delete("session")
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
