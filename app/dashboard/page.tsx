"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Activity,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Settings,
  User,
  BarChart3,
} from "lucide-react"
import { storage, type UserProfile, type AssessmentResult, type DementiaRiskScore } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [latestRiskScore, setLatestRiskScore] = useState<DementiaRiskScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem("currentUserId")
    if (!userId) {
      router.push("/onboarding")
      return
    }

    const userProfile = storage.getUserProfile(userId)
    if (!userProfile) {
      router.push("/onboarding")
      return
    }

    setUser(userProfile)
    setAssessments(storage.getUserAssessments(userId))
    setLatestRiskScore(storage.getLatestRiskScore(userId))
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const hasBaseline = user.cognitiveBaseline !== undefined
  const completedAssessments = assessments.length
  const riskLevel = latestRiskScore
    ? latestRiskScore.score >= 70
      ? "high"
      : latestRiskScore.score >= 40
        ? "moderate"
        : "low"
    : "unknown"

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-destructive"
      case "moderate":
        return "text-warning"
      case "low":
        return "text-success"
      default:
        return "text-muted-foreground"
    }
  }

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "moderate":
        return "secondary"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CogniCare</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Cognitive Health Dashboard</h2>
          <p className="text-muted-foreground text-large">
            Track your cognitive health journey and stay informed about your brain wellness.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <AlertCircle className={`w-4 h-4 ${getRiskColor(riskLevel)}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{riskLevel}</div>
              <Badge variant={getRiskBadgeVariant(riskLevel)} className="mt-2">
                {latestRiskScore ? `${latestRiskScore.score}/100` : "Not assessed"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedAssessments}</div>
              <p className="text-xs text-muted-foreground">Completed tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baseline</CardTitle>
              <CheckCircle className={`w-4 h-4 ${hasBaseline ? "text-success" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hasBaseline ? "Set" : "Pending"}</div>
              <p className="text-xs text-muted-foreground">
                {hasBaseline ? "Established" : "Complete first assessment"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Assessment</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assessments.length > 0
                  ? new Date(assessments[assessments.length - 1].completedAt).toLocaleDateString()
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground">Most recent test</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Assessment Actions */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Cognitive Assessments
              </CardTitle>
              <CardDescription>
                {hasBaseline
                  ? "Continue monitoring your cognitive health with regular assessments"
                  : "Start with your first assessment to establish your cognitive baseline"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button className="button-large justify-start" asChild>
                  <Link href="/assessment/memory">
                    <Brain className="w-4 h-4 mr-2" />
                    Memory Test
                  </Link>
                </Button>
                <Button variant="outline" className="button-large justify-start bg-transparent" asChild>
                  <Link href="/assessment/attention">
                    <Activity className="w-4 h-4 mr-2" />
                    Attention Test
                  </Link>
                </Button>
                <Button variant="outline" className="button-large justify-start bg-transparent" asChild>
                  <Link href="/assessment/visuospatial">
                    <Users className="w-4 h-4 mr-2" />
                    Visual Test
                  </Link>
                </Button>
                <Button variant="outline" className="button-large justify-start bg-transparent" asChild>
                  <Link href="/assessment/speech">
                    <Activity className="w-4 h-4 mr-2" />
                    Speech Test
                  </Link>
                </Button>
              </div>
              {!hasBaseline && (
                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    <strong>Recommended:</strong> Start with the Memory Test to establish your cognitive baseline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Progress
              </CardTitle>
              <CardDescription>Track your cognitive health journey over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {latestRiskScore ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Overall Risk Score</span>
                      <span className="font-medium">{latestRiskScore.score}/100</span>
                    </div>
                    <Progress value={latestRiskScore.score} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Risk Factors</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Cognitive</span>
                        <span>{latestRiskScore.factors.cognitive}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Speech</span>
                        <span>{latestRiskScore.factors.speech}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Behavioral</span>
                        <span>{latestRiskScore.factors.behavioral}/100</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/results">
                      View Detailed Results
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No Assessment Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete your first assessment to see your progress here.
                  </p>
                  <Button asChild>
                    <Link href="/assessment/memory">Start First Assessment</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {assessments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.slice(-5).map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium capitalize">{assessment.type} Assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(assessment.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {assessment.score}/{assessment.maxScore}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((assessment.score / assessment.maxScore) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
