"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Brain,
  Briefcase,
  GraduationCap,
  Heart,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { GuestAlert } from "@/components/guest-alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectUrlInput } from "@/components/project-url-input"
import { CareerDetailCard } from "@/components/career-detail-card"
import type { FormData, Question, CareerResult } from "@/types/form"

// Define age groups
const AGE_GROUPS = [
  { id: "student", label: "Student (13-18)", value: "student" },
  { id: "college", label: "College/University (19-24)", value: "college" },
  { id: "earlyCareer", label: "Early Career (25-34)", value: "earlyCareer" },
  { id: "midCareer", label: "Mid Career (35-44)", value: "midCareer" },
  { id: "lateCareer", label: "Late Career (45+)", value: "lateCareer" },
  { id: "careerChange", label: "Career Change (Any age)", value: "careerChange" },
]

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [predictionsCount, setPredictionsCount] = useState(0)
  const { toast } = useToast()
  const { status } = useSession()
  const router = useRouter()

  // Form state
  const [currentStep, setCurrentStep] = useState(0)
  const [ageGroup, setAgeGroup] = useState<string>("")
  const [formData, setFormData] = useState<FormData>({
    // Common fields
    ageGroup: "",
    education: "",
    hobbies: "",
    skills: "",
    interests: "",
    workStyle: "",
    projectUrl: "",

    // Student specific
    favoriteSubjects: "",
    extracurriculars: "",

    // College specific
    major: "",
    minors: "",
    internships: "",

    // Career specific
    workExperience: "",
    achievements: "",
    certifications: "",
    languages: "",

    // Career change specific
    reasonForChange: "",
    transferableSkills: "",
    desiredWorkEnvironment: "",
  })

  const [result, setResult] = useState<CareerResult | null>(null)

  // Reset form and start over
  const resetForm = () => {
    setFormData({
      ageGroup: "",
      education: "",
      hobbies: "",
      skills: "",
      interests: "",
      workStyle: "",
      projectUrl: "",
      favoriteSubjects: "",
      extracurriculars: "",
      major: "",
      minors: "",
      internships: "",
      workExperience: "",
      achievements: "",
      certifications: "",
      languages: "",
      reasonForChange: "",
      transferableSkills: "",
      desiredWorkEnvironment: "",
    })
    setAgeGroup("")
    setCurrentStep(0)
    setResult(null)
    setError(null)
  }

  // Fetch guest predictions count on component mount
  useEffect(() => {
    const fetchPredictionsCount = async () => {
      if (status === "unauthenticated") {
        try {
          const response = await fetch("/api/predictions-count")
          if (response.ok) {
            const data = await response.json()
            setPredictionsCount(data.count)
          }
        } catch (error) {
          console.error("Error fetching predictions count:", error)
        }
      }
    }
    fetchPredictionsCount()
  }, [status])

  // Handle form field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle age group selection
  const handleAgeGroupSelect = (value: string) => {
    setAgeGroup(value)
    handleChange("ageGroup", value)
    setCurrentStep(1)
  }

  // Get questions based on age group and current step
  const getQuestions = (): Question[] => {
    // Common questions for all age groups
    // For step 1 (education), customize based on age group
    if (currentStep === 1) {
      // Customize education options based on age group
      let educationOptions = [
        { value: "highSchool", label: "High School" },
        { value: "someCollege", label: "Some College" },
        { value: "associates", label: "Associate's Degree" },
        { value: "bachelors", label: "Bachelor's Degree" },
        { value: "masters", label: "Master's Degree" },
        { value: "doctorate", label: "Doctorate" },
        { value: "professional", label: "Professional Degree" },
        { value: "selfTaught", label: "Self-Taught" },
      ]

      // Age-specific education options
      if (ageGroup === "student") {
        educationOptions = [
          { value: "middleSchool", label: "Middle School" },
          { value: "someHighSchool", label: "Some High School" },
          { value: "highSchool", label: "High School" },
          { value: "vocational", label: "Vocational Training" },
          { value: "selfTaught", label: "Self-Taught" },
        ]
      } else if (ageGroup === "college") {
        educationOptions = [
          { value: "highSchool", label: "High School" },
          { value: "someCollege", label: "Some College (In Progress)" },
          { value: "associates", label: "Associate's Degree" },
          { value: "vocational", label: "Vocational Certificate" },
          { value: "bachelors", label: "Bachelor's Degree (In Progress)" },
        ]
      }

      // Customize hobbies placeholder based on age group
      let hobbiesPlaceholder = "E.g., reading, playing guitar, hiking, coding, cooking, sports, art, travel..."

      if (ageGroup === "student") {
        hobbiesPlaceholder = "E.g., video games, sports, social media, music, art, coding, reading, clubs..."
      } else if (ageGroup === "lateCareer") {
        hobbiesPlaceholder = "E.g., gardening, travel, reading, volunteering, crafts, cooking, family activities..."
      } else if (ageGroup === "careerChange") {
        hobbiesPlaceholder = "E.g., activities that might hint at new career directions or passions..."
      }

      return [
        {
          id: "education",
          label: "What is your highest level of education?",
          type: "select",
          options: educationOptions,
        },
        {
          id: "hobbies",
          label: "What are your hobbies and activities you enjoy in your free time?",
          type: "textarea",
          placeholder: hobbiesPlaceholder,
        },
      ]
    }

    // For step 2 (skills and interests), customize based on age group
    if (currentStep === 2) {
      let skillsLabel = "What skills do you possess? Include both technical and soft skills."
      let skillsPlaceholder =
        "E.g., programming in Python, public speaking, problem-solving, leadership, design, writing..."
      let interestsLabel = "What topics, fields, or activities are you most interested in?"
      let interestsPlaceholder = "E.g., technology, healthcare, arts, science, business, helping others, environment..."

      if (ageGroup === "student") {
        skillsLabel = "What skills have you developed in school or through extracurricular activities?"
        skillsPlaceholder = "E.g., math, writing, public speaking, teamwork, computer skills, organization..."
        interestsLabel = "What subjects or activities do you find most interesting?"
        interestsPlaceholder = "E.g., science, computers, art, music, sports, helping others, social media..."
      } else if (ageGroup === "college") {
        skillsLabel = "What academic and practical skills have you developed?"
        skillsPlaceholder = "E.g., research, analysis, programming, lab techniques, presentation skills..."
        interestsLabel = "What academic subjects or potential career fields interest you most?"
        interestsPlaceholder = "E.g., specific areas within your major, research topics, industry applications..."
      } else if (ageGroup === "earlyCareer") {
        skillsLabel = "What professional and technical skills have you developed so far?"
        skillsPlaceholder = "E.g., project management, specific software, client relations, technical writing..."
      } else if (ageGroup === "midCareer") {
        skillsLabel = "What specialized skills and expertise have you developed in your career?"
        skillsPlaceholder = "E.g., leadership, strategic planning, mentoring, specialized technical skills..."
      } else if (ageGroup === "lateCareer") {
        skillsLabel = "What advanced skills and expertise define your professional capabilities?"
        skillsPlaceholder = "E.g., executive leadership, strategic vision, mentorship, specialized domain knowledge..."
      } else if (ageGroup === "careerChange") {
        skillsLabel = "What transferable skills do you have that could apply to new fields?"
        skillsPlaceholder = "E.g., project management, communication, analysis, leadership, technical skills..."
        interestsLabel = "What new fields or industries are you interested in exploring?"
        interestsPlaceholder = "E.g., emerging industries, fields aligned with your values, growth sectors..."
      }

      return [
        {
          id: "skills",
          label: skillsLabel,
          type: "textarea",
          placeholder: skillsPlaceholder,
        },
        {
          id: "interests",
          label: interestsLabel,
          type: "textarea",
          placeholder: interestsPlaceholder,
        },
        {
          id: "projectUrl",
          label:
            ageGroup === "student" || ageGroup === "college"
              ? "Portfolio, Project, or Social Media URL (Optional)"
              : "Portfolio or Project URL (Optional)",
          type: "url",
          placeholder:
            ageGroup === "student"
              ? "https://github.com/yourusername/project or social media profile"
              : "https://github.com/yourusername/project",
        },
      ]
    }

    // For step 3 (work style), enhance the options based on age group
    if (currentStep === 3) {
      let workStyleLabel = "How do you prefer to work?"
      let workStyleOptions = [
        { value: "remote", label: "Remote Work" },
        { value: "office", label: "Office-Based" },
        { value: "hybrid", label: "Hybrid" },
        { value: "flexible", label: "Flexible Hours" },
        { value: "structured", label: "Structured Environment" },
        { value: "collaborative", label: "Team-Based/Collaborative" },
        { value: "independent", label: "Independent/Self-Directed" },
      ]

      // Customize work style options based on age group
      if (ageGroup === "student") {
        workStyleLabel = "How do you prefer to learn and work on projects?"
        workStyleOptions = [
          { value: "structured", label: "Structured Environment with Clear Guidelines" },
          { value: "collaborative", label: "Team Projects and Group Work" },
          { value: "independent", label: "Independent Study and Self-Directed Projects" },
          { value: "handson", label: "Hands-on, Practical Learning" },
          { value: "creative", label: "Creative, Open-Ended Assignments" },
          { value: "internship", label: "Internship/Part-time Work Experience" },
          { value: "projectBased", label: "Project-Based Learning" },
        ]
      } else if (ageGroup === "college") {
        workStyleLabel = "What type of work or academic environment do you prefer?"
        workStyleOptions = [
          { value: "research", label: "Research-Oriented" },
          { value: "practical", label: "Practical Application" },
          { value: "collaborative", label: "Collaborative Team Projects" },
          { value: "independent", label: "Independent Study" },
          { value: "structured", label: "Structured Environment" },
          { value: "flexible", label: "Flexible Schedule" },
          { value: "internship", label: "Internship/Part-time" },
          { value: "projectBased", label: "Project-Based Work" },
        ]
      } else if (ageGroup === "earlyCareer") {
        workStyleOptions.push(
          { value: "fastPaced", label: "Fast-Paced Environment" },
          { value: "mentored", label: "Mentorship Opportunities" },
          { value: "growthFocused", label: "Growth-Focused Culture" },
        )
      } else if (ageGroup === "midCareer") {
        workStyleOptions.push(
          { value: "leadership", label: "Leadership Opportunities" },
          { value: "strategic", label: "Strategic Decision-Making" },
          { value: "mentoring", label: "Mentoring Junior Colleagues" },
        )
      } else if (ageGroup === "lateCareer") {
        workStyleLabel = "What type of work arrangement would you prefer at this stage?"
        workStyleOptions.push(
          { value: "consulting", label: "Consulting/Advisory Role" },
          { value: "partTime", label: "Part-Time Arrangement" },
          { value: "mentoring", label: "Mentoring and Knowledge Transfer" },
          { value: "legacy", label: "Legacy-Building Projects" },
        )
      } else if (ageGroup === "careerChange") {
        workStyleLabel = "What type of work environment are you looking for in your new career?"
        workStyleOptions.push(
          { value: "mentorship", label: "Mentorship Opportunities" },
          { value: "retraining", label: "Retraining Programs" },
          { value: "entryLevel", label: "Entry-Level with Growth Potential" },
          { value: "supportive", label: "Supportive Learning Environment" },
        )
      }

      return [
        {
          id: "workStyle",
          label: workStyleLabel,
          type: "select",
          options: workStyleOptions,
        },
      ]
    }

    // Age-specific questions
    if (currentStep === 4) {
      switch (ageGroup) {
        case "student":
          return [
            {
              id: "favoriteSubjects",
              label: "What are your favorite subjects in school?",
              type: "textarea",
              placeholder: "E.g., mathematics, biology, literature, art, computer science, history, physics...",
            },
            {
              id: "extracurriculars",
              label: "What extracurricular activities are you involved in?",
              type: "textarea",
              placeholder: "E.g., sports teams, clubs, volunteer work, student government, music, debate...",
            },
            {
              id: "careerGoals",
              label: "What are your early career goals or aspirations?",
              type: "textarea",
              placeholder: "E.g., college plans, fields you're curious about, dream jobs, impact you want to make...",
            },
          ]

        case "college":
          return [
            {
              id: "major",
              label: "What is your major or field of study?",
              type: "input",
              placeholder: "E.g., Computer Science, Business, Psychology, Engineering, Arts...",
            },
            {
              id: "minors",
              label: "Do you have any minors or secondary fields of study?",
              type: "input",
              placeholder: "E.g., Mathematics, Economics, Art, Communication, Data Science...",
            },
            {
              id: "internships",
              label: "Have you completed any internships or work experiences?",
              type: "textarea",
              placeholder: "Describe any internships, part-time jobs, or relevant experiences...",
            },
            {
              id: "academicInterests",
              label: "What specific topics within your field interest you the most?",
              type: "textarea",
              placeholder: "E.g., specific research areas, technologies, theories, or applications...",
            },
          ]

        case "earlyCareer":
          return [
            {
              id: "workExperience",
              label: "Describe your work experience so far",
              type: "textarea",
              placeholder: "Include roles, responsibilities, industries, and years of experience...",
            },
            {
              id: "achievements",
              label: "What are your key professional achievements?",
              type: "textarea",
              placeholder: "Projects completed, awards, promotions, or other accomplishments...",
            },
            {
              id: "certifications",
              label: "Do you have any professional certifications or specialized training?",
              type: "textarea",
              placeholder: "List any certifications, courses, or specialized training you've completed...",
            },
            {
              id: "careerAspirations",
              label: "Where do you see your career heading in the next 5 years?",
              type: "textarea",
              placeholder: "E.g., leadership roles, specialization, industry change, skill development...",
            },
          ]

        case "midCareer":
          return [
            {
              id: "workExperience",
              label: "Summarize your career journey and current role",
              type: "textarea",
              placeholder: "Include key roles, industries, and areas of expertise developed over your career...",
            },
            {
              id: "achievements",
              label: "What are your most significant professional accomplishments?",
              type: "textarea",
              placeholder: "Major projects, leadership roles, innovations, or business impact...",
            },
            {
              id: "certifications",
              label: "What specialized knowledge or credentials have you acquired?",
              type: "textarea",
              placeholder: "Advanced certifications, specialized training, or expertise areas...",
            },
            {
              id: "careerChallenges",
              label: "What career challenges or growth opportunities are you currently facing?",
              type: "textarea",
              placeholder: "E.g., skill gaps, industry changes, leadership transitions, work-life balance...",
            },
          ]

        case "lateCareer":
          return [
            {
              id: "workExperience",
              label: "Describe your career journey and areas of expertise",
              type: "textarea",
              placeholder: "Include significant roles, industry experience, and specialized knowledge...",
            },
            {
              id: "achievements",
              label: "What are the major accomplishments that define your career?",
              type: "textarea",
              placeholder: "Leadership positions, major projects, mentorship, industry contributions...",
            },
            {
              id: "futureGoals",
              label: "What are your goals for this stage of your career?",
              type: "textarea",
              placeholder: "E.g., knowledge transfer, mentorship, consulting, reduced hours, new challenges...",
            },
            {
              id: "legacyInterests",
              label: "What aspects of your work or expertise would you like to pass on?",
              type: "textarea",
              placeholder: "Skills, knowledge, or values you'd like to share with the next generation...",
            },
          ]

        case "careerChange":
          return [
            {
              id: "reasonForChange",
              label: "Why are you considering a career change?",
              type: "textarea",
              placeholder:
                "E.g., seeking more fulfillment, better work-life balance, new challenges, industry shifts...",
            },
            {
              id: "transferableSkills",
              label: "What transferable skills do you have from your current/previous career?",
              type: "textarea",
              placeholder: "Skills that could be valuable in a different field or industry...",
            },
            {
              id: "desiredWorkEnvironment",
              label: "What type of work environment are you looking for in your new career?",
              type: "textarea",
              placeholder: "Describe your ideal workplace culture, values, and environment...",
            },
            {
              id: "newFieldInterests",
              label: "What fields or industries are you most interested in exploring?",
              type: "textarea",
              placeholder: "Areas you're curious about or have been researching for your career change...",
            },
            {
              id: "retrainingWillingness",
              label: "How open are you to additional education or training?",
              type: "select",
              options: [
                { value: "veryOpen", label: "Very open - willing to pursue degrees or certifications" },
                { value: "somewhatOpen", label: "Somewhat open - prefer shorter courses or on-the-job training" },
                { value: "minimalTraining", label: "Prefer minimal training - want to leverage existing skills" },
                { value: "undecided", label: "Undecided - depends on the field and requirements" },
              ],
            },
          ]

        default:
          return []
      }
    }

    // For step 5 (final questions), add more age-specific questions
    if (currentStep === 5) {
      const finalQuestions: Question[] = [
        {
          id: "languages",
          label: "What languages do you speak?",
          type: "textarea",
          placeholder: "E.g., English (native), Spanish (intermediate), French (basic)...",
        },
      ]

      // Add age-specific final questions
      if (ageGroup === "student") {
        finalQuestions.push(
          {
            id: "mentorshipInterest",
            label: "Are you interested in finding mentors in your field of interest?",
            type: "select",
            options: [
              { value: "veryInterested", label: "Very interested" },
              { value: "somewhatInterested", label: "Somewhat interested" },
              { value: "notInterested", label: "Not interested" },
            ],
          },
          {
            id: "learningStyle",
            label: "How do you learn best?",
            type: "select",
            options: [
              { value: "visual", label: "Visual (images, diagrams, videos)" },
              { value: "auditory", label: "Auditory (listening, discussions)" },
              { value: "reading", label: "Reading/Writing" },
              { value: "kinesthetic", label: "Hands-on/Practical application" },
              { value: "mixed", label: "Mixed approach" },
            ],
          },
        )
      } else if (ageGroup === "college") {
        finalQuestions.push(
          {
            id: "mentorshipInterest",
            label: "Are you interested in finding mentors in your field of interest?",
            type: "select",
            options: [
              { value: "veryInterested", label: "Very interested" },
              { value: "somewhatInterested", label: "Somewhat interested" },
              { value: "notInterested", label: "Not interested" },
            ],
          },
          {
            id: "graduationPlans",
            label: "What are your plans after graduation?",
            type: "select",
            options: [
              { value: "immediateWork", label: "Enter workforce immediately" },
              { value: "gradSchool", label: "Pursue graduate studies" },
              { value: "entrepreneurship", label: "Start a business/freelance" },
              { value: "fellowship", label: "Apply for fellowships/research positions" },
              { value: "undecided", label: "Still exploring options" },
            ],
          },
        )
      } else if (ageGroup === "earlyCareer") {
        finalQuestions.push(
          {
            id: "workLifeBalance",
            label: "How important is work-life balance in your career decisions?",
            type: "select",
            options: [
              { value: "veryImportant", label: "Very important - a top priority" },
              { value: "important", label: "Important but can be flexible" },
              { value: "neutral", label: "Neutral - depends on the opportunity" },
              { value: "lessImportant", label: "Less important than career advancement" },
            ],
          },
          {
            id: "careerGoals",
            label: "What are your primary career goals right now?",
            type: "select",
            options: [
              { value: "skillDevelopment", label: "Developing specialized skills" },
              { value: "advancement", label: "Advancing to higher positions" },
              { value: "stability", label: "Finding stability and security" },
              { value: "impact", label: "Making a meaningful impact" },
              { value: "compensation", label: "Increasing compensation" },
            ],
          },
        )
      } else if (ageGroup === "midCareer") {
        finalQuestions.push(
          {
            id: "workLifeBalance",
            label: "How important is work-life balance in your career decisions?",
            type: "select",
            options: [
              { value: "veryImportant", label: "Very important - a top priority" },
              { value: "important", label: "Important but can be flexible" },
              { value: "neutral", label: "Neutral - depends on the opportunity" },
              { value: "lessImportant", label: "Less important than career advancement" },
            ],
          },
          {
            id: "careerDirection",
            label: "What direction would you like your career to take now?",
            type: "select",
            options: [
              { value: "leadership", label: "Move into leadership/management" },
              { value: "specialization", label: "Deepen technical/domain expertise" },
              { value: "entrepreneurship", label: "Explore entrepreneurship opportunities" },
              { value: "stability", label: "Maintain stability with moderate growth" },
              { value: "newChallenges", label: "Take on new challenges in current field" },
            ],
          },
        )
      } else if (ageGroup === "lateCareer") {
        finalQuestions.push(
          {
            id: "workLifeBalance",
            label: "How important is work-life balance in your career decisions?",
            type: "select",
            options: [
              { value: "veryImportant", label: "Very important - a top priority" },
              { value: "important", label: "Important but can be flexible" },
              { value: "neutral", label: "Neutral - depends on the opportunity" },
              { value: "lessImportant", label: "Less important than career advancement" },
            ],
          },
          {
            id: "retirementPlans",
            label: "How are you thinking about retirement and career transition?",
            type: "select",
            options: [
              { value: "activeCareer", label: "Plan to remain fully active in career" },
              { value: "phaseOut", label: "Gradually phase into retirement" },
              { value: "consulting", label: "Transition to consulting/advisory roles" },
              { value: "teaching", label: "Move into teaching/mentoring" },
              { value: "newVentures", label: "Explore entirely new ventures or interests" },
            ],
          },
        )
      } else if (ageGroup === "careerChange") {
        finalQuestions.push(
          {
            id: "timeframe",
            label: "What is your timeframe for making this career change?",
            type: "select",
            options: [
              { value: "immediate", label: "As soon as possible" },
              { value: "sixMonths", label: "Within 6 months" },
              { value: "oneYear", label: "Within 1 year" },
              { value: "twoYears", label: "Within 2 years" },
              { value: "flexible", label: "Flexible/No specific timeline" },
            ],
          },
          {
            id: "riskTolerance",
            label: "How would you describe your tolerance for risk in this career change?",
            type: "select",
            options: [
              { value: "veryLow", label: "Very low - need security and stability" },
              { value: "moderate", label: "Moderate - some uncertainty is acceptable" },
              { value: "high", label: "High - willing to take significant risks for the right opportunity" },
              { value: "variable", label: "Depends on the potential rewards" },
            ],
          },
        )
      }

      return finalQuestions
    }

    return []
  }

  // Get total number of steps based on age group
  const getTotalSteps = (): number => {
    return 6 // Age group selection + 5 question steps
  }

  // Calculate progress percentage
  const getProgressPercentage = (): number => {
    return ((currentStep + 1) / getTotalSteps()) * 100
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const questions = getQuestions()

    // Age group selection
    if (currentStep === 0 && !ageGroup) {
      toast({
        title: "Please select an age group",
        description: "This helps us provide more relevant career suggestions",
        variant: "destructive",
      })
      return false
    }

    // For other steps, check if required fields are filled
    for (const question of questions) {
      // Skip validation for optional fields like projectUrl
      if (question.id === "projectUrl") continue

      const value = formData[question.id]
      if (!value || value.trim() === "") {
        toast({
          title: "Missing Information",
          description: `Please answer the question: ${question.label}`,
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  // Handle next step
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < getTotalSteps() - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/suggestProfession", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.limitReached) {
          toast({
            title: "Prediction Limit Reached",
            description: "You've reached the guest prediction limit. Please sign up for unlimited predictions.",
            variant: "destructive",
          })
          router.push("/signUp")
          return
        }
        throw new Error(errorData.error || "Failed to get career suggestions")
      }

      const data = (await response.json()) as CareerResult
      if (!data.iq || !data.professions || !data.details) {
        throw new Error("Invalid response format")
      }

      setResult(data)
      setCurrentStep(getTotalSteps()) // Move to results step

      // Update predictions count for guest users
      if (status === "unauthenticated") {
        setPredictionsCount((prev) => prev + 1)
      }

      toast({
        title: "Analysis Complete",
        description: "Your career suggestions are ready!",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Render question based on type
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case "textarea":
        return (
          <Textarea
            id={question.id}
            placeholder={question.placeholder}
            className="min-h-[120px]"
            value={formData[question.id]}
            onChange={(e) => handleChange(question.id, e.target.value)}
          />
        )

      case "input":
        return (
          <Input
            id={question.id}
            placeholder={question.placeholder}
            value={formData[question.id]}
            onChange={(e) => handleChange(question.id, e.target.value)}
          />
        )

      case "url":
        return <ProjectUrlInput value={formData[question.id] || ""} onChange={(value) => handleChange(question.id, value)} />

      case "select":
        return (
          <Select value={formData[question.id]} onValueChange={(value) => handleChange(question.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select your ${question.id}`} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero Section */}
      <section className="px-4 py-12 md:py-20 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Discover Your <span className="text-primary">Perfect Career</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 text-sm md:text-base lg:text-lg xl:text-xl">
            Let AI analyze your profile and suggest the ideal career path tailored just for you
          </p>
        </motion.div>

        {/* Badges - Stack on mobile */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
          <Badge variant="outline" className="text-xs sm:text-sm py-2 px-4">
            <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            AI-Powered Analysis
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm py-2 px-4">
            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Personalized Suggestions
          </Badge>
          <Badge variant="outline" className="text-xs sm:text-sm py-2 px-4">
            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Career Guidance
          </Badge>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="container mx-auto px-4 py-6 md:py-10">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="space-y-2 text-center sm:text-left">
            <CardTitle className="text-2xl sm:text-3xl">Career Profile Analysis</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {currentStep < getTotalSteps()
                ? "Answer a few questions to get personalized career suggestions"
                : "Your personalized career analysis based on your profile"}
            </CardDescription>
            {status === "unauthenticated" && <GuestAlert predictionsCount={predictionsCount} maxPredictions={3} />}
          </CardHeader>

          {/* Progress bar */}
          {currentStep < getTotalSteps() && (
            <div className="px-6">
              <Progress value={getProgressPercentage()} className="h-2" />
              <p className="text-xs text-muted-foreground text-right mt-1">
                Step {currentStep + 1} of {getTotalSteps()}
              </p>
            </div>
          )}

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Age group selection */}
            {currentStep === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select your current life stage:</h3>
                  <p className="text-sm text-muted-foreground">
                    This helps us tailor our questions and career suggestions to your specific situation.
                  </p>

                  <RadioGroup
                    value={ageGroup}
                    onValueChange={handleAgeGroupSelect}
                    className="grid gap-4 md:grid-cols-2 pt-2"
                  >
                    {AGE_GROUPS.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={group.value} id={group.id} />
                        <Label htmlFor={group.id} className="cursor-pointer">
                          {group.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </motion.div>
            )}

            {/* Question steps */}
            {currentStep > 0 && currentStep < getTotalSteps() && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {getQuestions().map((question) => (
                  <div key={question.id} className="space-y-3">
                    {question.type !== "url" && (
                      <Label htmlFor={question.id} className="text-base font-medium">
                        {question.label}
                      </Label>
                    )}
                    {renderQuestion(question)}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Results */}
            {currentStep === getTotalSteps() && result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">Important Disclaimer</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400">
                    <p className="mb-2">The career suggestions and IQ estimate provided are:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Based solely on the information you&apos;ve provided in this questionnaire</li>
                      <li>Not a substitute for professional career counseling or psychometric testing</li>
                      <li>Intended as exploratory guidance rather than definitive assessment</li>
                      <li>Limited by the AI&apos;s understanding of your unique circumstances</li>
                      <li>
                        Not considering all factors that influence career success (like local job markets, economic
                        conditions, etc.)
                      </li>
                    </ul>
                    <p className="mt-2">
                      We recommend using these insights as a starting point for further research and exploration.
                    </p>
                  </AlertDescription>
                </Alert>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Career Details</TabsTrigger>
                    <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            IQ Level Estimate
                          </CardTitle>
                          <CardDescription>Based on your profile analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <span className="text-5xl font-bold text-primary">{result.iq}</span>
                            <p className="text-sm text-muted-foreground mt-2">Estimated IQ Range</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Top Career Matches
                          </CardTitle>
                          <CardDescription>Recommended career paths</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.professions?.slice(0, 6).map((profession, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Badge variant="secondary">{index + 1}</Badge>
                                {profession}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="details">
                    <div className="space-y-4">
                      {result.details?.map((detail, index) => (
                        <CareerDetailCard
                          key={index}
                          title={detail.title}
                          match={detail.match}
                          description={detail.description}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="next-steps">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Next Steps</CardTitle>
                        <CardDescription>Follow these steps to pursue your career path</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {result.details?.map((detail, index) => (
                            <div key={index} className="space-y-2">
                              <h4 className="font-semibold text-lg flex items-center gap-2">
                                <Badge>{index + 1}</Badge> {detail.title}
                              </h4>
                              <ul className="list-disc list-inside space-y-1 pl-4">
                                <li>
                                  Complete relevant certifications or courses in {detail.title.toLowerCase()} field
                                </li>
                                <li>Build a portfolio showcasing your skills and projects</li>
                                <li>Network with professionals in this industry through LinkedIn or industry events</li>
                              </ul>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={resetForm}>
                    Start New Analysis
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>

          {/* Navigation buttons */}
          {currentStep > 0 && currentStep < getTotalSteps() && (
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevStep} disabled={loading}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button onClick={handleNextStep} disabled={loading}>
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : currentStep === getTotalSteps() - 1 ? (
                  "Get Results"
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-lg sm:text-xl">AI-Powered Analysis</CardTitle>
              <CardDescription className="text-sm">
                Advanced algorithms analyze your profile to provide accurate career suggestions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Personalized Matches</CardTitle>
              <CardDescription className="text-sm">
                Get career suggestions tailored to your unique combination of skills, experiences, and interests
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="flex flex-col h-full">
            <CardHeader>
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Career Guidance</CardTitle>
              <CardDescription className="text-sm">
                Receive detailed insights and next steps to pursue your ideal career path
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  )
}

