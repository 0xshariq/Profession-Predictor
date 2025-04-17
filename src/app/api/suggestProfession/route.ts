import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { dbConnect } from "@/lib/dbConnect"
import GuestModel from "@/models/Guest.models"
import { GoogleGenerativeAI } from "@google/generative-ai"
import type { FormData } from "@/types/form"

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is not defined in the environment variables.")
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)

// Maximum number of predictions allowed for guest users
const MAX_GUEST_PREDICTIONS = 3

function constructUserBio(formData: FormData): string {
  let bio = `Age Group: ${formData.ageGroup || "Not specified"}\n`
  bio += `Education: ${formData.education || "Not specified"}\n`
  bio += `Work Style Preference: ${formData.workStyle || "Not specified"}\n\n`

  // Add project URL if provided
  if (formData.projectUrl) {
    bio += `Portfolio/Project URL: ${formData.projectUrl}\n\n`
  }

  bio += "Skills:\n"
  bio += formData.skills ? `${formData.skills}\n\n` : "Not specified\n\n"

  bio += "Hobbies:\n"
  bio += formData.hobbies ? `${formData.hobbies}\n\n` : "Not specified\n\n"

  bio += "Interests:\n"
  bio += formData.interests ? `${formData.interests}\n\n` : "Not specified\n\n"

  bio += "Languages Known:\n"
  bio += formData.languages ? `${formData.languages}\n\n` : "Not specified\n\n"

  // Add age-group specific information
  if (formData.ageGroup === "student") {
    bio += "Favorite Subjects:\n"
    bio += formData.favoriteSubjects ? `${formData.favoriteSubjects}\n\n` : "Not specified\n\n"

    bio += "Extracurricular Activities:\n"
    bio += formData.extracurriculars ? `${formData.extracurriculars}\n\n` : "Not specified\n\n"

    // Add new field
    if (formData.careerGoals) {
      bio += "Early Career Goals:\n"
      bio += `${formData.careerGoals}\n\n`
    }

    // Add mentorship interest if available
    if (formData.mentorshipInterest) {
      bio += "Mentorship Interest:\n"
      bio += `${formData.mentorshipInterest}\n\n`
    }
  }

  if (formData.ageGroup === "college") {
    bio += "Major:\n"
    bio += formData.major ? `${formData.major}\n\n` : "Not specified\n\n"

    bio += "Minors/Secondary Fields:\n"
    bio += formData.minors ? `${formData.minors}\n\n` : "Not specified\n\n"

    bio += "Internships/Work Experience:\n"
    bio += formData.internships ? `${formData.internships}\n\n` : "Not specified\n\n"

    // Add new field
    if (formData.academicInterests) {
      bio += "Specific Academic Interests:\n"
      bio += `${formData.academicInterests}\n\n`
    }

    // Add mentorship interest if available
    if (formData.mentorshipInterest) {
      bio += "Mentorship Interest:\n"
      bio += `${formData.mentorshipInterest}\n\n`
    }
  }

  if (["earlyCareer", "midCareer", "lateCareer"].includes(formData.ageGroup)) {
    bio += "Work Experience:\n"
    bio += formData.workExperience ? `${formData.workExperience}\n\n` : "Not specified\n\n"

    bio += "Professional Achievements:\n"
    bio += formData.achievements ? `${formData.achievements}\n\n` : "Not specified\n\n"

    bio += "Certifications/Specialized Training:\n"
    bio += formData.certifications ? `${formData.certifications}\n\n` : "Not specified\n\n"

    // Add career-specific fields
    if (formData.ageGroup === "earlyCareer" && formData.careerAspirations) {
      bio += "Career Aspirations (5-year):\n"
      bio += `${formData.careerAspirations}\n\n`
    }

    if (formData.ageGroup === "midCareer" && formData.careerChallenges) {
      bio += "Current Career Challenges:\n"
      bio += `${formData.careerChallenges}\n\n`
    }

    if (formData.ageGroup === "lateCareer") {
      if (formData.futureGoals) {
        bio += "Future Career Goals:\n"
        bio += `${formData.futureGoals}\n\n`
      }

      if (formData.legacyInterests) {
        bio += "Legacy Interests:\n"
        bio += `${formData.legacyInterests}\n\n`
      }
    }

    // Add work-life balance preference if available
    if (formData.workLifeBalance) {
      bio += "Work-Life Balance Importance:\n"
      bio += `${formData.workLifeBalance}\n\n`
    }
  }

  if (formData.ageGroup === "careerChange") {
    bio += "Reason for Career Change:\n"
    bio += formData.reasonForChange ? `${formData.reasonForChange}\n\n` : "Not specified\n\n"

    bio += "Transferable Skills:\n"
    bio += formData.transferableSkills ? `${formData.transferableSkills}\n\n` : "Not specified\n\n"

    bio += "Desired Work Environment:\n"
    bio += formData.desiredWorkEnvironment ? `${formData.desiredWorkEnvironment}\n\n` : "Not specified\n\n"

    // Add new fields
    if (formData.newFieldInterests) {
      bio += "New Fields of Interest:\n"
      bio += `${formData.newFieldInterests}\n\n`
    }

    if (formData.retrainingWillingness) {
      bio += "Willingness to Retrain:\n"
      bio += `${formData.retrainingWillingness}\n\n`
    }
  }

  return bio
}

