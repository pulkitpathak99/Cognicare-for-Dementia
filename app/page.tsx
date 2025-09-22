"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Users, Shield, Activity, ArrowRight, Heart, Clock, Award, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm mb-8">
            <Award className="w-4 h-4" />
            Developed for Ministry of Science & Technology
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Early Detection of <span className="text-primary">Dementia</span> Through AI
          </h1>

          <p className="text-xl text-muted-foreground text-balance mb-8 leading-relaxed">
            Accessible, low-cost screening tool that analyzes speech, behavioral patterns, and cognitive performance to
            identify early signs of cognitive decline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="button-large" asChild>
              <Link href="/onboarding">
                Start Assessment <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="button-large bg-transparent" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Elderly Friendly
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              15-Min Assessment
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Comprehensive Cognitive Assessment</h2>
            <p className="text-xl text-muted-foreground text-balance">
              Multi-modal AI analysis for accurate early detection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors group">
              <CardHeader>
                <Brain className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Cognitive Games</CardTitle>
                <CardDescription>
                  Memory, attention, and visuospatial assessments through engaging, gamified tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Paired Associates Learning</li>
                  <li>• Digital Trail Making</li>
                  <li>• Clock Drawing Test</li>
                  <li>• Puzzle Assembly</li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/assessment/memory">Try Memory Tests</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors group">
              <CardHeader>
                <Activity className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Speech Analysis</CardTitle>
                <CardDescription>
                  AI-powered analysis of speech patterns, fluency, and linguistic complexity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Acoustic feature analysis</li>
                  <li>• Lexical diversity measurement</li>
                  <li>• Semantic coherence scoring</li>
                  <li>• Multi-language support</li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/assessment/speech">Start Speech Test</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors group">
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Behavioral Patterns</CardTitle>
                <CardDescription>
                  Passive monitoring of daily activities and behavioral changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                  <li>• Activity level tracking</li>
                  <li>• Sleep pattern analysis</li>
                  <li>• Social interaction metrics</li>
                  <li>• Routine adherence monitoring</li>
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground bg-transparent"
                >
                  <Link href="/behavioral">View Analysis</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8">Quick Access</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/dashboard">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/results">
                  <Activity className="w-6 h-6 mb-2" />
                  View Results
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/behavioral">
                  <Users className="w-6 h-6 mb-2" />
                  Behavioral
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
                <Link href="/clinician">
                  <Shield className="w-6 h-6 mb-2" />
                  Clinicians
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Take the First Step Towards Early Detection</h2>
          <p className="text-xl text-muted-foreground mb-8 text-balance">
            Our AI-powered screening tool provides a comprehensive risk assessment to help identify potential cognitive
            concerns before they become severe.
          </p>
          <Button size="lg" className="button-large" asChild>
            <Link href="/onboarding">
              Begin Assessment <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold">CogniCare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered early dementia detection for better healthcare outcomes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-foreground">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Healthcare</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/clinician" className="hover:text-foreground">
                    For Clinicians
                  </Link>
                </li>
                <li>
                  <Link href="/research" className="hover:text-foreground">
                    Research
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-foreground">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CogniCare. Developed for Ministry of Science & Technology, DST.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
