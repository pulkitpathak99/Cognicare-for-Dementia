export interface CognitiveMetrics {
  memoryScore: number
  attentionScore: number
  visuospatialScore: number
  processingSpeed: number
  executiveFunction: number
}

export interface SpeechMetrics {
  fluency: number
  coherence: number
  vocabularyDiversity: number
  pauseFrequency: number
  articulation: number
}

export interface BehavioralMetrics {
  activityLevel: number
  sleepPattern: number
  socialInteraction: number
  routineAdherence: number
}

export class AIRiskCalculator {
  // Cognitive assessment weights based on dementia research
  private cognitiveWeights = {
    memory: 0.35,
    attention: 0.25,
    visuospatial: 0.2,
    processingSpeed: 0.1,
    executiveFunction: 0.1,
  }

  // Speech analysis weights
  private speechWeights = {
    fluency: 0.3,
    coherence: 0.25,
    vocabularyDiversity: 0.2,
    pauseFrequency: 0.15,
    articulation: 0.1,
  }

  // Behavioral pattern weights
  private behavioralWeights = {
    activityLevel: 0.25,
    sleepPattern: 0.25,
    socialInteraction: 0.3,
    routineAdherence: 0.2,
  }

  calculateCognitiveRisk(metrics: CognitiveMetrics, baseline?: CognitiveMetrics): number {
    let riskScore = 0

    // Calculate deviation from baseline or normative data
    const memoryRisk = baseline
      ? Math.max(0, (baseline.memoryScore - metrics.memoryScore) / baseline.memoryScore)
      : Math.max(0, (85 - metrics.memoryScore) / 85) // Normative score of 85

    const attentionRisk = baseline
      ? Math.max(0, (baseline.attentionScore - metrics.attentionScore) / baseline.attentionScore)
      : Math.max(0, (80 - metrics.attentionScore) / 80)

    const visuospatialRisk = baseline
      ? Math.max(0, (baseline.visuospatialScore - metrics.visuospatialScore) / baseline.visuospatialScore)
      : Math.max(0, (75 - metrics.visuospatialScore) / 75)

    const processingRisk = baseline
      ? Math.max(0, (baseline.processingSpeed - metrics.processingSpeed) / baseline.processingSpeed)
      : Math.max(0, (70 - metrics.processingSpeed) / 70)

    const executiveRisk = baseline
      ? Math.max(0, (baseline.executiveFunction - metrics.executiveFunction) / baseline.executiveFunction)
      : Math.max(0, (75 - metrics.executiveFunction) / 75)

    riskScore =
      (memoryRisk * this.cognitiveWeights.memory +
        attentionRisk * this.cognitiveWeights.attention +
        visuospatialRisk * this.cognitiveWeights.visuospatial +
        processingRisk * this.cognitiveWeights.processingSpeed +
        executiveRisk * this.cognitiveWeights.executiveFunction) *
      100

    return Math.min(100, riskScore)
  }

  calculateSpeechRisk(metrics: SpeechMetrics): number {
    // Lower scores indicate higher risk for speech metrics
    const fluencyRisk = Math.max(0, (80 - metrics.fluency) / 80)
    const coherenceRisk = Math.max(0, (85 - metrics.coherence) / 85)
    const vocabularyRisk = Math.max(0, (75 - metrics.vocabularyDiversity) / 75)
    const pauseRisk = Math.min(1, metrics.pauseFrequency / 20) // Higher pause frequency = higher risk
    const articulationRisk = Math.max(0, (90 - metrics.articulation) / 90)

    const riskScore =
      (fluencyRisk * this.speechWeights.fluency +
        coherenceRisk * this.speechWeights.coherence +
        vocabularyRisk * this.speechWeights.vocabularyDiversity +
        pauseRisk * this.speechWeights.pauseFrequency +
        articulationRisk * this.speechWeights.articulation) *
      100

    return Math.min(100, riskScore)
  }

  calculateBehavioralRisk(metrics: BehavioralMetrics): number {
    // Behavioral risk indicators
    const activityRisk = Math.max(0, (70 - metrics.activityLevel) / 70)
    const sleepRisk = Math.abs(metrics.sleepPattern - 75) / 75 // Deviation from normal sleep
    const socialRisk = Math.max(0, (80 - metrics.socialInteraction) / 80)
    const routineRisk = Math.max(0, (85 - metrics.routineAdherence) / 85)

    const riskScore =
      (activityRisk * this.behavioralWeights.activityLevel +
        sleepRisk * this.behavioralWeights.sleepPattern +
        socialRisk * this.behavioralWeights.socialInteraction +
        routineRisk * this.behavioralWeights.routineAdherence) *
      100

    return Math.min(100, riskScore)
  }

  calculateOverallRisk(
    cognitiveMetrics: CognitiveMetrics,
    speechMetrics?: SpeechMetrics,
    behavioralMetrics?: BehavioralMetrics,
    baseline?: CognitiveMetrics,
  ): { score: number; confidence: number; factors: any } {
    const cognitiveRisk = this.calculateCognitiveRisk(cognitiveMetrics, baseline)
    const speechRisk = speechMetrics ? this.calculateSpeechRisk(speechMetrics) : 0
    const behavioralRisk = behavioralMetrics ? this.calculateBehavioralRisk(behavioralMetrics) : 0

    // Weight the different risk factors
    let totalWeight = 0.6 // Cognitive always present
    let weightedScore = cognitiveRisk * 0.6

    if (speechMetrics) {
      weightedScore += speechRisk * 0.25
      totalWeight += 0.25
    }

    if (behavioralMetrics) {
      weightedScore += behavioralRisk * 0.15
      totalWeight += 0.15
    }

    const overallScore = weightedScore / totalWeight

    // Confidence based on available data
    let confidence = 0.7 // Base confidence for cognitive data
    if (speechMetrics) confidence += 0.2
    if (behavioralMetrics) confidence += 0.1

    return {
      score: Math.round(overallScore),
      confidence: Math.round(confidence * 100),
      factors: {
        cognitive: Math.round(cognitiveRisk),
        speech: Math.round(speechRisk),
        behavioral: Math.round(behavioralRisk),
      },
    }
  }

  generateRecommendations(riskScore: number, factors: any): string[] {
    const recommendations: string[] = []

    if (riskScore >= 70) {
      recommendations.push("Immediate consultation with a neurologist or geriatrician is recommended")
      recommendations.push("Consider comprehensive neuropsychological testing")
    } else if (riskScore >= 40) {
      recommendations.push("Schedule follow-up assessment in 3-6 months")
      recommendations.push("Discuss results with primary care physician")
    } else if (riskScore >= 20) {
      recommendations.push("Continue regular monitoring with annual assessments")
      recommendations.push("Maintain cognitive stimulation activities")
    } else {
      recommendations.push("Continue current lifestyle and reassess annually")
    }

    // Factor-specific recommendations
    if (factors.cognitive > 50) {
      recommendations.push("Engage in memory training exercises and cognitive stimulation")
    }

    if (factors.speech > 50) {
      recommendations.push("Consider speech therapy evaluation")
    }

    if (factors.behavioral > 50) {
      recommendations.push("Focus on maintaining regular sleep schedule and social activities")
    }

    return recommendations
  }
}

export const aiCalculator = new AIRiskCalculator()
