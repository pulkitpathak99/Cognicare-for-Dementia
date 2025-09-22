"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Download,
  Calendar,
  BarChart3,
  Target,
  Heart,
  Shield,
} from "lucide-react"
import { storage, type UserProfile, type AssessmentResult, type DementiaRiskScore } from "@/lib/storage"
import { aiCalculator, type CognitiveMetrics, type SpeechMetrics } from "@/lib/ai-core"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ResultsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [assessments, setAssessments] = useState<AssessmentResult[]>([])
  const [riskScore, setRiskScore] = useState<DementiaRiskScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

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

    const userAssessments = storage.getUserAssessments(userId)
    const latestRisk = storage.getLatestRiskScore(userId)

    setUser(userProfile)
    setAssessments(userAssessments)
    setRiskScore(latestRisk)

    // Generate new risk score if we have assessments but no recent score
    if (userAssessments.length > 0 && (!latestRisk || shouldUpdateRiskScore(latestRisk, userAssessments))) {
      generateRiskScore(userId, userProfile, userAssessments)
    }

    setLoading(false)
  }, [router])

  const shouldUpdateRiskScore = (existingScore: DementiaRiskScore, assessments: AssessmentResult[]): boolean => {
    const scoreDate = new Date(existingScore.generatedAt)
    const latestAssessment = assessments.reduce((latest, current) =>
      new Date(current.completedAt) > new Date(latest.completedAt) ? current : latest,
    )
    return new Date(latestAssessment.completedAt) > scoreDate
  }

  const generateRiskScore = async (userId: string, userProfile: UserProfile, assessments: AssessmentResult[]) => {
    setGenerating(true)

    try {
      // Aggregate cognitive metrics from assessments
      const cognitiveMetrics = calculateCognitiveMetrics(assessments)
      const speechMetrics = calculateSpeechMetrics(assessments)

      // Calculate overall risk using AI system
      const riskAnalysis = aiCalculator.calculateOverallRisk(
        cognitiveMetrics,
        speechMetrics,
        undefined, // No behavioral data yet
        userProfile.cognitiveBaseline,
      )

      // Generate recommendations
      const recommendations = aiCalculator.generateRecommendations(riskAnalysis.score, riskAnalysis.factors)

      const newRiskScore: DementiaRiskScore = {
        id: `risk_${Date.now()}`,
        userId,
        score: riskAnalysis.score,
        confidence: riskAnalysis.confidence,
        factors: riskAnalysis.factors,
        recommendations,
        generatedAt: new Date().toISOString(),
      }

      storage.saveRiskScore(newRiskScore)
      setRiskScore(newRiskScore)

      // Update cognitive baseline if this is the first comprehensive assessment
      if (!userProfile.cognitiveBaseline && assessments.length >= 3) {
        const updatedProfile: UserProfile = {
          ...userProfile,
          cognitiveBaseline: {
            memoryScore: cognitiveMetrics.memoryScore,
            attentionScore: cognitiveMetrics.attentionScore,
            visuospatialScore: cognitiveMetrics.visuospatialScore,
            establishedAt: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        }
        storage.saveUserProfile(updatedProfile)
        setUser(updatedProfile)
      }
    } catch (error) {
      console.error("Error generating risk score:", error)
    } finally {
      setGenerating(false)
    }
  }

  const calculateCognitiveMetrics = (assessments: AssessmentResult[]): CognitiveMetrics => {
    const memoryAssessments = assessments.filter((a) => a.type === "memory")
    const attentionAssessments = assessments.filter((a) => a.type === "attention")
    const visuospatialAssessments = assessments.filter((a) => a.type === "visuospatial")

    const memoryScore = memoryAssessments.length > 0 ? getAverageScore(memoryAssessments) : 50
    const attentionScore = attentionAssessments.length > 0 ? getAverageScore(attentionAssessments) : 50
    const visuospatialScore = visuospatialAssessments.length > 0 ? getAverageScore(visuospatialAssessments) : 50

    return {
      memoryScore,
      attentionScore,
      visuospatialScore,
      processingSpeed: attentionScore, // Use attention as proxy for processing speed
      executiveFunction: (memoryScore + attentionScore) / 2, // Combined metric
    }
  }

  const calculateSpeechMetrics = (assessments: AssessmentResult[]): SpeechMetrics | undefined => {
    const speechAssessments = assessments.filter((a) => a.type === "speech")
    if (speechAssessments.length === 0) return undefined

    const latestSpeech = speechAssessments[speechAssessments.length - 1]
    return latestSpeech.details.metrics as SpeechMetrics
  }

  const getAverageScore = (assessments: AssessmentResult[]): number => {
    const totalScore = assessments.reduce((sum, assessment) => {
      return sum + (assessment.score / assessment.maxScore) * 100
    }, 0)
    return totalScore / assessments.length
  }

  const getRiskLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 70) {
      return {
        level: "High Risk",
        color: "text-destructive",
        description: "Significant cognitive concerns detected",
      }
    } else if (score >= 40) {
      return {
        level: "Moderate Risk",
        color: "text-warning",
        description: "Some cognitive changes observed",
      }
    } else if (score >= 20) {
      return {
        level: "Low Risk",
        color: "text-success",
        description: "Minimal cognitive concerns",
      }
    } else {
      return {
        level: "Very Low Risk",
        color: "text-success",
        description: "Cognitive function appears normal",
      }
    }
  }

  const exportResults = () => {
    if (!user) return

    const exportData = storage.exportUserData(user.id)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cognicare-results-${user.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!user || assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <Card>
            <CardHeader>
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Assessment Data</CardTitle>
              <CardDescription>Complete some assessments to see your cognitive health results</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const riskInfo = riskScore ? getRiskLevel(riskScore.score) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Cognitive Health Results</h1>
              <p className="text-muted-foreground">Comprehensive analysis of your cognitive assessments</p>
            </div>
            <Button onClick={exportResults} variant="outline" className="bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Risk Score Overview */}
        {riskScore && riskInfo && (
          <Card className="mb-8 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Overall Risk Assessment</CardTitle>
                  <CardDescription>Based on your completed assessments</CardDescription>
                </div>
                <Badge
                  variant={riskScore.score >= 70 ? "destructive" : riskScore.score >= 40 ? "secondary" : "default"}
                >
                  {riskInfo.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Score Circle */}
                <div className="text-center">
                  <div className="relative w-48 h-48 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(riskScore.score / 100) * 251.2} 251.2`}
                        className={riskInfo.color}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{riskScore.score}</div>
                        <div className="text-sm text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                  </div>
                  <h3 className={`text-xl font-semibold ${riskInfo.color}`}>{riskInfo.level}</h3>
                  <p className="text-muted-foreground mt-2">{riskInfo.description}</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Confidence: {riskScore.confidence}%</span>
                  </div>
                </div>

                {/* Risk Factors Breakdown */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Risk Factor Analysis</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Cognitive Performance</span>
                        <span className="font-medium">{riskScore.factors.cognitive}/100</span>
                      </div>
                      <Progress value={riskScore.factors.cognitive} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Speech Patterns</span>
                        <span className="font-medium">{riskScore.factors.speech}/100</span>
                      </div>
                      <Progress value={riskScore.factors.speech} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Behavioral Patterns</span>
                        <span className="font-medium">{riskScore.factors.behavioral}/100</span>
                      </div>
                      <Progress value={riskScore.factors.behavioral} className="h-2" />
                    </div>
                  </div>

                  {generating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Updating risk analysis...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Results Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assessments.length}</div>
                  <p className="text-xs text-muted-foreground">Completed tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(getAverageScore(assessments))}%</div>
                  <p className="text-xs text-muted-foreground">Across all tests</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Assessment</CardTitle>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Date(assessments[assessments.length - 1].completedAt).toLocaleDateString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Most recent</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Baseline Status</CardTitle>
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.cognitiveBaseline ? "Set" : "Pending"}</div>
                  <p className="text-xs text-muted-foreground">Cognitive baseline</p>
                </CardContent>
              </Card>
            </div>

            {/* Assessment Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Breakdown</CardTitle>
                <CardDescription>Performance across different cognitive domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["memory", "attention", "visuospatial", "speech"].map((type) => {
                    const typeAssessments = assessments.filter((a) => a.type === type)
                    const avgScore = typeAssessments.length > 0 ? getAverageScore(typeAssessments) : 0

                    return (
                      <div key={type} className="text-center p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          {type === "memory" && <Brain className="w-6 h-6 text-primary" />}
                          {type === "attention" && <Activity className="w-6 h-6 text-primary" />}
                          {type === "visuospatial" && <Target className="w-6 h-6 text-primary" />}
                          {type === "speech" && <Heart className="w-6 h-6 text-primary" />}
                        </div>
                        <h3 className="font-semibold capitalize mb-2">{type}</h3>
                        <div className="text-2xl font-bold mb-2">{Math.round(avgScore)}%</div>
                        <p className="text-sm text-muted-foreground">{typeAssessments.length} tests</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
                <CardDescription>Detailed results from all completed assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments
                    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                    .map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            {assessment.type === "memory" && <Brain className="w-6 h-6 text-primary" />}
                            {assessment.type === "attention" && <Activity className="w-6 h-6 text-primary" />}
                            {assessment.type === "visuospatial" && <Target className="w-6 h-6 text-primary" />}
                            {assessment.type === "speech" && <Heart className="w-6 h-6 text-primary" />}
                          </div>
                          <div>
                            <h4 className="font-semibold capitalize">{assessment.type} Assessment</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(assessment.completedAt).toLocaleDateString()} •{" "}
                              {Math.floor(assessment.duration / 1000 / 60)}m{" "}
                              {Math.floor((assessment.duration / 1000) % 60)}s
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">
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
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Track your cognitive performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Trend Analysis Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Complete more assessments to see your cognitive performance trends over time.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {riskScore && riskScore.recommendations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Recommendations</CardTitle>
                  <CardDescription>Based on your assessment results and risk analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {riskScore.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-accent/10 rounded-lg">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-warning mb-1">Important Disclaimer</h4>
                        <p className="text-sm text-warning/80">
                          This tool is for screening purposes only and is not a diagnostic instrument. Please consult
                          with a healthcare professional for proper medical evaluation and diagnosis.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Complete more assessments to receive personalized recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete additional assessments to receive personalized health recommendations.
                    </p>
                    <Button asChild>
                      <Link href="/dashboard">Continue Assessments</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
