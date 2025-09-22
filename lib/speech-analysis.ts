export interface SpeechMetrics {
  fluency: number
  coherence: number
  vocabularyDiversity: number
  pauseFrequency: number
  articulation: number
}

export interface SpeechAnalysisResult {
  transcript: string
  duration: number
  wordCount: number
  uniqueWords: number
  pauseCount: number
  averagePauseLength: number
  speakingRate: number
  fillerWords: number
  metrics: SpeechMetrics
}

export class SpeechAnalyzer {
  private fillerWords = [
    "um",
    "uh",
    "er",
    "ah",
    "like",
    "you know",
    "so",
    "well",
    "actually",
    "basically",
    "literally",
    "right",
    "okay",
    "yeah",
    "hmm",
  ]

  private commonWords = [
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
  ]

  analyzeTranscript(transcript: string, duration: number, pauseData?: number[]): SpeechAnalysisResult {
    const words = this.tokenizeText(transcript)
    const wordCount = words.length
    const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size
    const pauseCount = pauseData?.length || 0
    const averagePauseLength = pauseData?.reduce((a, b) => a + b, 0) / (pauseCount || 1)
    const speakingRate = (wordCount / duration) * 60 // words per minute
    const fillerWords = this.countFillerWords(words)

    const metrics = this.calculateMetrics({
      transcript,
      words,
      wordCount,
      uniqueWords,
      duration,
      pauseCount,
      averagePauseLength,
      speakingRate,
      fillerWords,
    })

    return {
      transcript,
      duration,
      wordCount,
      uniqueWords,
      pauseCount,
      averagePauseLength,
      speakingRate,
      fillerWords,
      metrics,
    }
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0)
  }

  private countFillerWords(words: string[]): number {
    return words.filter((word) => this.fillerWords.includes(word.toLowerCase())).length
  }

  private calculateMetrics(data: {
    transcript: string
    words: string[]
    wordCount: number
    uniqueWords: number
    duration: number
    pauseCount: number
    averagePauseLength: number
    speakingRate: number
    fillerWords: number
  }): SpeechMetrics {
    // Fluency: Based on speaking rate and filler words
    const normalSpeakingRate = 150 // words per minute
    const speakingRateScore = Math.min(100, (data.speakingRate / normalSpeakingRate) * 100)
    const fillerPenalty = (data.fillerWords / data.wordCount) * 100
    const fluency = Math.max(0, speakingRateScore - fillerPenalty)

    // Coherence: Based on sentence structure and logical flow
    const sentences = data.transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const avgSentenceLength = data.wordCount / sentences.length
    const coherenceScore = Math.min(100, (avgSentenceLength / 15) * 100) // Optimal ~15 words per sentence
    const coherence = Math.max(20, coherenceScore) // Minimum coherence score

    // Vocabulary Diversity: Type-Token Ratio
    const ttr = data.uniqueWords / data.wordCount
    const vocabularyDiversity = Math.min(100, ttr * 200) // Scale TTR to 0-100

    // Pause Frequency: Based on natural speech patterns
    const expectedPauses = data.duration / 10 // Expect pause every 10 seconds
    const pauseScore = Math.max(0, 100 - Math.abs(data.pauseCount - expectedPauses) * 10)
    const pauseFrequency = Math.min(100, pauseScore)

    // Articulation: Based on word clarity and completion
    const incompleteWords = data.words.filter((word) => word.length < 2).length
    const articulationPenalty = (incompleteWords / data.wordCount) * 100
    const articulation = Math.max(0, 100 - articulationPenalty)

    return {
      fluency: Math.round(fluency),
      coherence: Math.round(coherence),
      vocabularyDiversity: Math.round(vocabularyDiversity),
      pauseFrequency: Math.round(pauseFrequency),
      articulation: Math.round(articulation),
    }
  }

  // Simulate acoustic analysis (in real implementation, this would use audio processing)
  simulateAcousticAnalysis(audioBlob: Blob): Promise<{
    pitch: number[]
    jitter: number
    shimmer: number
    voiceQuality: number
  }> {
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        resolve({
          pitch: Array.from({ length: 10 }, () => 100 + Math.random() * 100),
          jitter: Math.random() * 2, // 0-2% normal range
          shimmer: Math.random() * 3, // 0-3% normal range
          voiceQuality: 70 + Math.random() * 30, // 70-100 quality score
        })
      }, 1000)
    })
  }

  generateSpeechPrompts(): string[] {
    return [
      "Please describe what you see in this picture. Take your time and include as many details as possible.",
      "Tell me about a typical day in your life, from when you wake up until you go to bed.",
      "Describe your favorite memory from childhood. What made it special?",
      "Explain how to make your favorite recipe or dish step by step.",
      "Tell me about the weather today and how it makes you feel.",
      "Describe the route from your home to the nearest grocery store.",
      "Talk about your family members and what they mean to you.",
      "Explain what you would do if you found a wallet on the street.",
    ]
  }
}

export const speechAnalyzer = new SpeechAnalyzer()
