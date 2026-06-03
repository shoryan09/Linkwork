"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/context/language-context"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { currentUser, logout } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-foreground">
            {t("appName")}
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link href="/gigs" className={isActive("/gigs")}>
              {t("gigs")}
            </Link>
            {currentUser?.role === "client" && (
              <Link href="/client-dashboard" className={isActive("/client-dashboard")}>
                {t("clientDashboard")}
              </Link>
            )}
            {currentUser?.role === "freelancer" && (
              <Link href="/freelancer-dashboard" className={isActive("/freelancer-dashboard")}>
                {t("freelancerDashboard")}
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {!currentUser ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">{t("signup")}</Button>
              </Link>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={logout}>
              {t("logout")}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage()
  return (
    <Button variant="outline" size="icon" onClick={toggleLanguage} aria-label="Toggle language">
      {lang.toUpperCase()}
    </Button>
  )
}
