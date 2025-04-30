import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { dbConnect } from "@/lib/dbConnect"
import GuestModel from "@/models/Guest.models"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { FormData, CareerDetail } from "@/types/form"

// Environment variable validation
if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is not defined in the environment variables.")
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

// Maximum number of predictions allowed for guest users
const MAX_GUEST_PREDICTIONS = 3

// Cache for common professions to avoid repetition
const COMMON_PROFESSIONS = [
  "Software Developer",
  "Data Analyst",
  "Project Manager",
  "Marketing Specialist",
  "Financial Advisor",
  "Business Consultant",
  "UX Designer",
  "Product Manager",
  "Digital Content Creator",
].join(", ")

// Fallback professions for when AI extraction fails
const FALLBACK_PROFESSIONS = [
  "Artificial Intelligence Specialist",
  "Sustainability Consultant",
  "Digital Transformation Manager",
  "User Experience Researcher",
  "Blockchain Developer",
  "Growth Marketing Strategist",
  "Cloud Solutions Architect",
  "Cybersecurity Analyst",
  "Data Privacy Officer",
  "E-commerce Operations Manager",
  "Virtual Reality Developer",
  "Healthcare Informatics Specialist",
  "Renewable Energy Consultant",
  "Remote Work Coordinator",
  "Bioinformatics Scientist",
  "Customer Experience Designer",
  "Supply Chain Analyst",
  "Agile Project Coach",
  "Content Marketing Strategist",
  "Robotics Engineer",
]

/**
 * Constructs a detailed user biography from form data
 * @param formData The user's form data
 * @returns A formatted string containing the user's profile information
 */
function constructUserBio(formData: FormData): string {
  // Create a structured bio with basic information
  const bio = new Map<string, string>()

  // Add basic information
  bio.set("Age Group", formData.ageGroup || "Not specified")
  bio.set("Education", formData.education || "Not specified")
  bio.set("Work Style Preference", formData.workStyle || "Not specified")

  // Add project URL if provided
  if (formData.projectUrl?.trim()) {
    bio.set("Portfolio/Project URL", formData.projectUrl)
  }

  // Add common fields
  bio.set("Skills", formData.skills || "Not specified")
  bio.set("Hobbies", formData.hobbies || "Not specified")
  bio.set("Interests", formData.interests || "Not specified")
  bio.set("Languages Known", formData.languages || "Not specified")

  // Add age-group specific information
  switch (formData.ageGroup) {
    case "student":
      bio.set("Favorite Subjects", formData.favoriteSubjects || "Not specified")
      bio.set("Extracurricular Activities", formData.extracurriculars || "Not specified")

      if (formData.careerGoals?.trim()) {
        bio.set("Early Career Goals", formData.careerGoals)
      }

      if (formData.mentorshipInterest?.trim()) {
        bio.set("Mentorship Interest", formData.mentorshipInterest)
      }

      if (formData.learningStyle?.trim()) {
        bio.set("Learning Style", formData.learningStyle)
      }
      break

    case "college":
      bio.set("Major", formData.major || "Not specified")
      bio.set("Minors/Secondary Fields", formData.minors || "Not specified")
      bio.set("Internships/Work Experience", formData.internships || "Not specified")

      if (formData.academicInterests?.trim()) {
        bio.set("Specific Academic Interests", formData.academicInterests)
      }

      if (formData.mentorshipInterest?.trim()) {
        bio.set("Mentorship Interest", formData.mentorshipInterest)
      }

      if (formData.graduationPlans?.trim()) {
        bio.set("Graduation Plans", formData.graduationPlans)
      }
      break

    case "earlyCareer":
    case "midCareer":
    case "lateCareer":
      bio.set("Work Experience", formData.workExperience || "Not specified")
      bio.set("Professional Achievements", formData.achievements || "Not specified")
      bio.set("Certifications/Specialized Training", formData.certifications || "Not specified")

      if (formData.workLifeBalance?.trim()) {
        bio.set("Work-Life Balance Importance", formData.workLifeBalance)
      }

      // Add career-stage specific fields
      if (formData.ageGroup === "earlyCareer" && formData.careerAspirations?.trim()) {
        bio.set("Career Aspirations (5-year)", formData.careerAspirations)
      } else if (formData.ageGroup === "midCareer") {
        if (formData.careerChallenges?.trim()) {
          bio.set("Current Career Challenges", formData.careerChallenges)
        }
        if (formData.careerDirection?.trim()) {
          bio.set("Career Direction", formData.careerDirection)
        }
      } else if (formData.ageGroup === "lateCareer") {
        if (formData.futureGoals?.trim()) {
          bio.set("Future Career Goals", formData.futureGoals)
        }
        if (formData.legacyInterests?.trim()) {
          bio.set("Legacy Interests", formData.legacyInterests)
        }
        if (formData.retirementPlans?.trim()) {
          bio.set("Retirement Plans", formData.retirementPlans)
        }
      }
      break

    case "careerChange":
      bio.set("Reason for Career Change", formData.reasonForChange || "Not specified")
      bio.set("Transferable Skills", formData.transferableSkills || "Not specified")
      bio.set("Desired Work Environment", formData.desiredWorkEnvironment || "Not specified")

      if (formData.newFieldInterests?.trim()) {
        bio.set("New Fields of Interest", formData.newFieldInterests)
      }

      if (formData.retrainingWillingness?.trim()) {
        bio.set("Willingness to Retrain", formData.retrainingWillingness)
      }

      if (formData.timeframe?.trim()) {
        bio.set("Timeframe for Change", formData.timeframe)
      }

      if (formData.riskTolerance?.trim()) {
        bio.set("Risk Tolerance", formData.riskTolerance)
      }
      break
  }

  // Convert the map to a formatted string
  let bioText = ""
  bio.forEach((value, key) => {
    bioText += `${key}: ${value}\n\n`
  })

  return bioText.trim()
}

