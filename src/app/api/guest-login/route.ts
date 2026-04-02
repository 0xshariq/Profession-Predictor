import { nanoid } from "nanoid"
import { cookies } from "next/headers"
import { dbConnect } from "@/lib/dbConnect"
import GuestModel from "@/models/Guest.models"

export async function POST() {
  try {
    await dbConnect()

    const guestId = nanoid()

    // Create new guest user
    await GuestModel.create({
      guestId,
      predictionsCount: 0,
      createdAt: new Date(),
      lastActive: new Date(),
    })

    // Set cookie properly
    const cookieStore = await cookies()
    cookieStore.set("guestId", guestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days instead of 1 hour for better user experience
      path: "/",
    })

    return Response.json({
      success: true,
      message: "Guest login successful",
    })
  } catch (error) {
    console.error("Guest login error:", error)
    return Response.json({ error: "Failed to create guest session" }, { status: 500 })
  }
}

