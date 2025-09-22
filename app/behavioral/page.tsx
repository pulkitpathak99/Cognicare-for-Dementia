"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Users, Moon, Keyboard, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { behavioralAnalyzer } from "@/lib/behavioral-analysis"

export default function BehavioralAnalysis() {
  const [analysis, setAnalysis] = useState<any>(null)
  const [dataSummary, setDataSummary] = useState<any>(null)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // Check if user has consented to behavioral tracking
    const consent = localStorage.getItem("behavioral_consent")
    if (consent === "true") {
      setIsTracking(true)
      loadAnalysis()
    }
  }, [])

  const loadAnalysis = () => {
    const result = behavioralAnalyzer.analyzeBehavioralPatterns()
    const summary = behavioralAnalyzer.getDataSummary()
    setAnalysis(result)
    setDataSummary(summary)
  }

  const handleConsentGiven = () => {
    localStorage.setItem("behavioral_consent", "true")
    setIsTracking(true)
    loadAnalysis()
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  if (!isTracking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-medical-900">Behavioral Pattern Analysis</CardTitle>
              <CardDescription>Monitor your daily patterns to support cognitive health assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Privacy-First Monitoring</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      We analyze patterns in your device usage, activity levels, and interaction patterns to provide
                      insights into your cognitive health. All data stays on your device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-medical-900">What we monitor:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-medical-600" />
                      <span>Daily activity patterns and movement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-medical-600" />
                      <span>Sleep-wake cycles and screen time</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Keyboard className="h-4 w-4 text-medical-600" />
                      <span>Typing speed and accuracy patterns</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-medical-600" />
                      <span>App usage and interaction frequency</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-medical-900">Privacy guarantees:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>All data processed locally on your device</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>No personal content or messages analyzed</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>You can disable tracking anytime</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Data automatically deleted after 30 days</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button onClick={handleConsentGiven} className="bg-medical-600 hover:bg-medical-700">
                  Enable Behavioral Monitoring
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600 mx-auto mb-4"></div>
            <p className="text-medical-600">Analyzing behavioral patterns...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const radarData = [
    { domain: "Activity", score: analysis.activityScore },
    { domain: "Social", score: analysis.socialScore },
    { domain: "Sleep", score: analysis.circadianScore },
    { domain: "Motor", score: analysis.typingScore },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-medical-900">Behavioral Analysis</h1>
            <p className="text-medical-600">Monitor daily patterns for cognitive health insights</p>
          </div>
          <Button onClick={loadAnalysis} variant="outline">
            Refresh Analysis
          </Button>
        </div>

        {/* Overall Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-medical-900">Overall Behavioral Health</h2>
                <p className="text-medical-600">
                  Based on{" "}
                  {dataSummary?.activityDataPoints + dataSummary?.circadianDataPoints + dataSummary?.typingDataPoints}{" "}
                  data points
                </p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {Math.round(analysis.overallScore)}
                </div>
                <Badge className={getScoreBadge(analysis.overallScore)}>
                  {analysis.overallScore >= 70
                    ? "Healthy"
                    : analysis.overallScore >= 50
                      ? "Moderate"
                      : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Profile</CardTitle>
                  <CardDescription>Multi-dimensional behavioral assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="domain" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Domain Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Scores</CardTitle>
                  <CardDescription>Individual behavioral domain analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-5 w-5 text-medical-600" />
                        <span className="font-medium">Physical Activity</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.activityScore)}`}>
                        {Math.round(analysis.activityScore)}
                      </span>
                    </div>
                    <Progress value={analysis.activityScore} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-medical-600" />
                        <span className="font-medium">Social Interaction</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.socialScore)}`}>
                        {Math.round(analysis.socialScore)}
                      </span>
                    </div>
                    <Progress value={analysis.socialScore} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-5 w-5 text-medical-600" />
                        <span className="font-medium">Sleep Patterns</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.circadianScore)}`}>
                        {Math.round(analysis.circadianScore)}
                      </span>
                    </div>
                    <Progress value={analysis.circadianScore} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Keyboard className="h-5 w-5 text-medical-600" />
                        <span className="font-medium">Motor Skills</span>
                      </div>
                      <span className={`font-bold ${getScoreColor(analysis.typingScore)}`}>
                        {Math.round(analysis.typingScore)}
                      </span>
                    </div>
                    <Progress value={analysis.typingScore} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors */}
            {analysis.riskFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span>Identified Risk Factors</span>
                  </CardTitle>
                  <CardDescription>Areas that may need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.riskFactors.map((factor: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-red-800 text-sm">{factor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Collection Status</CardTitle>
                  <CardDescription>Current monitoring status across domains</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Activity Data Points</span>
                    <Badge variant="outline">{dataSummary?.activityDataPoints || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Sleep Data Points</span>
                    <Badge variant="outline">{dataSummary?.circadianDataPoints || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Typing Data Points</span>
                    <Badge variant="outline">{dataSummary?.typingDataPoints || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Last Updated</span>
                    <Badge variant="outline">
                      {dataSummary?.lastUpdated ? new Date(dataSummary.lastUpdated).toLocaleDateString() : "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy Controls</CardTitle>
                  <CardDescription>Manage your behavioral monitoring preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      localStorage.removeItem("behavioral_consent")
                      setIsTracking(false)
                    }}
                  >
                    Disable Behavioral Monitoring
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      // Clear behavioral data
                      localStorage.removeItem("behavioral_data")
                      loadAnalysis()
                    }}
                  >
                    Clear Historical Data
                  </Button>
                  <p className="text-xs text-gray-600">
                    Disabling monitoring will stop data collection but preserve existing analysis results.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Insights</CardTitle>
                  <CardDescription>AI-generated observations about your behavioral patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.insights.map((insight: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-800">{insight}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>Evidence-based suggestions for maintaining cognitive health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-medical-900">Physical Health</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Take regular walks or light exercise</li>
                        <li>• Maintain consistent sleep schedule</li>
                        <li>• Practice relaxation techniques</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-medical-900">Cognitive Health</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li>• Engage in social activities</li>
                        <li>• Practice mental exercises</li>
                        <li>• Maintain regular routines</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
