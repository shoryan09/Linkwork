"use client"

import { type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode
  role: "client" | "freelancer"
}) {
  const router = useRouter()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login")
      return
    }
    if (currentUser.role !== role) {
      router.replace("/")
    }
  }, [currentUser, role, router])

  if (!currentUser || currentUser.role !== role) return null
  return <>{children}</>
}
