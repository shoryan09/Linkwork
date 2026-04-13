"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/context/auth-context"
import { DataProvider } from "@/context/data-context"
import { LanguageProvider } from "@/context/language-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
