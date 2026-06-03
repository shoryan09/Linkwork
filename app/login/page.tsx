"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || t("loginFailed"))
      return
    }
    // route based on credential for convenience (client/freelancer known after session restore)
    if (email === "client@client.com") router.replace("/client-dashboard")
    else if (email === "freelancer@freelancer.com") router.replace("/freelancer-dashboard")
    else router.replace("/")
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("login")}</CardTitle>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{t(error, error)}</p>}
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {t("newUser")}{" "}
              <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
                {t("signUpNow")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/signup">
                <Button type="button" variant="outline">
                  {t("signup")}
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? t("loggingIn") : t("login")}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
