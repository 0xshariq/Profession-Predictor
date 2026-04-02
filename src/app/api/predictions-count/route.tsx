import { cookies } from "next/headers"
import { dbConnect } from "@/lib/dbConnect"
import GuestModel from "@/models/Guest.models"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get("guestId")?.value

    if (!guestId) {
      return NextResponse.json({ count: 0 })
    }

    await dbConnect()
    const guest = await GuestModel.findOne({ guestId })

    if (!guest) {
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: guest.predictionsCount })
  } catch (error) {
    console.error("Error fetching predictions count:", error)
    return NextResponse.json({ error: "Failed to fetch predictions count" }, { status: 500 })
  }
}

