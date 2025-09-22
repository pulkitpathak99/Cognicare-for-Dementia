"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Brain,
  Menu,
  Home,
  User,
  PaintRoller as GameController2,
  Mic,
  BarChart3,
  Activity,
  Stethoscope,
} from "lucide-react"

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/onboarding", label: "Get Started", icon: User },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/assessment/memory", label: "Memory Tests", icon: GameController2 },
  { href: "/assessment/attention", label: "Attention Tests", icon: GameController2 },
  { href: "/assessment/visuospatial", label: "Spatial Tests", icon: GameController2 },
  { href: "/assessment/speech", label: "Speech Analysis", icon: Mic },
  { href: "/behavioral", label: "Behavioral Analysis", icon: Activity },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/clinician", label: "Clinician Portal", icon: Stethoscope },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CogniCare</h1>
              <p className="text-sm text-muted-foreground">AI Dementia Detection</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm transition-colors ${
                pathname === "/dashboard" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/assessment/memory"
              className={`text-sm transition-colors ${
                pathname.startsWith("/assessment")
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Assessments
            </Link>
            <Link
              href="/behavioral"
              className={`text-sm transition-colors ${
                pathname === "/behavioral" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Behavioral
            </Link>
            <Link
              href="/results"
              className={`text-sm transition-colors ${
                pathname === "/results" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Results
            </Link>
            <Link
              href="/clinician"
              className={`text-sm transition-colors ${
                pathname === "/clinician" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Clinicians
            </Link>
            <Button asChild size="sm">
              <Link href="/onboarding">Get Started</Link>
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">CogniCare</span>
              </div>

              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
