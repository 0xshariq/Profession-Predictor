import { dbConnect } from "@/lib/dbConnect"
import UserModel from "@/models/User.models"
import { z } from "zod"

// Define a schema for input validation
const VerificationSchema = z.object({
  username: z.string().min(1, "Username is required"),
  code: z.string().length(6, "Verification code must be 6 characters long"),
})

/**
 * POST handler for verifying a user's account
 * @param request - The incoming request object
 * @returns Response indicating the success or failure of the verification process
 */
export async function POST(request: Request) {
  try {
    // Connect to the database
    await dbConnect()

    // Parse and validate the request body
    const body = await request.json()
    const validationResult = VerificationSchema.safeParse(body)

    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid input",
          errors: validationResult.error.errors,
        },
        { status: 400 },
      )
    }

    const { username, code } = validationResult.data

    // Decode the username (in case it was URL-encoded)
    const decodedUsername = decodeURIComponent(username)

    // Find the user by username
    const user = await UserModel.findOne({ username: decodedUsername })

    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Check if the verification code is valid
    const isCodeValid = user.verifyCode === code
    const isCodeNotExpired = new Date(user.verifyCodeExpires) > new Date()

    if (isCodeValid && isCodeNotExpired) {
      // Verify the user
      user.isVerified = true
      await user.save()
      return Response.json({ success: true, message: "User verified successfully" }, { status: 200 })
    } else if (!isCodeNotExpired) {
      return Response.json({ success: false, message: "Verification code has expired" }, { status: 400 })
    } else {
      return Response.json({ success: false, message: "Invalid verification code" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in verifying user:", error)

    if (error instanceof z.ZodError) {
      // Handle validation errors
      return Response.json({ success: false, message: "Invalid input", errors: error.errors }, { status: 400 })
    }

    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error in verifying user",
      },
      { status: 500 },
    )
  }
}

