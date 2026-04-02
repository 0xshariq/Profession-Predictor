import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = await cookies()
  const guestId = cookieStore.get("guestId")?.value

  return NextResponse.json({
    isGuest: !!guestId,
  })
}

