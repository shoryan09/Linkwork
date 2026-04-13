"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { useData } from "@/context/data-context"
import { useLanguage } from "@/context/language-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ProposalForm } from "@/components/proposal-form"

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>()
  const { currentUser } = useAuth()
  const { projects, submitProposal } = useData()
  const [showProposal, setShowProposal] = useState(false)
  const { t } = useLanguage()

  const project = useMemo(() => projects.find((p) => p.id === params.projectId), [projects, params.projectId])

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{t("projectNotFound")}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 grid gap-4">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{project.title}</CardTitle>
            {project.isLocal && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {t("local")}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{project.location.state + ", " + project.location.city}</div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.requiredSkills.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-sm font-medium">{"₹" + project.price.toLocaleString("en-IN")}</span>
          {currentUser?.role === "freelancer" && project.status === "open" && (
            <Button size="sm" onClick={() => setShowProposal((v) => !v)}>
              {showProposal ? t("cancel") : t("submitProposal")}
            </Button>
          )}
        </CardFooter>
      </Card>

      {showProposal && currentUser?.role === "freelancer" && (
        <ProposalForm
          onSubmit={(coverLetter) => {
            submitProposal({
              projectId: project.id,
              freelancerId: currentUser.id,
              coverLetter,
            })
            setShowProposal(false)
          }}
        />
      )}
    </div>
  )
}
