"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/context/language-context"

export function ProjectCard({
  id,
  title,
  description,
  price,
  location,
  requiredSkills,
  isLocal,
  status,
}: {
  id: string
  title: string
  description: string
  price: number
  location: { state: string; city: string }
  requiredSkills: string[]
  isLocal: boolean
  status: "open" | "closed"
}) {
  const { t } = useLanguage()

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-pretty">{title}</CardTitle>
          {isLocal && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {t("local")}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">{location.state + ", " + location.city}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-pretty">{description}</p>
        <div className="flex flex-wrap gap-2">
          {requiredSkills.map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-sm font-medium">{"₹" + price.toLocaleString("en-IN")}</span>
        <Link href={`/project/${id}`} className="text-sm text-primary hover:underline">
          {t("view")}
        </Link>
      </CardFooter>
    </Card>
  )
}
