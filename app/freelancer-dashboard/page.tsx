"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useData } from "@/context/data-context"
import { ProtectedRoute } from "@/components/protected-route"
import { LocationFilter, type LocationValue } from "@/components/location-filter"
import { ProjectCard } from "@/components/project-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProposalForm } from "@/components/proposal-form"
import { useLanguage } from "@/context/language-context"

export default function FreelancerDashboardPage() {
  const { currentUser } = useAuth()
  const { projects, proposals, submitProposal } = useData()
  const { t } = useLanguage()

  const [filter, setFilter] = useState<LocationValue>({})
  const [proposalForProject, setProposalForProject] = useState<string | null>(null)

  const openProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.status !== "open") return false
      if (filter.state && p.location.state !== filter.state) return false
      if (filter.city && p.location.city !== filter.city) return false
      return true
    })
  }, [projects, filter])

  const myProposals = useMemo(
    () => proposals.filter((p) => p.freelancerId === currentUser?.id),
    [proposals, currentUser],
  )

  return (
    <ProtectedRoute role="freelancer">
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">{t("findLocalWork")}</h2>
          <LocationFilter value={filter} onChange={setFilter} />
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("openProjects")}</h3>
            <Link href="/gigs" className="text-sm text-primary hover:underline">
              {t("exploreGigs")}
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {openProjects.map((p) => (
              <div key={p.id} className="grid gap-3">
                <ProjectCard
                  id={p.id}
                  title={p.title}
                  description={p.description}
                  price={p.price}
                  requiredSkills={p.requiredSkills}
                  isLocal={p.isLocal}
                  location={p.location}
                  status={p.status}
                />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setProposalForProject(p.id)}>
                    {t("submitProposal")}
                  </Button>
                </div>
                {proposalForProject === p.id && (
                  <ProposalForm
                    onSubmit={(coverLetter) => {
                      if (!currentUser) return
                      submitProposal({
                        projectId: p.id,
                        freelancerId: currentUser.id,
                        coverLetter,
                      })
                      setProposalForProject(null)
                    }}
                  />
                )}
              </div>
            ))}
            {openProjects.length === 0 && (
              <Card className="md:col-span-2">
                <CardContent className="p-4 text-sm text-muted-foreground">{t("noProjectsForLocation")}</CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="grid gap-3">
          <h3 className="text-lg font-semibold">{t("myProposals")}</h3>
          <div className="grid gap-3">
            {myProposals.length === 0 && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">{t("noProposalsYet")}</CardContent>
              </Card>
            )}
            {myProposals.map((pr) => {
              const proj = projects.find((p) => p.id === pr.projectId)
              return (
                <Card key={pr.id}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{proj?.title ?? "Project"}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t("status")}: {pr.status}
                    </p>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  )
}
