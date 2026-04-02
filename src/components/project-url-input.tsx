"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProjectUrlInputProps {
  value: string
  onChange: (value: string) => void
}

export function ProjectUrlInput({ value, onChange }: ProjectUrlInputProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="projectUrl" className="text-base font-medium">
        Portfolio or Project URL (Optional)
      </Label>
      <Input
        id="projectUrl"
        type="url"
        placeholder="https://github.com/yourusername/project"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
      <p className="text-sm text-muted-foreground">
        Add a link to your best project, portfolio, or GitHub repository to help us provide more accurate career
        suggestions.
      </p>
    </div>
  )
}

