"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/context/language-context"

export function ChatUI() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState([
    { from: "client", text: t("seed_client_hi") },
    { from: "freelancer", text: t("seed_freelancer_reply") },
  ])
  const [input, setInput] = useState("")

  const send = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { from: "me", text: input.trim() }])
    setInput("")
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>{t("chat")}</CardTitle>
        <Button variant="outline" size="sm">
          {t("attach")}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="h-56 overflow-y-auto rounded-md border p-3 bg-card">
          <ul className="space-y-2 text-sm">
            {messages.map((m, i) => (
              <li key={i} className={m.from === "me" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block rounded-md px-2 py-1 ${
                    m.from === "me" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {m.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("typeMessage_placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send}>{t("send")}</Button>
        </div>
      </CardContent>
    </Card>
  )
}
