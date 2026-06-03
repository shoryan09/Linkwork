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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const STARTER_KITS: Record<string, { bio: string; skills: string[] }> = {
  "Graphic Design": {
    bio: "Freelance designer specializing in clean, modern brand systems and marketing collateral.",
    skills: ["Logo Design", "Branding", "Figma", "Illustrator"],
  },
  "Content Writing": {
    bio: "Conversion-focused copywriter with experience across SaaS, e-commerce, and DTC brands.",
    skills: ["Copywriting", "SEO", "Headlines", "Editing"],
  },
  "Web Development": {
    bio: "Front-end developer focused on accessible, performant interfaces and component systems.",
    skills: ["React", "Next.js", "TypeScript", "CSS"],
  },
}

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const { t } = useLanguage()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"client" | "freelancer">("client")

  const [primarySkill, setPrimarySkill] = useState<string | undefined>()
  const [bio, setBio] = useState("")
  const [skills, setSkills] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const useStarterKit = () => {
    if (!primarySkill) return
    const kit = STARTER_KITS[primarySkill]
    if (!kit) return
    setBio(kit.bio)
    setSkills(kit.skills.join(", "))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await signup({
      email,
      password,
      role,
      name,
      bio,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setLoading(false)
    if (!res.ok) {
      setError(res.error || t("signupFailed"))
      return
    }
    router.replace(role === "client" ? "/client-dashboard" : "/freelancer-dashboard")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("signUp")}</CardTitle>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("role")}</Label>
              <RadioGroup value={role} onValueChange={(v: any) => setRole(v)} className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="client" id="client" />
                  <Label htmlFor="client">{t("client")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="freelancer" id="freelancer" />
                  <Label htmlFor="freelancer">{t("freelancer")}</Label>
                </div>
              </RadioGroup>
            </div>

            {role === "freelancer" && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="primarySkill">{t("primarySkill")}</Label>
                  <Select value={primarySkill} onValueChange={(v: any) => setPrimarySkill(v)}>
                    <SelectTrigger id="primarySkill">
                      <SelectValue placeholder={t("selectPrimarySkill")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(STARTER_KITS).map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {primarySkill && (
                    <div className="mt-1">
                      <button type="button" className="text-sm text-primary hover:underline" onClick={useStarterKit}>
                        {t("useStarterKit")}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="bio">{t("bio")}</Label>
                  <Textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="skills">{t("skills_comma")}</Label>
                  <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{t(error, error)}</p>}
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
