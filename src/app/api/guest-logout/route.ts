import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()

  // Delete the guest cookie
  cookieStore.delete("guestId")

  return NextResponse.json({
    success: true,
    message: "Guest logged out successfully",
  })
}

