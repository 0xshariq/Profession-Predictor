import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CareerDetail } from "@/types/form"

export function CareerDetailCard({ title, match, description }: CareerDetail) {
  // Function to format the description into sections with better structure
  const formatDescription = (text: string): { section: string; content: string }[] => {
    const sections = [
      "Skills Alignment",
      "Growth Potential",
      "Work-Life Balance",
      "Required Skills",
      "Salary Range",
      "Career Progression",
    ]

    // Split the text by known section headers
    const formattedSections: { section: string; content: string }[] = []
    let currentSection = ""
    let currentContent: string[] = []

    // Split by lines and process
    const lines = text.split("\n")

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Check if this line is a section header
      const sectionMatch = sections.find(
        (section) => trimmedLine.startsWith(`${section}:`) || trimmedLine === `${section}:` || trimmedLine === section,
      )

      if (sectionMatch) {
        // Save previous section if it exists
        if (currentSection && currentContent.length > 0) {
          formattedSections.push({
            section: currentSection,
            content: currentContent.join("\n"),
          })
          currentContent = []
        }

        // Start new section
        currentSection = sectionMatch
        // If there's content after the colon on the same line, add it
        const contentAfterColon = trimmedLine.substring(sectionMatch.length + 1).trim()
        if (contentAfterColon) {
          currentContent.push(contentAfterColon)
        }
      } else {
        // Add to current section content
        currentContent.push(trimmedLine)
      }
    }

    // Add the last section
    if (currentSection && currentContent.length > 0) {
      formattedSections.push({
        section: currentSection,
        content: currentContent.join("\n"),
      })
    }

    // If no sections were found, return the whole text as a single section
    if (formattedSections.length === 0 && text.trim()) {
      formattedSections.push({
        section: "Overview",
        content: text.trim(),
      })
    }

    return formattedSections
  }

  const formattedSections = formatDescription(description)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Badge variant={match > 90 ? "default" : match > 80 ? "secondary" : "outline"}>Match: {match}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {formattedSections.map((section) => (
            <div key={section.section} className="space-y-2">
              <h4 className="font-semibold text-primary">{section.section}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

