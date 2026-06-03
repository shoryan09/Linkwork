"use client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/context/language-context"

const STATES: Record<string, string[]> = {
  Delhi: ["New Delhi", "Dwarka", "Saket"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  Karnataka: ["Bengaluru", "Mysuru"],
}

export type LocationValue = { state?: string; city?: string }

export function LocationFilter({
  value,
  onChange,
}: {
  value: LocationValue
  onChange: (v: LocationValue) => void
}) {
  const { t } = useLanguage()
  const cities = value.state ? STATES[value.state] || [] : []

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="state">{t("state")}</Label>
        <Select value={value.state} onValueChange={(v) => onChange({ state: v, city: undefined })}>
          <SelectTrigger id="state">
            <SelectValue placeholder={t("selectState")} />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(STATES).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="city">{t("city")}</Label>
        <Select value={value.city} onValueChange={(v) => onChange({ ...value, city: v })} disabled={!value.state}>
          <SelectTrigger id="city">
            <SelectValue placeholder={t("selectCity")} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
