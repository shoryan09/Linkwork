"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function GigCard({
  title,
  price,
  turnaroundTime,
  onGetStarted,
}: {
  title: string
  price: number
  turnaroundTime: string
  onGetStarted?: () => void
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-pretty">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>{"₹" + price.toLocaleString("en-IN")}</p>
        <p>{"Turnaround: " + turnaroundTime}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onGetStarted}>
          Get Started
        </Button>
      </CardFooter>
    </Card>
  )
}
