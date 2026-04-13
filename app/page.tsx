"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"

export default function HomePage() {
  const { currentUser } = useAuth()
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid gap-8">
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-semibold text-balance">{t("appName")}</h1>
        <p className="text-muted-foreground text-pretty">{t("tagline")}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/gigs">
            <Button>{t("gigs")}</Button>
          </Link>
          {!currentUser && (
            <>
              <Link href="/signup">
                <Button variant="outline">{t("signup")}</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">{t("login")}</Button>
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <img src="/icons/project.svg" alt={t("projectsLogoAlt")} className="h-5 w-5 object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t("postProjects")}</h3>
                <p className="text-sm text-muted-foreground">{t("postProjects_desc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <img src="/icons/filters.svg" alt={t("filtersLogoAlt")} className="h-5 w-5 object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t("smartFilters")}</h3>
                <p className="text-sm text-muted-foreground">{t("smartFilters_desc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <img src="/icons/chat.svg" alt={t("chatLogoAlt")} className="h-5 w-5 object-contain" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t("lightweightChat")}</h3>
                <p className="text-sm text-muted-foreground">{t("lightweightChat_desc")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
