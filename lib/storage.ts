export interface UserProfile {
  id: string
  name: string
  age: number
  email?: string
  phone?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory?: string[]
  cognitiveBaseline?: {
    memoryScore: number
    attentionScore: number
    visuospatialScore: number
    establishedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface AssessmentResult {
  id: string
  userId: string
  type: "memory" | "attention" | "visuospatial" | "speech" | "behavioral"
  score: number
  maxScore: number
  duration: number
  details: Record<string, any>
  completedAt: string
}

export interface DementiaRiskScore {
  id: string
  userId: string
  score: number // 0-100
  confidence: number
  factors: {
    cognitive: number
    speech: number
    behavioral: number
  }
  recommendations: string[]
  generatedAt: string
}

class LocalStorage {
  private getKey(type: string, id?: string): string {
    return id ? `cognicare_${type}_${id}` : `cognicare_${type}`
  }

  // User Profile Management
  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(this.getKey("profile", profile.id), JSON.stringify(profile))

    // Update user list
    const users = this.getAllUsers()
    const existingIndex = users.findIndex((u) => u.id === profile.id)
    if (existingIndex >= 0) {
      users[existingIndex] = profile
    } else {
      users.push(profile)
    }
    localStorage.setItem(this.getKey("users"), JSON.stringify(users))
  }

  getUserProfile(id: string): UserProfile | null {
    const data = localStorage.getItem(this.getKey("profile", id))
    return data ? JSON.parse(data) : null
  }

  getAllUsers(): UserProfile[] {
    const data = localStorage.getItem(this.getKey("users"))
    return data ? JSON.parse(data) : []
  }

  // Assessment Results
  saveAssessmentResult(result: AssessmentResult): void {
    const results = this.getUserAssessments(result.userId)
    results.push(result)
    localStorage.setItem(this.getKey("assessments", result.userId), JSON.stringify(results))
  }

  getUserAssessments(userId: string): AssessmentResult[] {
    const data = localStorage.getItem(this.getKey("assessments", userId))
    return data ? JSON.parse(data) : []
  }

  // Risk Scores
  saveRiskScore(riskScore: DementiaRiskScore): void {
    const scores = this.getUserRiskScores(riskScore.userId)
    scores.push(riskScore)
    localStorage.setItem(this.getKey("risk_scores", riskScore.userId), JSON.stringify(scores))
  }

  getUserRiskScores(userId: string): DementiaRiskScore[] {
    const data = localStorage.getItem(this.getKey("risk_scores", userId))
    return data ? JSON.parse(data) : []
  }

  getLatestRiskScore(userId: string): DementiaRiskScore | null {
    const scores = this.getUserRiskScores(userId)
    return scores.length > 0 ? scores[scores.length - 1] : null
  }

  // Data Export for Clinicians
  exportUserData(userId: string): string {
    const profile = this.getUserProfile(userId)
    const assessments = this.getUserAssessments(userId)
    const riskScores = this.getUserRiskScores(userId)

    return JSON.stringify(
      {
        profile,
        assessments,
        riskScores,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    )
  }
}

export const storage = new LocalStorage()
