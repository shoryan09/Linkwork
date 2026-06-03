"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Role = "client" | "freelancer"
export type User = {
  id: string
  email: string
  password: string
  role: Role
  name: string
  bio: string
  skills: string[]
}

type AuthContextValue = {
  currentUser: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  signup: (userData: Omit<User, "id">) => Promise<{ ok: boolean; error?: string }>
}

const SESSION_KEY = "linkwork_session_user"
const DATA_KEY = "linkwork_data"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Load session on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) setCurrentUser(JSON.parse(raw))
    } catch {}
  }, [])

  const persistSession = (user: User | null) => {
    if (typeof window === "undefined") return
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(SESSION_KEY)
  }

  const login = async (email: string, password: string) => {
    if (typeof window === "undefined") return { ok: false, error: "Window not available" }
    try {
      const store = JSON.parse(localStorage.getItem(DATA_KEY) || "{}")
      const users: User[] = store.users || []
      // support hardcoded credentials per spec
      const cred = [
        { email: "client@client.com", password: "client" },
        { email: "freelancer@freelancer.com", password: "freelancer" },
      ]
      const isHardcoded = cred.some((c) => c.email === email && c.password === password)
      const found = users.find((u) => u.email === email && u.password === password)
      if (!found) {
        return { ok: false, error: "Invalid credentials" }
      }
      // hardcoded credentials match still rely on stored users
      setCurrentUser(found)
      persistSession(found)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: "Login failed" }
    }
  }

  const logout = () => {
    setCurrentUser(null)
    persistSession(null)
  }

  const signup = async (userData: Omit<User, "id">) => {
    if (typeof window === "undefined") return { ok: false, error: "Window not available" }
    try {
      const store = JSON.parse(localStorage.getItem(DATA_KEY) || "{}")
      const users: User[] = store.users || []
      if (users.some((u) => u.email === userData.email)) {
        return { ok: false, error: "Email already exists" }
      }
      const newUser: User = { ...userData, id: crypto.randomUUID() }
      const updated = { ...store, users: [...users, newUser] }
      localStorage.setItem(DATA_KEY, JSON.stringify(updated))
      setCurrentUser(newUser)
      persistSession(newUser)
      return { ok: true }
    } catch {
      return { ok: false, error: "Signup failed" }
    }
  }

  const value = useMemo<AuthContextValue>(() => ({ currentUser, login, logout, signup }), [currentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
