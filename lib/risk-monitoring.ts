import { storage, type UserProfile, type AssessmentResult, type DementiaRiskScore } from "./storage"

export interface RiskAlert {
  id: string
  userId: string
  type: "significant_decline" | "new_high_risk" | "baseline_deviation" | "assessment_needed"
  severity: "low" | "medium" | "high"
  message: string
  recommendations: string[]
  createdAt: string
  acknowledged: boolean
}

export interface TrendAnalysis {
  userId: string
  domain: "memory" | "attention" | "visuospatial" | "speech" | "overall"
  trend: "improving" | "stable" | "declining"
  changeRate: number // percentage change per month
  significance: number // statistical significance 0-1
  dataPoints: { date: string; score: number }[]
}

export class RiskMonitoringSystem {
  // Monitor for significant changes in cognitive performance
  analyzeRiskChanges(userId: string): RiskAlert[] {
    const user = storage.getUserProfile(userId)
    const assessments = storage.getUserAssessments(userId)
    const riskScores = storage.getUserRiskScores(userId)

    if (!user || assessments.length < 2) return []

    const alerts: RiskAlert[] = []

    // Check for significant decline in recent assessments
    const declineAlert = this.checkForCognitiveDecline(userId, assessments)
    if (declineAlert) alerts.push(declineAlert)

    // Check for new high-risk classification
    const highRiskAlert = this.checkForNewHighRisk(userId, riskScores)
    if (highRiskAlert) alerts.push(highRiskAlert)

    // Check for baseline deviation
    const baselineAlert = this.checkBaselineDeviation(userId, user, assessments)
    if (baselineAlert) alerts.push(baselineAlert)

    // Check if assessment is overdue
    const overdueAlert = this.checkAssessmentOverdue(userId, assessments)
    if (overdueAlert) alerts.push(overdueAlert)

    return alerts
  }

