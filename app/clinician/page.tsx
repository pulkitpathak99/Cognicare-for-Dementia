"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, TrendingUp, TrendingDown, Users, Download, Search } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { storage } from "@/lib/storage"

interface PatientData {
  id: string
  name: string
  age: number
  lastAssessment: string
  riskScore: number
  riskLevel: "low" | "moderate" | "high"
  trend: "improving" | "stable" | "declining"
  assessmentHistory: Array<{
    date: string
    riskScore: number
    cognitiveScore: number
    speechScore: number
    behavioralScore: number
  }>
}

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState<PatientData[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState<string>("all")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginCode, setLoginCode] = useState("")

  useEffect(() => {
    // Check if clinician is authenticated
    const clinicianAuth = localStorage.getItem("clinician_authenticated")
    if (clinicianAuth === "true") {
      setIsAuthenticated(true)
      loadPatientData()
    }
  }, [])

  const handleLogin = () => {
    // Simple authentication for demo - in production, use proper auth
    if (loginCode === "CLINIC2025") {
      localStorage.setItem("clinician_authenticated", "true")
      setIsAuthenticated(true)
      loadPatientData()
    } else {
      alert("Invalid access code")
    }
  }

  const loadPatientData = () => {
    // Load all user profiles and generate mock patient data for demo
    const users = storage.getAllUsers()
    const mockPatients: PatientData[] = users.map((user, index) => {
      const baseRisk = Math.random() * 100
      const trend = Math.random() > 0.7 ? "declining" : Math.random() > 0.5 ? "stable" : "improving"

      return {
        id: user.id,
        name: user.name,
        age: user.age,
        lastAssessment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        riskScore: Math.round(baseRisk),
        riskLevel: baseRisk > 70 ? "high" : baseRisk > 40 ? "moderate" : "low",
        trend,
        assessmentHistory: Array.from({ length: 10 }, (_, i) => ({
          date: new Date(Date.now() - (9 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          riskScore: Math.round(baseRisk + (Math.random() - 0.5) * 20),
          cognitiveScore: Math.round(75 + (Math.random() - 0.5) * 30),
          speechScore: Math.round(80 + (Math.random() - 0.5) * 25),
          behavioralScore: Math.round(70 + (Math.random() - 0.5) * 35),
        })),
      }
    })

    setPatients(mockPatients)
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = filterRisk === "all" || patient.riskLevel === filterRisk
    return matchesSearch && matchesRisk
  })

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full bg-blue-600" />
    }
  }

  const exportPatientReport = (patient: PatientData) => {
    const report = {
      patientInfo: {
        name: patient.name,
        age: patient.age,
        lastAssessment: patient.lastAssessment,
      },
      currentStatus: {
        riskScore: patient.riskScore,
        riskLevel: patient.riskLevel,
        trend: patient.trend,
      },
      assessmentHistory: patient.assessmentHistory,
      recommendations: generateRecommendations(patient),
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${patient.name.replace(/\s+/g, "_")}_cognitive_report.json`
    a.click()
  }

  const generateRecommendations = (patient: PatientData) => {
    const recommendations = []

    if (patient.riskScore > 70) {
      recommendations.push("Immediate clinical evaluation recommended")
      recommendations.push("Consider neuropsychological testing")
      recommendations.push("Discuss with family about care planning")
    } else if (patient.riskScore > 40) {
      recommendations.push("Schedule follow-up assessment in 3 months")
      recommendations.push("Monitor cognitive activities and social engagement")
      recommendations.push("Consider lifestyle interventions")
    } else {
      recommendations.push("Continue regular monitoring")
      recommendations.push("Maintain healthy lifestyle practices")
      recommendations.push("Annual reassessment recommended")
    }

    return recommendations
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-medical-900">Clinician Access</CardTitle>
            <CardDescription>Enter your access code to view patient dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Access Code"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              className="text-center text-lg"
            />
            <Button onClick={handleLogin} className="w-full bg-medical-600 hover:bg-medical-700">
              Access Dashboard
            </Button>
            <p className="text-sm text-gray-600 text-center">Demo code: CLINIC2025</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-medical-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-medical-900">Clinician Dashboard</h1>
            <p className="text-medical-600">Monitor patient cognitive health and risk assessments</p>
          </div>
          <Button
            onClick={() => {
              localStorage.removeItem("clinician_authenticated")
              setIsAuthenticated(false)
            }}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-medical-600" />
                <div>
                  <p className="text-2xl font-bold text-medical-900">{patients.length}</p>
                  <p className="text-sm text-medical-600">Total Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {patients.filter((p) => p.riskLevel === "high").length}
                  </p>
                  <p className="text-sm text-red-600">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {patients.filter((p) => p.trend === "declining").length}
                  </p>
                  <p className="text-sm text-yellow-600">Declining</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {patients.filter((p) => p.trend === "improving").length}
                  </p>
                  <p className="text-sm text-green-600">Improving</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="patients">Patient List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Patient List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient List</CardTitle>
                  <CardDescription>{filteredPatients.length} patients found</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? "bg-medical-50 border-medical-200"
                            : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-medical-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">
                              Age {patient.age} • Last: {patient.lastAssessment}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(patient.trend)}
                            <Badge className={getRiskColor(patient.riskLevel)}>
                              {patient.riskLevel} ({patient.riskScore})
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Patient Details */}
              {selectedPatient && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedPatient.name}</CardTitle>
                        <CardDescription>Detailed Assessment View</CardDescription>
                      </div>
                      <Button onClick={() => exportPatientReport(selectedPatient)} size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Risk Score</p>
                        <p className="text-2xl font-bold text-medical-900">{selectedPatient.riskScore}/100</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Trend</p>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(selectedPatient.trend)}
                          <span className="capitalize font-medium">{selectedPatient.trend}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Risk Score Trend</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={selectedPatient.assessmentHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="riskScore" stroke="#dc2626" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {generateRecommendations(selectedPatient).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="w-2 h-2 bg-medical-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Patient risk level breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { level: "Low", count: patients.filter((p) => p.riskLevel === "low").length },
                        { level: "Moderate", count: patients.filter((p) => p.riskLevel === "moderate").length },
                        { level: "High", count: patients.filter((p) => p.riskLevel === "high").length },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trend Analysis</CardTitle>
                  <CardDescription>Patient cognitive trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { trend: "Improving", count: patients.filter((p) => p.trend === "improving").length },
                        { trend: "Stable", count: patients.filter((p) => p.trend === "stable").length },
                        { trend: "Declining", count: patients.filter((p) => p.trend === "declining").length },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trend" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#059669" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
