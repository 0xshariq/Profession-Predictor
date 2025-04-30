"use client";
import { SessionProvider } from "next-auth/react"
import type React from "react";
import type { JSX } from "react";

export default function AuthProvider({children}: {children: React.ReactNode}): JSX.Element {
  return (
    <SessionProvider>
        {children}
    </SessionProvider>
  )
}