/**
 * Extract professions from AI response text
 * @param text The AI response text
 * @param formData The user's form data for fallback generation
 * @returns Array of profession titles
 */
function extractProfessions(text: string, formData: FormData): string[] {
  // Try multiple extraction methods
  let professions: string[] = []

  // Method 1: Look for section headers
  const professionsMatch =
    text.match(/CAREER RECOMMENDATIONS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
    text.match(/CAREER SUGGESTIONS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
    text.match(/RECOMMENDED CAREERS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
    text.match(/CAREER PATHS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i)

  if (professionsMatch?.[1]) {
    professions = professionsMatch[1]
      .split(/\d+\.\s+/)
      .filter((p) => p.trim())
      .map((p) => p.replace(/^\s*-\s*/, "").trim())
  }

  // Method 2: Extract from detailed sections
  if (professions.length === 0) {
    const careerSections = text.split(/\d+\.\s+Title:|Career \d+:|Profession \d+:|Career Path \d+:/i)
    if (careerSections.length > 1) {
      professions = careerSections
        .slice(1) // Skip the first element which is before any title
        .map((section) => {
          const titleMatch = section.match(/^([^:]+?)(?:\r?\n|:)/) || section.match(/^([^(]+?)(?:\$\d+%\$|\d+%)/)
          return titleMatch ? titleMatch[1].trim() : ""
        })
        .filter((title) => title)
    }
  }

  // Method 3: Look for numbered lists
  if (professions.length === 0) {
    const numberedListMatch = text.match(/\d+\.\s+([^\n]+)/g)
    if (numberedListMatch) {
      professions = numberedListMatch
        .map((line) => line.replace(/^\d+\.\s+/, "").trim())
        .filter((title) => title && title.length < 100) // Avoid capturing entire paragraphs
    }
  }

  // Generate fallback professions if extraction failed
  if (professions.length === 0) {
    professions = generateFallbackProfessions(formData)
  }

  // Ensure uniqueness
  professions = [...new Set(professions)]

  // Ensure we have at least 10 professions
  if (professions.length < 10) {
    const additionalProfessions = getAdditionalProfessions(professions)
    professions = [...professions, ...additionalProfessions].slice(0, 10)
  }

  return professions
}

/**
 * Generate fallback professions based on user input
 * @param formData The user's form data
 * @returns Array of profession titles
 */
function generateFallbackProfessions(formData: FormData): string[] {
  const professions: string[] = []
  const skills = formData.skills?.toLowerCase() || ""
  const interests = formData.interests?.toLowerCase() || ""
  const education = formData.education?.toLowerCase() || ""

  // Generate professions based on user input
  if (skills.includes("programming") || skills.includes("coding") || interests.includes("technology")) {
    professions.push("Full Stack Developer", "Mobile App Developer", "DevOps Engineer")
  }

  if (skills.includes("writing") || interests.includes("writing") || interests.includes("content")) {
    professions.push("Technical Writer", "Content Strategist", "SEO Specialist")
  }

  if (skills.includes("design") || interests.includes("design") || interests.includes("creative")) {
    professions.push("UI/UX Designer", "Product Designer", "Brand Identity Designer")
  }

  if (skills.includes("data") || interests.includes("data") || interests.includes("analysis")) {
    professions.push("Business Intelligence Analyst", "Data Engineer", "Machine Learning Engineer")
  }

  if (education.includes("business") || interests.includes("business")) {
    professions.push("Business Development Manager", "Strategy Consultant", "Operations Manager")
  }

  // Add more based on age group
  if (formData.ageGroup === "student") {
    professions.push("Research Assistant", "Junior Content Creator", "Social Media Coordinator")
  } else if (formData.ageGroup === "midCareer" || formData.ageGroup === "lateCareer") {
    professions.push("Department Director", "Chief Technology Officer", "Executive Coach")
  }

  return professions
}

/**
 * Get additional professions to reach the required count
 * @param existingProfessions Already extracted professions
 * @returns Array of additional profession titles
 */
function getAdditionalProfessions(existingProfessions: string[]): string[] {
  const additionalProfessions: string[] = []
  const availableProfessions = [...FALLBACK_PROFESSIONS]

  // Shuffle the available professions for randomness
  for (let i = availableProfessions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[availableProfessions[i], availableProfessions[j]] = [availableProfessions[j], availableProfessions[i]]
  }

  // Add professions that aren't already in the list
  for (const profession of availableProfessions) {
    if (!existingProfessions.includes(profession)) {
      additionalProfessions.push(profession)

      // Stop when we have enough
      if (existingProfessions.length + additionalProfessions.length >= 10) {
        break
      }
    }
  }

  return additionalProfessions
}

/**
 * Extract career details from AI response text
 * @param text The AI response text
 * @param professions List of professions to match details to
 * @param formData The user's form data for fallback generation
 * @returns Array of career details
 */
function extractCareerDetails(text: string, professions: string[], formData: FormData): CareerDetail[] {
  let details: CareerDetail[] = []

  try {
    details = text
      .split(/\d+\.\s+Title:|Career \d+:|Profession \d+:|Career Path \d+:/i)
      .filter(
        (section) =>
          section.includes("Match:") ||
          section.includes("match:") ||
          section.includes("Match percentage:") ||
          (section.includes("(") && section.includes("%)")),
      )
      .map((section) => {
        const titleMatch = section.match(/^([^:]+?)(?:\r?\n|:)/) || section.match(/^([^(]+?)(?:\$\d+%\$|\d+%)/)
        const title = titleMatch ? titleMatch[1].trim() : "Career Option"

        const matchPercentage = Number.parseInt(
          section.match(/Match:\s*(\d+)%/i)?.[1] ||
            section.match(/match percentage:\s*(\d+)%/i)?.[1] ||
            section.match(/\$(\d+)%\$/i)?.[1] ||
            section.match(/(\d+)%/i)?.[1] ||
            "85",
        )

        // Get everything after the match percentage and simplify formatting
        const descriptionStart =
          section.indexOf("Match:") > -1
            ? section.indexOf("Match:")
            : section.indexOf("match percentage:") > -1
              ? section.indexOf("match percentage:")
              : section.indexOf("(") > -1 && section.indexOf(")") > -1
                ? section.indexOf(")") + 1
                : 0

        let description =
          descriptionStart > -1
            ? section
                .substring(descriptionStart)
                .replace(/^Match:\s*\d+%/, "")
                .replace(/^match percentage:\s*\d+%/, "")
                .replace(/^\$\d+%\$/, "")
                .trim()
            : section.trim()

        // Simplify formatting but preserve structure
        description = description
          .replace(/[•\-*]/g, "") // Remove bullets and special characters
          .replace(/\r?\n+/g, "\n") // Normalize line breaks
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n")

        return {
          title,
          match: matchPercentage,
          description,
        }
      })
  } catch (error) {
    console.error("Error parsing career details:", error)
    details = []
  }

  // Match details to professions to ensure consistency
  return matchDetailsWithProfessions(details, professions, formData)
}

/**
 * Match career details with professions
 * @param details Extracted career details
 * @param professions List of professions
 * @param formData The user's form data for fallback generation
 * @returns Array of matched career details
 */
function matchDetailsWithProfessions(
  details: CareerDetail[],
  professions: string[],
  formData: FormData,
): CareerDetail[] {
  return professions.map((profession) => {
    // Find a matching detail or create one
    const matchingDetail = details.find((d) => d.title === profession)
    if (matchingDetail) {
      return matchingDetail
    }

    // If no matching detail, create a new one
    const randomMatch = Math.floor(Math.random() * (98 - 70 + 1)) + 70

    // Create personalized description based on user input
    const skills = formData.skills?.split(",")[0] || "technical"
    const interests = formData.interests?.split(",")[0] || "interests"
    const workStyle = formData.workStyle || "flexible"

    return {
      title: profession,
      match: randomMatch,
      description: `
Skills Alignment: This career path aligns with your ${skills} skills and ${interests}.

Growth Potential: This field is experiencing significant growth with emerging opportunities in specialized areas.

Work-Life Balance: Typically offers a ${workStyle} schedule with options for remote work and project-based assignments.

Required Skills: Consider developing expertise in industry-specific tools and methodologies through specialized courses.

Salary Range: Entry-level positions typically start at $60,000-$75,000, with senior roles reaching $120,000-$150,000 depending on specialization and location.

Career Progression: Begin in an associate role, advance to specialist within 2-3 years, then to senior or lead positions by year 5, with management opportunities by year 7-10.`,
    }
  })
}

/**
 * Extract IQ estimate from AI response text
 * @param text The AI response text
 * @returns Extracted IQ value
 */
function extractIQ(text: string): number {
  // Default IQ range
  const defaultIQ = Math.floor(Math.random() * (140 - 110 + 1)) + 110

  // Try multiple extraction patterns
  const iqMatch =
    text.match(/IQ.*?(\d+)/i) ||
    text.match(/estimated IQ.*?(\d+)/i) ||
    text.match(/score of (\d+)/i) ||
    text.match(/intelligence.*?(\d+)/i)

  if (iqMatch?.[1]) {
    const extractedIQ = Number.parseInt(iqMatch[1])
    // Validate the IQ is in a reasonable range
    if (extractedIQ >= 90 && extractedIQ <= 150) {
      return extractedIQ
    }
  }

  return defaultIQ
}

/**
 * Handle guest user prediction limit
 * @param guestId The guest user ID
 * @returns Object containing limit status and updated prediction count
 */
async function handleGuestPredictionLimit(
  guestId: string | undefined,
): Promise<{ limitReached: boolean; updatedCount: number }> {
  if (!guestId) {
    return { limitReached: false, updatedCount: 0 }
  }

  try {
    await dbConnect()
    const guest = await GuestModel.findOne({ guestId })

    if (guest && guest.predictionsCount >= MAX_GUEST_PREDICTIONS) {
      return { limitReached: true, updatedCount: guest.predictionsCount }
    }

    // Increment prediction count for guest users
    if (guest) {
      guest.predictionsCount += 1
      guest.lastActive = new Date()
      await guest.save()
      return { limitReached: false, updatedCount: guest.predictionsCount }
    } // Closing brace added here
    // Create new guest record if it doesn't exist
    const newGuest = await GuestModel.create({
      guestId,
      predictionsCount: 1,
      createdAt: new Date(),
      lastActive: new Date(),
    })
    return { limitReached: false, updatedCount: newGuest.predictionsCount }
  } catch (error) {
    console.error("Error handling guest prediction limit:", error)
    return { limitReached: false, updatedCount: 0 }
  }
}

/**
 * Generate AI prompt for career suggestions
 * @param userBio The user's biography
 * @returns Prompt string for the AI model
 */
function generateAIPrompt(userBio: string): string {
  // Create a timestamp to ensure uniqueness in each request
  const timestamp = new Date().toISOString()

  // Generate a random seed for IQ calculation to ensure uniqueness
  const randomSeed = Math.floor(Math.random() * 1000).toString()

  return `As a career counselor AI, analyze the following personal profile to provide comprehensive and detailed career guidance:

CRITICAL INSTRUCTIONS (YOU MUST FOLLOW THESE EXACTLY):
- Generate EXACTLY 10 unique and highly specific career paths that precisely match this individual's profile
- DO NOT suggest generic careers like ${COMMON_PROFESSIONS} unless they truly match the specific skills and interests
- NEVER repeat the same set of professions you've suggested before
- Each career must be highly specific to the individual's unique combination of skills, interests, and background
- Each career must be a specific job title (e.g., "Quantum Computing Researcher" not just "Researcher")
- Analyze the skills, interests, and background in detail to find unique career matches
- If technical skills are mentioned, suggest technical careers; if creative skills, suggest creative careers
- If a project/portfolio URL is provided, analyze it deeply for additional insights
- Consider the person's age group, education level, and life stage for appropriate suggestions
- Vary the match percentages realistically between 70-98% based on actual alignment
- Generate a unique IQ estimate between 110-140 based on the complexity of skills, education level, and interests (use random seed: ${randomSeed})
- This request was made at ${timestamp} - ensure your response is unique and different from previous responses

For each career suggestion, include:
1. Title and match percentage
2. Skills Alignment: Current relevant skills and how they specifically apply to this career (be detailed)
3. Growth Potential: Industry outlook, emerging opportunities, and future trends in this specific field
4. Work-Life Balance: Detailed description of typical schedule, environment, and lifestyle considerations
5. Required Skills: Comprehensive list of skills to develop with specific recommendations for courses, certifications, or experiences
6. Salary Range: Expected compensation with progression details at different career stages
7. Career Progression: Detailed 5-10 year path with specific role transitions and milestones

Personal Profile:
${userBio}

Format the response as clear text without special characters or markdown formatting.
Make each career description unique, detailed, and actionable with specific next steps.`
}

/**
 * Generate fallback response when AI fails
 * @returns Fallback career suggestions
 */
function generateFallbackResponse(): { iq: number; professions: string[]; details: CareerDetail[] } {
  const iq = Math.floor(Math.random() * (140 - 110 + 1)) + 110

  const fallbackProfessions = [
    "Software Developer",
    "Data Analyst",
    "Project Manager",
    "Marketing Specialist",
    "Financial Advisor",
    "Business Consultant",
    "UX Designer",
    "Product Manager",
    "Digital Content Creator",
    "Cybersecurity Specialist",
  ]

  const fallbackDetails = [
    {
      title: "Software Developer",
      match: 92,
      description:
        "Skills Alignment: Your technical skills and problem-solving abilities make you well-suited for software development.\n\nGrowth Potential: The tech industry continues to expand with numerous opportunities.\n\nWork-Life Balance: Many companies offer flexible schedules and remote work options.\n\nRequired Skills: Consider strengthening your programming skills through online courses or bootcamps.\n\nSalary Range: Entry-level positions start at $70,000-$85,000, with senior roles reaching $120,000-$160,000.\n\nCareer Progression: Start as a junior developer, advance to mid-level in 2-3 years, and senior roles by year 5.",
    },
    {
      title: "Data Analyst",
      match: 88,
      description:
        "Skills Alignment: Your analytical abilities and attention to detail align well with data analysis.\n\nGrowth Potential: Data-driven decision making is becoming essential across industries.\n\nWork-Life Balance: Generally offers regular hours with some flexibility.\n\nRequired Skills: Focus on SQL, Excel, and data visualization tools like Tableau or Power BI.\n\nSalary Range: Starting salaries range from $60,000-$75,000, increasing to $90,000-$110,000 with experience.\n\nCareer Progression: Begin as a junior analyst, move to senior analyst in 3-4 years, with potential to become a data scientist or analytics manager.",
    },
    {
      title: "Project Manager",
      match: 85,
      description:
        "Skills Alignment: Your organizational and communication skills are valuable for project management.\n\nGrowth Potential: Project managers are needed across virtually all industries.\n\nWork-Life Balance: Can be demanding during critical project phases but generally predictable.\n\nRequired Skills: Consider PMP certification and experience with project management software.\n\nSalary Range: Entry positions start at $65,000-$80,000, with experienced managers earning $100,000-$130,000.\n\nCareer Progression: Start as a project coordinator, advance to project manager in 2-3 years, with senior or program management roles by year 6-7.",
    },
    {
      title: "Marketing Specialist",
      match: 82,
      description:
        "Skills Alignment: Your creativity and communication skills are well-suited for marketing roles.\n\nGrowth Potential: Digital marketing continues to expand with new channels and technologies.\n\nWork-Life Balance: Generally offers regular hours with occasional campaigns requiring extra time.\n\nRequired Skills: Develop knowledge of digital marketing platforms, analytics, and content creation.\n\nSalary Range: Entry-level positions range from $50,000-$65,000, with senior specialists earning $80,000-$100,000.\n\nCareer Progression: Begin as a marketing assistant, move to specialist in 1-2 years, and marketing manager by year 5.",
    },
    {
      title: "Financial Advisor",
      match: 78,
      description:
        "Skills Alignment: Your analytical skills and interest in helping others align with financial advising.\n\nGrowth Potential: Financial services remain essential with growing demand for personalized advice.\n\nWork-Life Balance: Often allows for flexible scheduling once established.\n\nRequired Skills: Consider financial certifications like CFP or Series 7 license.\n\nSalary Range: Starting around $55,000-$70,000, with experienced advisors earning $100,000-$150,000+.\n\nCareer Progression: Start as a financial analyst or junior advisor, build client base over 3-5 years, and advance to senior advisor or independent practice.",
    },
    {
      title: "Business Consultant",
      match: 75,
      description:
        "Skills Alignment: Your problem-solving abilities and business knowledge are valuable for consulting.\n\nGrowth Potential: Businesses continually seek expertise to improve operations and strategy.\n\nWork-Life Balance: Can involve travel and variable hours but often with flexibility.\n\nRequired Skills: Develop industry expertise, business analysis methods, and presentation skills.\n\nSalary Range: Entry positions start at $65,000-$85,000, with experienced consultants earning $120,000-$180,000+.\n\nCareer Progression: Begin as a junior consultant, advance to consultant in 2-3 years, and senior consultant or specialized expert by year 5-7.",
    },
    {
      title: "UX Designer",
      match: 73,
      description:
        "Skills Alignment: Your creative thinking and user-focused mindset are valuable for UX design.\n\nGrowth Potential: User experience is increasingly prioritized across digital products and services.\n\nWork-Life Balance: Generally offers good work-life balance with some deadline-driven periods.\n\nRequired Skills: Develop proficiency in design tools, user research methods, and prototyping.\n\nSalary Range: Entry positions start at $60,000-$75,000, with senior designers earning $100,000-$140,000+.\n\nCareer Progression: Start as a junior designer, advance to mid-level in 2-3 years, and senior or lead positions by year 5-7.",
    },
    {
      title: "Product Manager",
      match: 70,
      description:
        "Skills Alignment: Your strategic thinking and communication skills align well with product management.\n\nGrowth Potential: Product managers are in high demand across tech and other industries.\n\nWork-Life Balance: Can be demanding but offers intellectual stimulation and variety.\n\nRequired Skills: Develop product strategy, user research, and cross-functional collaboration skills.\n\nSalary Range: Starting around $70,000-$90,000, with experienced managers earning $120,000-$160,000+.\n\nCareer Progression: Begin as an associate product manager, advance to product manager in 2-3 years, and senior or director roles by year 6-8.",
    },
    {
      title: "Digital Content Creator",
      match: 68,
      description:
        "Skills Alignment: Your creativity and communication abilities are well-suited for content creation.\n\nGrowth Potential: Digital content continues to grow in importance for brands and marketing.\n\nWork-Life Balance: Can offer flexibility but may require consistent output and social media presence.\n\nRequired Skills: Develop content strategy, multimedia production, and audience engagement skills.\n\nSalary Range: Varies widely from $45,000-$70,000 for staff positions, with freelance and influencer potential much higher.\n\nCareer Progression: Start creating content in specific niches, build audience and portfolio, then expand to larger platforms or specialized content roles.",
    },
    {
      title: "Cybersecurity Specialist",
      match: 65,
      description:
        "Skills Alignment: Your analytical thinking and attention to detail are valuable for cybersecurity.\n\nGrowth Potential: Cybersecurity professionals are in extremely high demand across all industries.\n\nWork-Life Balance: Can involve on-call rotations but generally offers stable schedules.\n\nRequired Skills: Develop network security, threat analysis, and security tool proficiency.\n\nSalary Range: Entry positions start at $65,000-$85,000, with experienced specialists earning $110,000-$160,000+.\n\nCareer Progression: Begin as a security analyst, advance to security engineer in 2-3 years, and architect or management roles by year 5-7.",
    },
  ]

  return {
    iq,
    professions: fallbackProfessions,
    details: fallbackDetails,
  }
}

/**
 * API route handler for career suggestions
 * @param req The incoming request
 * @returns JSON response with career suggestions or error
 */
export async function POST(req: Request) {
  try {
    // Parse form data from request
    const formData = (await req.json()) as FormData

    // Check guest user prediction limit
    const cookieStore = await cookies()
    const guestId = cookieStore.get("guestId")?.value

    if (guestId) {
      const { limitReached, updatedCount } = await handleGuestPredictionLimit(guestId)

      if (limitReached) {
        return NextResponse.json(
          {
            error: "Guest prediction limit reached. Please sign up for unlimited predictions.",
            limitReached: true,
          },
          { status: 403 },
        )
      }

      // Log the updated prediction count for monitoring
      console.log(`Guest user ${guestId} has used ${updatedCount} predictions`)
    }

    // Convert form data to a structured biography for AI analysis
    const userBio = constructUserBio(formData)

    // Generate AI prompt
    const prompt = generateAIPrompt(userBio)

    // Initialize AI model with appropriate configuration
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.9,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      },
    })

    // Generate content with error handling and timeout
    const result = (await Promise.race([
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("AI request timed out")), 30000)),
    ]).catch((error) => {
      console.error("AI generation error:", error)
      throw new Error("Failed to generate AI response")
    })) as { response: { text: () => string } }

    // Extract text from response
    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error("Empty response from AI")
    }

    // Process AI response
    const iq = extractIQ(text)
    const professions = extractProfessions(text, formData)
    const details = extractCareerDetails(text, professions, formData)

    // Prepare final response
    const parsedResult = {
      iq,
      professions: professions.slice(0, 10),
      details: details.slice(0, 10),
    }

    // Log success for monitoring
    console.log(`Successfully generated career suggestions for ${formData.ageGroup} user`)

    return NextResponse.json(parsedResult)
  } catch (error) {
    // Log detailed error for debugging
    console.error("API Error:", error instanceof Error ? error.stack : error)

    // Return a fallback response if an error occurs
    return NextResponse.json(generateFallbackResponse())
  }
}
