"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { Menu, Home, Info, Mail, LogIn, LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface NavbarUser {
  username?: string
  email?: string
  isGuest?: boolean
}

const Navbar = () => {
  const { data: session, status } = useSession()
  const user: NavbarUser = session?.user as NavbarUser
  const [isOpen, setIsOpen] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  // Check for scroll position to add shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Check for guest cookie if not authenticated via NextAuth
  useEffect(() => {
    const checkGuestStatus = async () => {
      if (status === "unauthenticated") {
        try {
          const response = await fetch("/api/guest/check")
          if (response.ok) {
            const data = await response.json()
            setIsGuest(data.isGuest)
          }
        } catch (error) {
          console.error("Error checking guest status:", error)
        }
      }
    }

    checkGuestStatus()
  }, [status])

  const handleSignOut = async () => {
    if (isGuest) {
      // Clear guest cookie
      await fetch("/api/guest/logout", { method: "POST" })
      setIsGuest(false)
    } else {
      // Sign out from NextAuth
      await signOut({ redirect: false })
    }

    setIsOpen(false)
    router.push("/signIn")
  }

  const menuItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
  ]

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${
        scrolled ? "shadow-md shadow-black/10" : ""
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link className="flex items-center space-x-2" href="/">
          <motion.span
            className="text-xl font-bold text-foreground"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Profession Predictor
          </motion.span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Link
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover-underline-animation"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
          {session || isGuest ? (
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-sm text-muted-foreground">
                {isGuest ? "Guest User" : `Welcome, ${user?.username || user?.email}`}
              </span>
              <Button onClick={handleSignOut}>Log Out</Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Link href="/signIn">
                <Button>Log In</Button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-border bg-background">
            <SheetHeader>
              <SheetTitle className="text-foreground">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col space-y-4">
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              {session || isGuest ? (
                <>
                  <motion.div
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <User className="h-5 w-5 text-primary/80" />
                    <span>{isGuest ? "Guest User" : user?.username || user?.email}</span>
                  </motion.div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button className="w-full" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out
                    </Button>
                  </motion.div>
                </>
              ) : (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Link href="/signIn" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">
                      <LogIn className="mr-2 h-4 w-4" />
                      Log In
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  )
}

export default Navbar
