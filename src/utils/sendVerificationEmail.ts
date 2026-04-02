import { resend } from "@/lib/resend"
import VerificationEmail from "../../emails/VerificationEmail"
import type { ApiResponse } from "@/types/ApiResponse"

export const sendVerificationEmail = async (email: string, username: string, otp: string): Promise<ApiResponse> => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Profession Predictor <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Profession Predictor account",
      react: VerificationEmail({ username, email, otp }),
    })

    if (error) {
      console.error("Resend API error:", error)
      return {
        success: false,
        message: "Failed to send verification email",
        error: error.message,
      }
    }

    return {
      success: true,
      message: "Verification email sent successfully",
      data,
    }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return {
      success: false,
      message: "Failed to send verification email",
      error: (error as Error).message,
    }
  }
}

