"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/context/language-context"

export function ProposalForm({ onSubmit }: { onSubmit: (coverLetter: string) => void }) {
  const [coverLetter, setCoverLetter] = useState("")
  const { t } = useLanguage()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!coverLetter.trim()) return
    onSubmit(coverLetter.trim())
    setCoverLetter("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("submitProposal")}</CardTitle>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="grid gap-2">
          <Label htmlFor="coverLetter">{t("coverLetter")}</Label>
          <Textarea
            id="coverLetter"
            rows={4}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder={t("coverLetter_placeholder")}
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit">{t("submit")}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
