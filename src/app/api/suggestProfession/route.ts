import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { dbConnect } from "@/lib/dbConnect"
import GuestModel from "@/models/Guest.models"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { FormData, CareerDetail } from "@/types/form"

// Maximum number of predictions allowed for guest users
const MAX_GUEST_PREDICTIONS = 3

// Diverse cross-domain fallback professions used when AI extraction partially fails
const FALLBACK_PROFESSIONS = [
  "Epidemiologist",
  "Astrophysicist",
  "Environmental Lawyer",
  "Clinical Psychologist",
  "Forensic Scientist",
  "Architectural Designer",
  "Marine Biologist",
  "Biomedical Engineer",
  "Science Journalist",
  "Urban Planner",
  "Renewable Energy Engineer",
  "Museum Curator",
  "Genetic Counselor",
  "Geospatial Analyst",
  "Occupational Therapist",
  "Documentary Filmmaker",
  "Agricultural Scientist",
  "International Development Consultant",
  "Sports Scientist",
  "Robotics Engineer",
]

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
    professions.push("Technical Writer", "Content Strategist", "Journalist")
  }

  if (skills.includes("design") || interests.includes("design") || interests.includes("creative")) {
    professions.push("UI/UX Designer", "Graphic Designer", "Concept Artist")
  }

  if (skills.includes("data") || interests.includes("data") || interests.includes("analysis")) {
    professions.push("Business Intelligence Analyst", "Data Engineer", "Statistician")
  }

  if (education.includes("business") || interests.includes("business")) {
    professions.push("Business Development Manager", "Strategy Consultant", "Operations Manager")
  }

  if (
    skills.includes("medicine") ||
    skills.includes("medical") ||
    interests.includes("health") ||
    education.includes("medicine") ||
    education.includes("biology")
  ) {
    professions.push("Medical Researcher", "Clinical Coordinator", "Healthcare Administrator")
  }

  if (
    interests.includes("astronomy") ||
    interests.includes("space") ||
    interests.includes("astrophysics") ||
    education.includes("physics")
  ) {
    professions.push("Astrophysicist", "Planetarium Educator", "Space Systems Analyst")
  }

  if (
    skills.includes("art") ||
    interests.includes("art") ||
    interests.includes("painting") ||
    interests.includes("drawing")
  ) {
    professions.push("Illustrator", "Art Director", "Visual Development Artist")
  }

  if (
    interests.includes("law") ||
    education.includes("law") ||
    interests.includes("legal") ||
    interests.includes("justice")
  ) {
    professions.push("Legal Researcher", "Policy Analyst", "Compliance Specialist")
  }

  if (
    interests.includes("sport") ||
    interests.includes("fitness") ||
    interests.includes("athletics") ||
    skills.includes("coaching")
  ) {
    professions.push("Sports Scientist", "Athletic Trainer", "Sports Journalist")
  }

  if (
    interests.includes("environment") ||
    interests.includes("ecology") ||
    interests.includes("nature") ||
    education.includes("environmental")
  ) {
    professions.push("Environmental Consultant", "Ecologist", "Sustainability Analyst")
  }

  // Add age-group context without tech bias
  if (formData.ageGroup === "student") {
    professions.push("Research Assistant", "Teaching Assistant", "Junior Content Creator")
  } else if (formData.ageGroup === "midCareer" || formData.ageGroup === "lateCareer") {
    professions.push("Senior Consultant", "Department Head", "Executive Coach")
  }

  return professions
}

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
    }
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

