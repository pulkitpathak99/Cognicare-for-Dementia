interface ActivityPattern {
  timestamp: number
  activityLevel: number
  location?: string
  duration: number
}

interface SocialInteraction {
  timestamp: number
  type: "call" | "message" | "app_usage"
  duration: number
  frequency: number
}

interface CircadianData {
  timestamp: number
  screenTime: number
  sleepQuality: number
  activityLevel: number
}

interface TypingDynamics {
  timestamp: number
  keystrokeSpeed: number
  errorRate: number
  pauseDuration: number
  pressure: number
}

export class BehavioralAnalyzer {
  private activityData: ActivityPattern[] = []
  private socialData: SocialInteraction[] = []
  private circadianData: CircadianData[] = []
  private typingData: TypingDynamics[] = []

  constructor() {
    this.initializeTracking()
  }

  private initializeTracking() {
    // Initialize device motion tracking if available
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      this.startActivityTracking()
    }

    // Initialize typing dynamics tracking
    this.startTypingTracking()

    // Initialize circadian rhythm tracking
    this.startCircadianTracking()
  }

  private startActivityTracking() {
    let lastActivity = Date.now()
    let activityLevel = 0

    window.addEventListener("devicemotion", (event) => {
      const acceleration = event.acceleration
      if (acceleration) {
        const totalAcceleration = Math.sqrt(
          (acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2,
        )

        activityLevel = Math.min(totalAcceleration * 10, 100)

        this.activityData.push({
          timestamp: Date.now(),
          activityLevel,
          duration: Date.now() - lastActivity,
        })

        lastActivity = Date.now()
      }
    })

    // Track page visibility changes as activity indicator
    document.addEventListener("visibilitychange", () => {
      this.activityData.push({
        timestamp: Date.now(),
        activityLevel: document.hidden ? 0 : 50,
        duration: Date.now() - lastActivity,
      })
    })
  }

  private startTypingTracking() {
    let keystrokes: number[] = []
    let errors = 0
    let lastKeyTime = 0

    document.addEventListener("keydown", (event) => {
      const currentTime = Date.now()
      const timeDiff = currentTime - lastKeyTime

      keystrokes.push(timeDiff)

      // Simple error detection (backspace usage)
      if (event.key === "Backspace") {
        errors++
      }

      // Calculate metrics every 10 keystrokes
      if (keystrokes.length >= 10) {
        const avgSpeed = keystrokes.reduce((a, b) => a + b, 0) / keystrokes.length
        const errorRate = (errors / keystrokes.length) * 100

        this.typingData.push({
          timestamp: currentTime,
          keystrokeSpeed: 1000 / avgSpeed, // keystrokes per second
          errorRate,
          pauseDuration: Math.max(...keystrokes),
          pressure: event.key.length > 1 ? 0.5 : 1, // modifier keys have less pressure
        })

        keystrokes = []
        errors = 0
      }

      lastKeyTime = currentTime
    })
  }

  private startCircadianTracking() {
    let screenStartTime = Date.now()
    let dailyScreenTime = 0

    // Track screen time
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        dailyScreenTime += Date.now() - screenStartTime
      } else {
        screenStartTime = Date.now()
      }
    })

    // Record daily patterns
    setInterval(() => {
      const hour = new Date().getHours()
      const isNightTime = hour >= 22 || hour <= 6

      this.circadianData.push({
        timestamp: Date.now(),
        screenTime: dailyScreenTime,
        sleepQuality: isNightTime ? (dailyScreenTime > 3600000 ? 30 : 80) : 70, // Poor sleep if screen time > 1hr at night
        activityLevel: this.getRecentActivityLevel(),
      })

      // Reset daily screen time at midnight
      if (hour === 0) {
        dailyScreenTime = 0
      }
    }, 3600000) // Every hour
  }

  private getRecentActivityLevel(): number {
    const recentActivity = this.activityData.filter(
      (activity) => Date.now() - activity.timestamp < 3600000, // Last hour
    )

    if (recentActivity.length === 0) return 0

    return recentActivity.reduce((sum, activity) => sum + activity.activityLevel, 0) / recentActivity.length
  }

  public analyzeBehavioralPatterns(): {
    activityScore: number
    socialScore: number
    circadianScore: number
    typingScore: number
    overallScore: number
    insights: string[]
    riskFactors: string[]
  } {
    const activityScore = this.analyzeActivityPatterns()
    const socialScore = this.analyzeSocialPatterns()
    const circadianScore = this.analyzeCircadianPatterns()
    const typingScore = this.analyzeTypingPatterns()

    const overallScore = (activityScore + socialScore + circadianScore + typingScore) / 4

    const insights = this.generateInsights(activityScore, socialScore, circadianScore, typingScore)
    const riskFactors = this.identifyRiskFactors(activityScore, socialScore, circadianScore, typingScore)

    return {
      activityScore,
      socialScore,
      circadianScore,
      typingScore,
      overallScore,
      insights,
      riskFactors,
    }
  }

  private analyzeActivityPatterns(): number {
    if (this.activityData.length === 0) return 75 // Default score if no data

    const recentData = this.activityData.filter(
      (activity) => Date.now() - activity.timestamp < 7 * 24 * 60 * 60 * 1000, // Last week
    )

    const avgActivity = recentData.reduce((sum, activity) => sum + activity.activityLevel, 0) / recentData.length
    const consistency = this.calculateConsistency(recentData.map((a) => a.activityLevel))

    // Higher activity and consistency = better score
    return Math.min(100, avgActivity * 0.7 + consistency * 0.3)
  }

  private analyzeSocialPatterns(): number {
    // Simulate social interaction analysis
    // In a real implementation, this would analyze call logs, messaging patterns, etc.
    const baseScore = 70
    const randomVariation = (Math.random() - 0.5) * 20
    return Math.max(0, Math.min(100, baseScore + randomVariation))
  }

  private analyzeCircadianPatterns(): number {
    if (this.circadianData.length === 0) return 75

    const recentData = this.circadianData.filter((data) => Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)

    const avgSleepQuality = recentData.reduce((sum, data) => sum + data.sleepQuality, 0) / recentData.length
    const screenTimeConsistency = this.calculateConsistency(recentData.map((d) => d.screenTime))

    return avgSleepQuality * 0.6 + screenTimeConsistency * 0.4
  }

  private analyzeTypingPatterns(): number {
    if (this.typingData.length === 0) return 75

    const recentData = this.typingData.filter((data) => Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000)

    const avgSpeed = recentData.reduce((sum, data) => sum + data.keystrokeSpeed, 0) / recentData.length
    const avgErrorRate = recentData.reduce((sum, data) => sum + data.errorRate, 0) / recentData.length

    // Higher speed and lower error rate = better score
    const speedScore = Math.min(100, avgSpeed * 20) // Normalize speed
    const errorScore = Math.max(0, 100 - avgErrorRate * 2) // Lower error rate is better

    return speedScore * 0.6 + errorScore * 0.4
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 50

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)

    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - standardDeviation * 2)
  }

  private generateInsights(activity: number, social: number, circadian: number, typing: number): string[] {
    const insights = []

    if (activity < 50) {
      insights.push("Activity levels appear lower than typical - consider gentle exercise or movement")
    } else if (activity > 80) {
      insights.push("Excellent activity levels maintained - keep up the good work!")
    }

    if (social < 50) {
      insights.push(
        "Social interaction patterns suggest potential isolation - consider reaching out to friends or family",
      )
    }

    if (circadian < 50) {
      insights.push("Sleep patterns may be disrupted - consider establishing a regular bedtime routine")
    }

    if (typing < 50) {
      insights.push("Typing patterns show some changes - this could indicate motor skill variations")
    }

    if (insights.length === 0) {
      insights.push("Behavioral patterns appear stable and healthy")
    }

    return insights
  }

  private identifyRiskFactors(activity: number, social: number, circadian: number, typing: number): string[] {
    const riskFactors = []

    if (activity < 40) riskFactors.push("Significantly reduced physical activity")
    if (social < 40) riskFactors.push("Social withdrawal patterns detected")
    if (circadian < 40) riskFactors.push("Disrupted sleep-wake cycles")
    if (typing < 40) riskFactors.push("Changes in fine motor control")

    const lowScores = [activity, social, circadian, typing].filter((score) => score < 50).length
    if (lowScores >= 3) {
      riskFactors.push("Multiple behavioral domains showing concerning patterns")
    }

    return riskFactors
  }

  public getDataSummary() {
    return {
      activityDataPoints: this.activityData.length,
      socialDataPoints: this.socialData.length,
      circadianDataPoints: this.circadianData.length,
      typingDataPoints: this.typingData.length,
      lastUpdated: Math.max(
        ...this.activityData.map((d) => d.timestamp),
        ...this.circadianData.map((d) => d.timestamp),
        ...this.typingData.map((d) => d.timestamp),
      ),
    }
  }
}

// Export singleton instance
export const behavioralAnalyzer = new BehavioralAnalyzer()
