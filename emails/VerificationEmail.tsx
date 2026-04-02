import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr } from "@react-email/components"

interface VerificationEmailProps {
  username: string
  email: string
  otp: string
}

// Get the base URL from environment variables or use a default
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const VerificationEmail = ({ username, email, otp }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your verification code for Profession Predictor: {otp}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Img src={`${baseUrl}/logo.png`} width="120" height="40" alt="Profession Predictor" style={logo} />
        </Section>

        <Hr style={divider} />

        <Section style={content}>
          <Heading style={h1}>Verify Your Account</Heading>

          <Text style={text}>
            Hello <strong>{username}</strong>,
          </Text>

          <Text style={text}>
            Thank you for signing up with Profession Predictor! To complete your registration and access personalized
            career recommendations, please verify your account using the verification code below.
          </Text>

          {/* OTP Display */}
          <Section style={otpContainer}>
            <Text style={otpLabel}>Your Verification Code</Text>
            <Text style={otpCode}>{otp}</Text>
          </Section>

          <Text style={instructionText}>
            Enter this code on the verification page or click the button below to verify your account.
          </Text>

          {/* Verification Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/verify/${encodeURIComponent(username)}`}>
              Verify My Account
            </Button>
          </Section>

          {/* Expiration Notice */}
          <Text style={expirationText}>
            This code will expire in <strong>60 minutes</strong>.
          </Text>

          <Hr style={divider} />

          {/* Help Section */}
          <Section style={helpSection}>
            <Text style={helpText}>If you didn't create an account with us, you can safely ignore this email.</Text>
            <Text style={helpText}>
              Having trouble? Contact our support team at{" "}
              <a href="mailto:support@professionpredictor.com" style={link}>
                support@professionpredictor.com
              </a>
            </Text>
          </Section>
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>© {new Date().getFullYear()} Profession Predictor. All rights reserved.</Text>
          <Text style={footerText}>Our mailing address: 123 AI Street, Tech City, TC 12345</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

// Styles
const main = {
  backgroundColor: "#f5f7fa",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "20px",
}

const container = {
  margin: "0 auto",
  maxWidth: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
}

const header = {
  padding: "24px",
  textAlign: "center" as const,
}

const logo = {
  margin: "0 auto",
}

const content = {
  padding: "0 32px",
}

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "32px 0 24px",
}

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
}

const instructionText = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  textAlign: "center" as const,
}

const otpContainer = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const otpLabel = {
  color: "#4b5563",
  fontSize: "14px",
  marginBottom: "8px",
}

const otpCode = {
  color: "#111827",
  fontSize: "32px",
  fontWeight: "bold",
  letterSpacing: "8px",
  margin: "0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  cursor: "pointer",
}

const expirationText = {
  color: "#6b7280",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "16px 0 32px",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
}

const helpSection = {
  padding: "24px 0",
}

const helpText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
}

const link = {
  color: "#4f46e5",
  textDecoration: "none",
}

const footer = {
  backgroundColor: "#f9fafb",
  padding: "24px 32px",
  textAlign: "center" as const,
}

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "4px 0",
}

