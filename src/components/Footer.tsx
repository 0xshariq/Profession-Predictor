import { Github, Linkedin, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { FadeIn } from "@/components/animations/fade-in"
import { StaggerChildren } from "@/components/animations/stagger-children"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/90">
      <div className="container px-4 py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <FadeIn delay={0.1} direction="up">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Profession Predictor</h3>
              <p className="text-sm text-muted-foreground">
                Empowering your career decisions with AI-driven insights and personalized guidance.
              </p>
              <StaggerChildren delay={0.2} staggerDelay={0.05} className="flex space-x-4">
                <Link
                  className="text-muted-foreground transition-colors hover:text-primary"
                  href="https://github.com/0xshariq"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link
                  className="text-muted-foreground transition-colors hover:text-primary"
                  href="https://x.com/Sharique_Ch"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </Link>
                <Link
                  className="text-muted-foreground transition-colors hover:text-primary"
                  href="https://www.linkedin.com/in/0xshariq"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
                <Link
                  className="text-muted-foreground transition-colors hover:text-primary"
                  href="https://www.instagram.com/sharique1303/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </Link>
              </StaggerChildren>
            </div>
          </FadeIn>

          {/* Quick Links */}
          <FadeIn delay={0.2} direction="up">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
              <StaggerChildren className="flex flex-col space-y-2">
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation w-fit"
                  href="/"
                >
                  Home
                </Link>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation w-fit"
                  href="/about"
                >
                  About Us
                </Link>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation w-fit"
                  href="/contact"
                >
                  Contact Us
                </Link>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation w-fit"
                  href="https://portfolio-sigma-rose-22.vercel.app/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Blog
                </Link>
              </StaggerChildren>
            </div>
          </FadeIn>

          {/* Contact Info */}
          <FadeIn delay={0.3} direction="up">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Contact Us</h3>
              <StaggerChildren className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground group">
                  <Mail className="h-4 w-4 text-primary/80 transition-transform group-hover:scale-110 group-hover:text-primary" />
                  <span className="group-hover:text-primary transition-colors">khanshariq92213@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground group">
                  <Phone className="h-4 w-4 text-primary/80 transition-transform group-hover:scale-110 group-hover:text-primary" />
                  <span className="group-hover:text-primary transition-colors">+91 72081 79779</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground group">
                  <MapPin className="h-4 w-4 text-primary/80 transition-transform group-hover:scale-110 group-hover:text-primary" />
                  <span className="group-hover:text-primary transition-colors">Mumbai, India - 400612</span>
                </div>
              </StaggerChildren>
            </div>
          </FadeIn>
        </div>

        {/* Bottom Footer */}
        <FadeIn delay={0.4} direction="up">
          <div className="mt-8 border-t border-border pt-8">
            <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Profession Predictor. All rights reserved.
              </p>
              <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation"
                  href="/privacy"
                >
                  Privacy Policy
                </Link>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation"
                  href="/terms"
                >
                  Terms of Service
                </Link>
                <Link
                  className="text-sm text-muted-foreground transition-colors hover:text-primary hover-underline-animation"
                  href="/cookies"
                >
                  Cookie Policy
                </Link>
              </nav>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  )
}
