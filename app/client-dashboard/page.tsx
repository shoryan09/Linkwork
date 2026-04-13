"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useData, type Proposal } from "@/context/data-context"
import { useLanguage } from "@/context/language-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ProjectForm } from "@/components/project-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChatUI } from "@/components/chat-ui"

export default function ClientDashboardPage() {
  const { currentUser } = useAuth()
  const { projects, proposals, updateProposalStatus } = useData()
  const [chatForProjectId, setChatForProjectId] = useState<string | null>(null)
  const { t } = useLanguage()

  const myProjects = useMemo(() => projects.filter((p) => p.clientId === currentUser?.id), [projects, currentUser])
  const proposalsByProject = useMemo(() => {
    const map: Record<string, Proposal[]> = {}
    for (const p of proposals) {
      if (!map[p.projectId]) map[p.projectId] = []
      map[p.projectId].push(p)
    }
    return map
  }, [proposals])

  return (
    <ProtectedRoute role="client">
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
        <ProjectForm />
        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">{t("myProjects")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {myProjects.map((proj) => (
              <Card key={proj.id}>
                <CardHeader className="space-y-1">
                  <CardTitle>
                    {proj.title}{" "}
                    {proj.status === "closed" && (
                      <span className="text-sm font-normal text-muted-foreground">({t("closed")})</span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{proj.location.state + ", " + proj.location.city}</p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="text-sm">{proj.description}</p>

                  <div className="grid gap-2">
                    <p className="font-medium text-sm">{t("proposals")}</p>
                    <div className="grid gap-3">
                      {(proposalsByProject[proj.id] || []).length === 0 && (
                        <p className="text-sm text-muted-foreground">{t("noProposals")}</p>
                      )}
                      {(proposalsByProject[proj.id] || []).map((pr) => (
                        <div key={pr.id} className="flex items-center justify-between rounded-md border p-2">
                          <span className="text-sm">
                            {t("status")}: {pr.status}
                          </span>
                          <div className="flex items-center gap-2">
                            {pr.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => updateProposalStatus(pr.id, "approved")}>
                                  {t("approve")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProposalStatus(pr.id, "rejected")}
                                >
                                  {t("reject")}
                                </Button>
                              </>
                            )}
                            {pr.status === "approved" && (
                              <Button size="sm" variant="secondary" onClick={() => setChatForProjectId(proj.id)}>
                                {t("startChat")}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {chatForProjectId === proj.id && (
                    <div className="mt-2">
                      <ChatUI />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </ProtectedRoute>
  )
}