function generateAIPrompt(userBio: string): string {
  // Create a timestamp to ensure uniqueness in each request
  const timestamp = new Date().toISOString()

  // Generate a random seed for IQ calculation to ensure uniqueness
  const randomSeed = Math.floor(Math.random() * 1000).toString()

  return `You are a strict, unbiased career counselor AI. Your only job is to analyze the personal profile below and suggest careers that are DIRECTLY based on what the user has written — nothing else.

═══════════════════════════════════════════
MANDATORY RULES — VIOLATING ANY RULE IS NOT ALLOWED:
═══════════════════════════════════════════

RULE 1 — DOMAIN DISTRIBUTION (MOST IMPORTANT):
- Read ALL the fields in the profile carefully: skills, interests, hobbies, subjects, education, etc.
- Identify EVERY distinct domain the user has mentioned (e.g., medical, astronomy, coding, art, law, music, etc.)
- Distribute the 10 career suggestions PROPORTIONALLY across ALL identified domains
- Example: If user mentioned medical science + coding + astronomy → suggest ~3-4 medical careers, ~3 coding careers, ~3 astronomy careers
- NEVER let any single domain dominate all 10 suggestions unless the user ONLY mentioned that one domain
- If the user mentioned NO coding/tech at all → suggest ZERO tech careers

RULE 2 — STRICT INPUT FIDELITY:
- ONLY suggest careers that are directly supported by what the user wrote
- DO NOT invent interests the user never mentioned
- DO NOT default to tech/coding careers just because they are common
- If user wrote "astronomy and stargazing" → suggest Astrophysicist, Planetarium Educator, Space Mission Analyst, etc.
- If user wrote "medical science" → suggest Surgeon, Medical Researcher, Pharmacologist, Clinical Trials Coordinator, etc.
- If user wrote "painting and design" → suggest Illustrator, Art Director, Concept Artist, etc.

RULE 3 — SPECIFICITY:
- Each career must be a precise, specific job title — NOT generic
- BAD: "Researcher" | GOOD: "Computational Astrophysicist"
- BAD: "Doctor" | GOOD: "Neurologist" or "Pediatric Surgeon"

RULE 4 — NO BIAS TOWARD ANY FIELD:
- You have NO preference for tech, medical, creative, or any other field
- Treat all domains equally and recommend based purely on the user's profile
- NEVER pad the list with tech careers to reach 10 — use other relevant domains instead

RULE 5 — UNIQUENESS:
- Generate EXACTLY 10 careers
- All 10 must be different from each other
- Vary match percentages realistically between 70–98%
- Timestamp for uniqueness: ${timestamp} | Seed: ${randomSeed}

═══════════════════════════════════════════
FORMAT — For each of the 10 careers include:
═══════════════════════════════════════════
1. Title and match percentage
2. Skills Alignment: How the user's specific skills/interests apply to this career
3. Growth Potential: Industry outlook and emerging opportunities in this field
4. Work-Life Balance: Typical schedule, environment, and lifestyle
5. Required Skills: Skills to develop with specific courses or certifications
6. Salary Range: Compensation at entry, mid, and senior levels
7. Career Progression: 5–10 year roadmap with specific role transitions

Also estimate an IQ score between 110–140 based on the profile complexity.

═══════════════════════════════════════════
PERSONAL PROFILE TO ANALYZE:
═══════════════════════════════════════════
${userBio}

Format the response as plain text without markdown or special characters.
Base EVERY suggestion strictly on what is written in the profile above.`
}

function generateFallbackResponse(): { iq: number; professions: string[]; details: CareerDetail[] } {
  const iq = Math.floor(Math.random() * (140 - 110 + 1)) + 110

  // Shuffle FALLBACK_PROFESSIONS and pick 10 diverse entries
  const shuffled = [...FALLBACK_PROFESSIONS]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const professions = shuffled.slice(0, 10)

  const details: CareerDetail[] = professions.map((title) => ({
    title,
    match: Math.floor(Math.random() * (98 - 70 + 1)) + 70,
    description:
      `Skills Alignment: Your background and interests align with the core competencies required for this career.\n\n` +
      `Growth Potential: This field is experiencing strong demand with emerging specializations and long-term stability.\n\n` +
      `Work-Life Balance: Typically offers structured hours with flexibility that increases as you advance.\n\n` +
      `Required Skills: A solid foundation in the relevant discipline combined with practical, hands-on experience.\n\n` +
      `Salary Range: Entry-level positions start around $50,000–$75,000, with senior roles reaching $100,000–$150,000+.\n\n` +
      `Career Progression: Begin in an entry-level role, advance to specialist within 2–3 years, then to senior positions by year 5–7.`,
  }))

  return { iq, professions, details }
}
/**
 * API route handler for career suggestions
 * @param req The incoming request
 * @returns JSON response with career suggestions or error
 */
export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "AI service is not configured" }, { status: 503 })
    }
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

    // Parse form data from request
    const formData = (await req.json()) as FormData

    // Validate required fields
    const VALID_AGE_GROUPS = ["student", "college", "earlyCareer", "midCareer", "lateCareer", "careerChange"]
    if (!formData.ageGroup || !VALID_AGE_GROUPS.includes(formData.ageGroup)) {
      return NextResponse.json({ error: "Invalid or missing age group" }, { status: 400 })
    }

    // Check guest user prediction limit
    const cookieStore = await cookies()
    const guestId = cookieStore.get("guestId")?.value

    if (guestId) {
      const { limitReached } = await handleGuestPredictionLimit(guestId)

      if (limitReached) {
        return NextResponse.json(
          {
            error: "Guest prediction limit reached. Please sign up for unlimited predictions.",
            limitReached: true,
          },
          { status: 403 },
        )
      }

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

    return NextResponse.json(parsedResult)
  } catch (error) {
    // Log detailed error for debugging
    console.error("API Error:", error instanceof Error ? error.stack : error)

    // Return a fallback response if an error occurs
    return NextResponse.json(generateFallbackResponse())
  }
}
