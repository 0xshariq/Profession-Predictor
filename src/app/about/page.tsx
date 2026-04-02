"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Brain, GraduationCap, Users } from "lucide-react"

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header Section */}
      <section className="px-4 py-12 md:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            About <span className="text-primary">Profession Predictor</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground text-sm md:text-base lg:text-lg">
            Empowering your career decisions with AI-driven insights
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Our Mission</CardTitle>
              <CardDescription>Helping you discover your ideal career path</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Profession Predictor is an innovative platform that leverages the power of artificial intelligence to
                help individuals discover their ideal career paths. Our mission is to provide personalized career
                guidance and insights, empowering you to make informed decisions about your professional future.
              </p>
              <p>
                Founded by a team of career experts and AI enthusiasts, Profession Predictor combines cutting-edge
                technology with deep industry knowledge to analyze your skills, interests, and experiences. We then
                match you with potential career options that align with your unique profile.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card className="h-full">
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg sm:text-xl">AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              Our advanced algorithms process your profile data to provide accurate and personalized career suggestions.
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <Briefcase className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Comprehensive Insights</CardTitle>
            </CardHeader>
            <CardContent>
              Get detailed information about potential careers, including skills match, growth potential, and salary
              ranges.
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <GraduationCap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Continuous Learning</CardTitle>
            </CardHeader>
            <CardContent>
              We regularly update our AI models and career databases to ensure you receive the most relevant and
              up-to-date suggestions.
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-lg sm:text-xl">Expert Team</CardTitle>
            </CardHeader>
            <CardContent>
              Our team consists of career counselors, data scientists, and industry professionals dedicated to your
              success.
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At Profession Predictor, we&apos;re committed to continuous improvement and innovation. We understand
                that your career journey is unique, and our tool is designed to support and guide you along the way.
                While our AI-powered suggestions are insightful and thought-provoking, we always encourage users to
                consider these recommendations as starting points for further exploration and research.
              </p>
              <p>
                Thank you for choosing Profession Predictor. We&apos;re excited to be part of your career discovery
                journey!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}

