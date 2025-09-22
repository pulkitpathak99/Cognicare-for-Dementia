"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, ArrowLeft, CheckCircle, Volume2 } from "lucide-react"
import { storage, type AssessmentResult } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface TrailItem {
  id: number
  x: number
  y: number
  connected: boolean
}

interface StroopItem {
  word: string
  color: string
  correctColor: string
}

export default function AttentionAssessmentPage() {
  const router = useRouter()
  const [currentTest, setCurrentTest] = useState<"trail" | "stroop" | "complete">("trail")
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Trail Making Test State
  const [trailItems, setTrailItems] = useState<TrailItem[]>([])
  const [currentTrailTarget, setCurrentTrailTarget] = useState(1)
  const [trailStartTime, setTrailStartTime] = useState<number>(0)
  const [trailScore, setTrailScore] = useState(0)
  const [trailErrors, setTrailErrors] = useState(0)

  // Stroop Test State
  const [stroopItems, setStroopItems] = useState<StroopItem[]>([])
  const [currentStroopIndex, setCurrentStroopIndex] = useState(0)
  const [stroopScore, setStroopScore] = useState(0)
  const [stroopStartTime, setStroopStartTime] = useState<number>(0)
  const [stroopReactionTimes, setStroopReactionTimes] = useState<number[]>([])

  const [testComplete, setTestComplete] = useState(false)

  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  // Initialize Trail Making Test
  const initializeTrailTest = useCallback(() => {
    const items: TrailItem[] = []
    const containerWidth = 600
    const containerHeight = 400

    for (let i = 1; i <= 15; i++) {
      items.push({
        id: i,
        x: Math.random() * (containerWidth - 60) + 30,
        y: Math.random() * (containerHeight - 60) + 30,
        connected: false,
      })
    }

    setTrailItems(items)
    setCurrentTrailTarget(1)
    setTrailStartTime(Date.now())
    speak("Connect the numbers in order from 1 to 15. Click on number 1 to start.")
  }, [voiceEnabled])

  // Initialize Stroop Test
  const initializeStroopTest = useCallback(() => {
    const colors = ["red", "blue", "green", "yellow", "purple"]
    const items: StroopItem[] = []

    for (let i = 0; i < 20; i++) {
      const word = colors[Math.floor(Math.random() * colors.length)]
      const color = colors[Math.floor(Math.random() * colors.length)]
      items.push({
        word,
        color,
        correctColor: color,
      })
    }

    setStroopItems(items)
    setCurrentStroopIndex(0)
    setStroopStartTime(Date.now())
    speak("Identify the COLOR of the word, not what the word says. Click the correct color.")
  }, [voiceEnabled])

  useEffect(() => {
    initializeTrailTest()
  }, [initializeTrailTest])

  const handleTrailClick = (clickedId: number) => {
    if (clickedId === currentTrailTarget) {
      // Correct connection
      setTrailItems((prev) => prev.map((item) => (item.id === clickedId ? { ...item, connected: true } : item)))

      if (currentTrailTarget === 15) {
        // Trail test complete
        const completionTime = Date.now() - trailStartTime
        const score = Math.max(0, 100 - Math.floor(completionTime / 1000) - trailErrors * 5)
        setTrailScore(score)
        speak("Trail making test complete. Starting Stroop test.")
        setCurrentTest("stroop")
        initializeStroopTest()
      } else {
        setCurrentTrailTarget(currentTrailTarget + 1)
        speak(`Good! Now click ${currentTrailTarget + 1}`)
      }
    } else {
      // Incorrect connection
      setTrailErrors(trailErrors + 1)
      speak("That's not correct. Try again.")
    }
  }

  const handleStroopAnswer = (selectedColor: string) => {
    const currentItem = stroopItems[currentStroopIndex]
    const reactionTime = Date.now() - stroopStartTime
    setStroopReactionTimes([...stroopReactionTimes, reactionTime])

    if (selectedColor === currentItem.correctColor) {
      setStroopScore(stroopScore + 1)
    }

    if (currentStroopIndex === stroopItems.length - 1) {
      // Stroop test complete
      completeAssessment(stroopScore + (selectedColor === currentItem.correctColor ? 1 : 0))
    } else {
      setCurrentStroopIndex(currentStroopIndex + 1)
      setStroopStartTime(Date.now())
    }
  }

  const completeAssessment = (finalStroopScore: number) => {
    const userId = localStorage.getItem("currentUserId")
    if (!userId) return

    const totalScore = trailScore + finalStroopScore
    const maxScore = 100 + stroopItems.length
    const duration = Date.now() - startTime

    const avgReactionTime = stroopReactionTimes.reduce((a, b) => a + b, 0) / stroopReactionTimes.length

    const result: AssessmentResult = {
      id: `attention_${Date.now()}`,
      userId,
      type: "attention",
      score: totalScore,
      maxScore,
      duration,
      details: {
        trailScore,
        stroopScore: finalStroopScore,
        trailErrors,
        avgReactionTime,
        trailCompletionTime: Date.now() - trailStartTime,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(result)
    setTestComplete(true)
    speak("Attention assessment complete. Excellent work!")
  }

  if (testComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Attention Assessment Complete!</CardTitle>
              <CardDescription>Your results have been saved to your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{trailScore}</div>
                  <div className="text-sm text-muted-foreground">Trail Making</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{stroopScore}</div>
                  <div className="text-sm text-muted-foreground">Stroop Test</div>
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full button-large" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full button-large bg-transparent" asChild>
                  <Link href="/assessment/visuospatial">Next: Visual Test</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Attention Assessment
              </h1>
              <p className="text-muted-foreground">Test your attention and processing speed</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVoiceEnabled(!voiceEnabled)
                speak(voiceEnabled ? "Voice assistance disabled" : "Voice assistance enabled")
              }}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              {voiceEnabled ? "Voice On" : "Voice Off"}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={currentTest === "trail" ? "default" : "secondary"}>Trail Making</Badge>
            <Badge variant={currentTest === "stroop" ? "default" : "secondary"}>Stroop Test</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}m {Math.floor(((Date.now() - startTime) / 1000) % 60)}
                s
              </span>
            </div>
          </div>
        </div>

        {/* Trail Making Test */}
        {currentTest === "trail" && (
          <Card>
            <CardHeader>
              <CardTitle>Digital Trail Making Test</CardTitle>
              <CardDescription>
                Connect the numbers in order from 1 to 15. Click on each number in sequence.
                {trailErrors > 0 && <span className="text-destructive"> Errors: {trailErrors}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/20 rounded-lg" style={{ height: "400px", width: "100%" }}>
                <div className="absolute inset-4">
                  {trailItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTrailClick(item.id)}
                      className={`absolute w-12 h-12 rounded-full border-2 font-bold text-sm transition-all ${
                        item.connected
                          ? "bg-success text-success-foreground border-success"
                          : item.id === currentTrailTarget
                            ? "bg-primary text-primary-foreground border-primary animate-pulse"
                            : "bg-background text-foreground border-border hover:border-primary"
                      }`}
                      style={{
                        left: `${(item.x / 600) * 100}%`,
                        top: `${(item.y / 400) * 100}%`,
                      }}
                    >
                      {item.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-lg font-medium">
                  Next: Click on <span className="text-primary font-bold">{currentTrailTarget}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stroop Test */}
        {currentTest === "stroop" && (
          <Card>
            <CardHeader>
              <CardTitle>Stroop Color Test</CardTitle>
              <CardDescription>
                Click the COLOR of the word, not what the word says. Progress: {currentStroopIndex + 1} of{" "}
                {stroopItems.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-8">
                <div className="bg-muted/20 p-12 rounded-lg">
                  <div className="text-6xl font-bold" style={{ color: stroopItems[currentStroopIndex]?.color }}>
                    {stroopItems[currentStroopIndex]?.word.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 max-w-md mx-auto">
                  {["red", "blue", "green", "yellow", "purple"].map((color) => (
                    <Button
                      key={color}
                      onClick={() => handleStroopAnswer(color)}
                      className="button-large capitalize"
                      style={{
                        backgroundColor: color,
                        color: color === "yellow" ? "black" : "white",
                      }}
                    >
                      {color}
                    </Button>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  Score: {stroopScore} / {currentStroopIndex + 1}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
