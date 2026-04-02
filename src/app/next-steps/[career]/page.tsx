"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Briefcase, Users, Award, Calendar } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { CareerDetail } from "@/types/form"

export default function CareerNextSteps() {
  const params = useParams<{ career: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [careerDetail, setCareerDetail] = useState<CareerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, you would fetch this from an API or state management
    // For now, we'll simulate retrieving from localStorage
    const storedResults = localStorage.getItem("careerResults")
    if (storedResults) {
      try {
        const results = JSON.parse(storedResults)
        const decodedCareer = decodeURIComponent(params.career)
        const detail = results.details.find((d: CareerDetail) => d.title.toLowerCase() === decodedCareer.toLowerCase())

        if (detail) {
          setCareerDetail(detail)
        } else {
          toast({
            title: "Career not found",
            description: "The requested career details could not be found",
            variant: "destructive",
          })
          router.push("/")
        }
      } catch (error) {
        console.error("Error parsing stored results:", error)
        toast({
          title: "Error",
          description: "Could not retrieve career details",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "No results found",
        description: "Please complete the career assessment first",
        variant: "destructive",
      })
      router.push("/")
    }
    setLoading(false)
  }, [params.career, router, toast])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!careerDetail) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Career details not found</h2>
              <p className="text-muted-foreground mb-6">Please complete the assessment to view career details</p>
              <Button onClick={() => router.push("/")}>Go to Assessment</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract sections from the description
  const extractSection = (text: string, sectionName: string): string => {
    const regex = new RegExp(
      `${sectionName}:([\\s\\S]*?)(?=(Skills Alignment:|Growth Potential:|Work-Life Balance:|Required Skills:|Salary Range:|Career Progression:|$))`,
      "i",
    )
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  const requiredSkills = extractSection(careerDetail.description, "Required Skills")
  const careerProgression = extractSection(careerDetail.description, "Career Progression")

  // Generate next steps based on career details
  const generateNextSteps = () => {
    return [
      {
        icon: BookOpen,
        title: "Education & Learning",
        steps: [
          `Complete courses in ${requiredSkills.split(",")[0] || "relevant fields"}`,
          `Obtain certifications in ${requiredSkills.split(",")[1] || "industry-standard tools"}`,
          "Follow industry publications and thought leaders",
        ],
      },
      {
        icon: Briefcase,
        title: "Experience Building",
        steps: [
          `Build portfolio projects demonstrating ${requiredSkills.split(",")[0] || "key skills"}`,
          "Contribute to open-source or volunteer projects",
          "Seek internships or entry-level positions in the field",
        ],
      },
      {
        icon: Users,
        title: "Networking",
        steps: [
          "Join professional associations in this field",
          "Attend industry conferences and meetups",
          "Connect with professionals on LinkedIn",
        ],
      },
      {
        icon: Award,
        title: "Professional Development",
        steps: [
          "Find a mentor in the field",
          "Develop a personal brand highlighting your expertise",
          "Create and share content related to your field",
        ],
      },
      {
        icon: Calendar,
        title: "Timeline",
        steps: [
          "Months 1-3: Focus on core skill development",
          "Months 4-6: Build portfolio and network",
          "Months 7-12: Apply for positions and continue learning",
        ],
      },
    ]
  }

  const nextSteps = generateNextSteps()

  return (
    <div className="container mx-auto px-4 py-12">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">{careerDetail.title}</CardTitle>
              <CardDescription>Detailed action plan for pursuing this career</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              Match: {careerDetail.match}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Career Overview</h3>
              <p className="text-muted-foreground">{extractSection(careerDetail.description, "Skills Alignment")}</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Career Progression Path</h3>
              <p className="text-muted-foreground">{careerProgression}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-6">Your Action Plan</h2>

      <div className="space-y-6">
        {nextSteps.map((section, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <section.icon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle>{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2">
                {section.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Button onClick={() => router.push("/")}>Return to Assessment</Button>
      </div>
    </div>
  )
}