  private checkForCognitiveDecline(userId: string, assessments: AssessmentResult[]): RiskAlert | null {
    // Compare recent assessments to earlier ones
    const recentAssessments = assessments
      .filter((a) => new Date(a.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    const olderAssessments = assessments
      .filter((a) => new Date(a.completedAt) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    if (recentAssessments.length < 2 || olderAssessments.length < 2) return null

    const recentAvg = this.calculateAverageScore(recentAssessments.slice(0, 3))
    const olderAvg = this.calculateAverageScore(olderAssessments.slice(0, 3))

    const decline = olderAvg - recentAvg
    const declinePercentage = (decline / olderAvg) * 100

    if (declinePercentage > 15) {
      // Significant decline threshold
      return {
        id: `decline_${Date.now()}`,
        userId,
        type: "significant_decline",
        severity: declinePercentage > 25 ? "high" : "medium",
        message: `Significant decline detected in cognitive performance (${declinePercentage.toFixed(1)}% decrease)`,
        recommendations: [
          "Schedule follow-up assessment within 2 weeks",
          "Consider consultation with healthcare provider",
          "Review recent lifestyle changes or stressors",
          "Ensure adequate sleep and nutrition",
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }
    }

    return null
  }

  private checkForNewHighRisk(userId: string, riskScores: DementiaRiskScore[]): RiskAlert | null {
    if (riskScores.length < 2) return null

    const latest = riskScores[riskScores.length - 1]
    const previous = riskScores[riskScores.length - 2]

    if (latest.score >= 70 && previous.score < 70) {
      return {
        id: `high_risk_${Date.now()}`,
        userId,
        type: "new_high_risk",
        severity: "high",
        message: "Risk classification has changed to High Risk",
        recommendations: [
          "Immediate consultation with neurologist or geriatrician recommended",
          "Consider comprehensive neuropsychological testing",
          "Discuss results with primary care physician",
          "Schedule follow-up assessment in 3 months",
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }
    }

    return null
  }

  private checkBaselineDeviation(userId: string, user: UserProfile, assessments: AssessmentResult[]): RiskAlert | null {
    if (!user.cognitiveBaseline) return null

    const recentAssessments = assessments
      .filter((a) => new Date(a.completedAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)) // Last 2 weeks
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    if (recentAssessments.length === 0) return null

    const memoryAssessments = recentAssessments.filter((a) => a.type === "memory")
    const attentionAssessments = recentAssessments.filter((a) => a.type === "attention")

    let significantDeviation = false
    const deviations: string[] = []

    if (memoryAssessments.length > 0) {
      const recentMemoryScore = this.calculateAverageScore(memoryAssessments)
      const baselineMemory = user.cognitiveBaseline.memoryScore
      const deviation = ((baselineMemory - recentMemoryScore) / baselineMemory) * 100

      if (deviation > 20) {
        significantDeviation = true
        deviations.push(`Memory: ${deviation.toFixed(1)}% below baseline`)
      }
    }

    if (attentionAssessments.length > 0) {
      const recentAttentionScore = this.calculateAverageScore(attentionAssessments)
      const baselineAttention = user.cognitiveBaseline.attentionScore
      const deviation = ((baselineAttention - recentAttentionScore) / baselineAttention) * 100

      if (deviation > 20) {
        significantDeviation = true
        deviations.push(`Attention: ${deviation.toFixed(1)}% below baseline`)
      }
    }

    if (significantDeviation) {
      return {
        id: `baseline_${Date.now()}`,
        userId,
        type: "baseline_deviation",
        severity: "medium",
        message: `Performance significantly below established baseline: ${deviations.join(", ")}`,
        recommendations: [
          "Schedule comprehensive re-assessment",
          "Review recent health changes or medications",
          "Consider stress management techniques",
          "Discuss with healthcare provider",
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }
    }

    return null
  }

  private checkAssessmentOverdue(userId: string, assessments: AssessmentResult[]): RiskAlert | null {
    if (assessments.length === 0) return null

    const lastAssessment = assessments.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )[0]

    const daysSinceLastAssessment =
      (Date.now() - new Date(lastAssessment.completedAt).getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLastAssessment > 90) {
      // 3 months overdue
      return {
        id: `overdue_${Date.now()}`,
        userId,
        type: "assessment_needed",
        severity: "low",
        message: `Assessment overdue: ${Math.floor(daysSinceLastAssessment)} days since last assessment`,
        recommendations: [
          "Schedule regular cognitive assessment",
          "Maintain consistent monitoring schedule",
          "Consider setting assessment reminders",
        ],
        createdAt: new Date().toISOString(),
        acknowledged: false,
      }
    }

    return null
  }

  private calculateAverageScore(assessments: AssessmentResult[]): number {
    if (assessments.length === 0) return 0
    const totalScore = assessments.reduce((sum, assessment) => {
      return sum + (assessment.score / assessment.maxScore) * 100
    }, 0)
    return totalScore / assessments.length
  }

  // Generate trend analysis for different cognitive domains
  generateTrendAnalysis(userId: string): TrendAnalysis[] {
    const assessments = storage.getUserAssessments(userId)
    if (assessments.length < 3) return []

    const trends: TrendAnalysis[] = []
    const domains = ["memory", "attention", "visuospatial", "speech"] as const

    for (const domain of domains) {
      const domainAssessments = assessments
        .filter((a) => a.type === domain)
        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

      if (domainAssessments.length < 3) continue

      const dataPoints = domainAssessments.map((a) => ({
        date: a.completedAt,
        score: (a.score / a.maxScore) * 100,
      }))

      const trend = this.calculateTrend(dataPoints)
      trends.push({
        userId,
        domain,
        ...trend,
        dataPoints,
      })
    }

    return trends
  }

  private calculateTrend(dataPoints: { date: string; score: number }[]): {
    trend: "improving" | "stable" | "declining"
    changeRate: number
    significance: number
  } {
    if (dataPoints.length < 2) {
      return { trend: "stable", changeRate: 0, significance: 0 }
    }

    // Simple linear regression to calculate trend
    const n = dataPoints.length
    const dates = dataPoints.map((p) => new Date(p.date).getTime())
    const scores = dataPoints.map((p) => p.score)

    const sumX = dates.reduce((a, b) => a + b, 0)
    const sumY = scores.reduce((a, b) => a + b, 0)
    const sumXY = dates.reduce((sum, x, i) => sum + x * scores[i], 0)
    const sumXX = dates.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

    // Convert slope to percentage change per month
    const msPerMonth = 30 * 24 * 60 * 60 * 1000
    const changeRate = slope * msPerMonth

    // Calculate correlation coefficient for significance
    const meanX = sumX / n
    const meanY = sumY / n
    const numerator = dates.reduce((sum, x, i) => sum + (x - meanX) * (scores[i] - meanY), 0)
    const denomX = Math.sqrt(dates.reduce((sum, x) => sum + (x - meanX) ** 2, 0))
    const denomY = Math.sqrt(scores.reduce((sum, y) => sum + (y - meanY) ** 2, 0))
    const correlation = numerator / (denomX * denomY)
    const significance = Math.abs(correlation)

    let trend: "improving" | "stable" | "declining"
    if (Math.abs(changeRate) < 1) {
      trend = "stable"
    } else if (changeRate > 0) {
      trend = "improving"
    } else {
      trend = "declining"
    }

    return { trend, changeRate, significance }
  }
}

export const riskMonitor = new RiskMonitoringSystem()