// Update the POST function to better handle the AI response and ensure proper JSON formatting
export async function POST(req: Request) {
  try {
    const formData = (await req.json()) as FormData

    // Check guest user prediction limit
    const cookieStore = await cookies()
    const guestId = cookieStore.get("guestId")?.value

    if (guestId) {
      await dbConnect()
      const guest = await GuestModel.findOne({ guestId })

      if (guest && guest.predictionsCount >= MAX_GUEST_PREDICTIONS) {
        return NextResponse.json(
          {
            error: "Guest prediction limit reached. Please sign up for unlimited predictions.",
            limitReached: true,
          },
          { status: 403 },
        )
      }

      // Increment prediction count for guest users
      if (guest) {
        guest.predictionsCount += 1
        guest.lastActive = new Date()
        await guest.save()
      } else {
        // Create new guest record if it doesn't exist
        await GuestModel.create({
          guestId,
          predictionsCount: 1,
          createdAt: new Date(),
          lastActive: new Date(),
        })
      }
    }

    // Convert form data to a structured biography for AI analysis
    const userBio = constructUserBio(formData)

    // Create a timestamp to ensure uniqueness in each request
    const timestamp = new Date().toISOString()

    // List of common professions to avoid (unless they truly match the profile)
    const commonProfessions = [
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

    const prompt = `As a career counselor AI, analyze the following personal profile to provide comprehensive and detailed career guidance:

CRITICAL INSTRUCTIONS (YOU MUST FOLLOW THESE EXACTLY):
- Generate EXACTLY 6 unique and highly specific career paths that precisely match this individual's profile
- DO NOT suggest generic careers like ${commonProfessions} unless they truly match the specific skills and interests
- NEVER repeat the same set of professions you've suggested before
- Each career must be highly specific to the individual's unique combination of skills, interests, and background
- Each career must be a specific job title (e.g., "Quantum Computing Researcher" not just "Researcher")
- Analyze the skills, interests, and background in detail to find unique career matches
- If technical skills are mentioned, suggest technical careers; if creative skills, suggest creative careers
- If a project/portfolio URL is provided, analyze it deeply for additional insights
- Consider the person's age group, education level, and life stage for appropriate suggestions
- Vary the match percentages realistically between 70-98% based on actual alignment
- Generate a unique IQ estimate between 110-140 based on the complexity of skills, education level, and interests
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Set temperature higher to increase response variety
    const generationConfig = {
      temperature: 0.9, // Increased from default to encourage variety
      topP: 0.9,
      topK: 40,
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    })

    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error("Failed to get response from AI")
    }

    // Improved IQ extraction with fallback and range validation
    let iq = 120 // Default reasonable value if extraction fails
    const iqMatch = text.match(/IQ.*?(\d+)/i) || text.match(/estimated IQ.*?(\d+)/i) || text.match(/score of (\d+)/i) || null;
    if (iqMatch?.[1]) {
      const extractedIQ = Number.parseInt(iqMatch[1])
      // Validate the IQ is in a reasonable range
      if (extractedIQ >= 90 && extractedIQ <= 150) {
        iq = extractedIQ
      }
    }

    // Extract professions with better error handling
    const professionsMatch =
      text.match(/CAREER RECOMMENDATIONS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
      text.match(/CAREER SUGGESTIONS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
      text.match(/RECOMMENDED CAREERS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i) ||
      text.match(/CAREER PATHS:([\s\S]*?)(?=DETAILED ANALYSIS|$)/i)

    let professions: string[] = []
    if (professionsMatch?.[1]) {
      professions = professionsMatch[1]
        .split(/\d+\.\s+/)
        .filter((p) => p.trim())
        .map((p) => p.replace(/^\s*-\s*/, "").trim())
    } else {
      // If no section header, try to extract from the detailed sections
      const careerSections = text.split(/\d+\.\s+Title:|Career \d+:|Profession \d+:|Career Path \d+:/i)
      if (careerSections.length > 1) {
        professions = careerSections
          .slice(1) // Skip the first element which is before any title
          .map((section) => {
            const titleMatch = section.match(/^([^:]+?)(?:\r?\n|:)/) || section.match(/^([^(]+?)(?:$$\d+%$$|\d+%)/)
            return titleMatch ? titleMatch[1].trim() : ""
          })
          .filter((title) => title)
      }
    }

    // If we still couldn't extract professions, look for numbered lists
    if (professions.length === 0) {
      const numberedListMatch = text.match(/\d+\.\s+([^\n]+)/g)
      if (numberedListMatch) {
        professions = numberedListMatch
          .map((line) => line.replace(/^\d+\.\s+/, "").trim())
          .filter((title) => title && title.length < 100) // Avoid capturing entire paragraphs
      }
    }

    // Generate unique professions based on user input if extraction failed
    if (professions.length === 0) {
      // Create professions based on user skills and interests
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

      // Ensure uniqueness
      professions = [...new Set(professions)]
    }

    // Ensure we have exactly 6 professions with better fallbacks
    const fallbackProfessions = [
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

    // If we couldn't extract enough professions, add unique ones from our fallback list
    while (professions.length < 6) {
      const randomIndex = Math.floor(Math.random() * fallbackProfessions.length)
      const profession = fallbackProfessions[randomIndex]

      // Only add if not already in the list
      if (!professions.includes(profession)) {
        professions.push(profession)
      }

      // Remove from fallback list to avoid trying the same one again
      fallbackProfessions.splice(randomIndex, 1)

      // If we've exhausted our fallbacks, break to avoid infinite loop
      if (fallbackProfessions.length === 0) break
    }

    // Ensure we have exactly 6 professions
    professions = professions.slice(0, 6)

    // Extract detailed analysis with improved pattern matching
    // Define the CareerDetail type if not already defined
    type CareerDetail = {
      title: string;
      match: number;
      description: string;
    };
    
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
          const titleMatch = section.match(/^([^:]+?)(?:\r?\n|:)/) || section.match(/^([^(]+?)(?:$$\d+%$$|\d+%)/)
          const title = titleMatch ? titleMatch[1].trim() : "Career Option"

          const matchPercentage = Number.parseInt(
            section.match(/Match:\s*(\d+)%/i)?.[1] ||
              section.match(/match percentage:\s*(\d+)%/i)?.[1] ||
              section.match(/$$(\d+)%$$/i)?.[1] ||
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
                  .replace(/^$$\d+%$$/, "")
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
      // Fallback if parsing fails
      details = []
    }

    // Generate detailed descriptions for professions if we don't have enough
    if (details.length < professions.length) {
      // Create descriptions for professions that don't have details
      const existingTitles = details.map((d) => d.title)
      const professionsWithoutDetails = professions.filter((p) => !existingTitles.includes(p))

      // Generate details for each profession without details
      professionsWithoutDetails.forEach((profession, index) => {
        // Generate a match percentage that decreases slightly for each profession
        const match = 95 - index * 3

        // Create a description based on user input and profession
        let description = `Skills Alignment: This career aligns well with your ${formData.skills || "skills"} and interest in ${formData.interests || "your areas of interest"}.\n\n`

        description += `Growth Potential: The field of ${profession} is experiencing significant growth with emerging opportunities in specialized areas.\n\n`

        description += `Work-Life Balance: This career typically offers a ${formData.workStyle || "flexible"} work environment with opportunities for professional development.\n\n`

        description += `Required Skills: To excel in this field, consider developing expertise in industry-specific tools and methodologies through specialized courses related to ${profession}.\n\n`

        description += "Salary Range: Entry-level positions typically start at $65,000-$85,000, with senior roles reaching $120,000-$160,000 depending on specialization and location.\n\n"

        description += "Career Progression: Begin in an associate role, advance to specialist within 2-3 years, then to senior or lead positions by year 5, with management opportunities by year 7-10."

        details.push({
          title: profession,
          match,
          description,
        })
      })
    }

    // Ensure we have exactly 6 details
    details = details.slice(0, 6)

    // Match details to professions to ensure consistency
    const finalDetails = professions.map((profession, index) => {
      // Find a matching detail or create one
      const matchingDetail = details.find((d) => d.title === profession)
      if (matchingDetail) {
        return matchingDetail
      }

      // If no matching detail, use one from the details array or create a new one
      return (
        details[index] || {
          title: profession,
          match: 90 - index * 3,
          description: `
Skills Alignment: This career path aligns with your ${formData.skills ? formData.skills.split(",")[0] : "technical"} skills and ${formData.interests ? formData.interests.split(",")[0] : "interests"}.

Growth Potential: This field is experiencing significant growth with emerging opportunities in specialized areas.

Work-Life Balance: Typically offers a flexible schedule with options for remote work and project-based assignments.

Required Skills: Consider developing expertise in industry-specific tools and methodologies through specialized courses.

Salary Range: Entry-level positions typically start at $60,000-$75,000, with senior roles reaching $120,000-$150,000 depending on specialization and location.

Career Progression: Begin in an associate role, advance to specialist within 2-3 years, then to senior or lead positions by year 5, with management opportunities by year 7-10.`,
        }
      )
    })

    const parsedResult = {
      iq,
      professions: professions, // Ensure exactly 6 professions
      details: finalDetails, // Ensure exactly 6 details
    }

    return NextResponse.json(parsedResult)
  } catch (error) {
    console.error("API Error:", error)
    // Return a fallback response if an error occurs
    const fallbackResponse = {
      iq: 120,
      professions: [
        "Software Developer",
        "Data Analyst",
        "Project Manager",
        "Marketing Specialist",
        "Financial Advisor",
        "Business Consultant",
      ],
      details: [
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
      ],
    }
    return NextResponse.json(fallbackResponse)
  }
}
