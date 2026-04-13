"use client"

import { useData } from "@/context/data-context"
import { GigCard } from "@/components/gig-card"
import { useState, useMemo } from "react"
import { ProposalForm } from "@/components/proposal-form"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context" // import auth
import { useRouter } from "next/navigation" // import router
import { useLanguage } from "@/context/language-context" // import language

export default function GigsPage() {
  const { gigs } = useData()
  const { toast } = useToast()
  const { currentUser } = useAuth() // get auth state
  const router = useRouter() // router for redirect
  const { t } = useLanguage() // localize strings
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null)
  const selectedGig = useMemo(() => gigs.find((g) => g.id === selectedGigId) || null, [gigs, selectedGigId])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6">
      <h1 className="text-2xl font-semibold">{t("gigs")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {gigs.map((g) => (
          <GigCard
            key={g.id}
            title={g.title}
            price={g.price}
            turnaroundTime={g.turnaroundTime}
            onGetStarted={() => {
              if (!currentUser) {
                router.push("/login")
                return
              }
              setSelectedGigId(g.id)
            }}
          />
        ))}
      </div>

      {selectedGig && (
        <div className="grid gap-3">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">
                {t("submitProposalFor")} “{selectedGig.title}”
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{t("gigs_proposal_blurb")}</p>
              <ProposalForm
                onSubmit={(coverLetter) => {
                  toast({
                    title: t("proposalSubmittedTitle"),
                    description: `${t("proposalSubmittedDescPrefix")} “${selectedGig.title}” ${"(demo)".toString()}.`,
                  })
                  setSelectedGigId(null)
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
