import type React from "react"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import AuthProvider from "@/context/AuthProvider"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import { ThemeProvider } from "@/context/ThemeProvider"
import type { Metadata } from "next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Profession Predictor - Find Your Ideal Career Path",
  description: "Discover your perfect career with AI-powered analysis and personalized suggestions.",
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`scroll-smooth ${geistSans.variable} ${geistMono.variable}`}>
      <body className={`${geistSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

