"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useData } from "@/context/data-context"
import { useLanguage } from "@/context/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationFilter, type LocationValue } from "./location-filter"

const CATEGORY = ["Design", "Writing", "Development"] as const
const COMPLEXITY = ["Basic", "Standard", "Premium"] as const

const BUDGET_SUGGESTIONS: Record<(typeof CATEGORY)[number], Record<(typeof COMPLEXITY)[number], [number, number]>> = {
  Design: { Basic: [2000, 5000], Standard: [5000, 12000], Premium: [12000, 25000] },
  Writing: { Basic: [1500, 4000], Standard: [4000, 9000], Premium: [9000, 18000] },
  Development: { Basic: [5000, 15000], Standard: [15000, 40000], Premium: [40000, 100000] },
}

const AI_EXAMPLES: Array<{ match: RegExp; output: string }> = [
  {
    match: /logo|brand/i,
    output:
      "Seeking a modern, versatile logo for a neighborhood coffee shop. Deliverables include primary + secondary logo marks, color palette, and font suggestions. Final assets in vector (AI/SVG) and PNG formats, optimized for signage and social media.",
  },
  {
    match: /website|landing/i,
    output:
      "Looking to redesign a responsive landing page with clear hero messaging, features, and CTA. Include component-based structure, accessibility in mind, and SEO best practices. Handoff with Figma and basic copy.",
  },
  {
    match: /copy|content/i,
    output:
      "Need concise, conversion-focused copy for homepage and about page. Friendly tone, 500-800 words total, with 2 headline variants and 3 CTA variants. Please include a brief style guide.",
  },
]

export function ProjectForm() {
  const { currentUser } = useAuth()
  const { createProject } = useData()
  const { t } = useLanguage()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number | "">("")
  const [requiredSkills, setRequiredSkills] = useState<string>("")
  const [isLocal, setIsLocal] = useState(false)
  const [location, setLocation] = useState<LocationValue>({})
  const [category, setCategory] = useState<(typeof CATEGORY)[number] | undefined>()
  const [complexity, setComplexity] = useState<(typeof COMPLEXITY)[number] | undefined>()

  const suggested = useMemo(() => {
    if (!category || !complexity) return null
    const [min, max] = BUDGET_SUGGESTIONS[category][complexity]
    return `${t("suggestedPrefix")}: ₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`
  }, [category, complexity, t])

  const onGenerateAI = () => {
    const found = AI_EXAMPLES.find((e) => e.match.test(title) || e.match.test(description))
    setDescription(
      found?.output || "Please describe your project in detail: goals, deliverables, timeline, and any references.",
    )
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    if (!title || !description || !price || !location.state || !location.city) return
    createProject({
      clientId: currentUser.id,
      title,
      description,
      price: Number(price),
      requiredSkills: requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      isLocal,
      location: { state: location.state!, city: location.city! },
    })
    // reset
    setTitle("")
    setDescription("")
    setPrice("")
    setRequiredSkills("")
    setIsLocal(false)
    setLocation({})
    setCategory(undefined)
    setComplexity(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("createProject")}</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">{t("title")}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("title_placeholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">{t("description")}</Label>
              <button
                type="button"
                onClick={onGenerateAI}
                className="text-sm text-primary hover:underline"
                aria-label={t("generateWithAI")}
                title={t("generateWithAI")}
              >
                {t("generateWithAI")}
              </button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("description_placeholder")}
              rows={4}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="category">{t("category")}</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`category_${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="complexity">{t("complexity")}</Label>
              <Select value={complexity} onValueChange={(v: any) => setComplexity(v)}>
                <SelectTrigger id="complexity">
                  <SelectValue placeholder={t("selectComplexity")} />
                </SelectTrigger>
                <SelectContent>
                  {COMPLEXITY.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(`complexity_${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="price">{t("price")}</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
                placeholder={t("price_placeholder")}
              />
              {suggested && <p className="text-xs text-muted-foreground">{suggested}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="skills">{t("requiredSkills")}</Label>
            <Input
              id="skills"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder={t("requiredSkills_placeholder")}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("location")}</Label>
            <LocationFilter value={location} onChange={setLocation} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="local" checked={isLocal} onCheckedChange={(v) => setIsLocal(Boolean(v))} />
            <Label htmlFor="local">{t("local")}</Label>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit">{t("postProject")}</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
