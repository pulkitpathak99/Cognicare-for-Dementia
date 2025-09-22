"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Puzzle, Clock, ArrowLeft, CheckCircle, Volume2 } from "lucide-react"
import { storage, type AssessmentResult } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface PuzzlePiece {
  id: number
  x: number
  y: number
  placed: boolean
  correctX: number
  correctY: number
}

interface ClockTest {
  time: string
  userHour: number
  userMinute: number
  completed: boolean
}

export default function VisuospatialAssessmentPage() {
  const router = useRouter()
  const [currentTest, setCurrentTest] = useState<"puzzle" | "clock" | "complete">("puzzle")
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Puzzle Test State
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([])
  const [puzzleScore, setPuzzleScore] = useState(0)
  const [puzzleStartTime, setPuzzleStartTime] = useState<number>(0)

  // Clock Test State
  const [clockTests, setClockTests] = useState<ClockTest[]>([])
  const [currentClockIndex, setCurrentClockIndex] = useState(0)
  const [clockScore, setClockScore] = useState(0)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null)

  const [testComplete, setTestComplete] = useState(false)

  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  // Initialize Puzzle Test
  const initializePuzzleTest = useCallback(() => {
    const pieces: PuzzlePiece[] = [
      { id: 1, x: 50, y: 50, placed: false, correctX: 200, correctY: 100 },
      { id: 2, x: 100, y: 50, placed: false, correctX: 300, correctY: 100 },
      { id: 3, x: 150, y: 50, placed: false, correctX: 200, correctY: 200 },
      { id: 4, x: 200, y: 50, placed: false, correctX: 300, correctY: 200 },
    ]

    setPuzzlePieces(pieces)
    setPuzzleStartTime(Date.now())
    speak("Arrange the puzzle pieces to form a complete square. Drag each piece to its correct position.")
  }, [voiceEnabled])

  // Initialize Clock Test
  const initializeClockTest = useCallback(() => {
    const tests: ClockTest[] = [
      { time: "3:00", userHour: 0, userMinute: 0, completed: false },
      { time: "7:30", userHour: 0, userMinute: 0, completed: false },
      { time: "10:15", userHour: 0, userMinute: 0, completed: false },
    ]

    setClockTests(tests)
    setCurrentClockIndex(0)
    speak("Draw the clock hands to show the requested time. First, show 3 o'clock.")
  }, [voiceEnabled])

  useEffect(() => {
    initializePuzzleTest()
  }, [initializePuzzleTest])

  const handlePuzzlePieceClick = (pieceId: number, targetX: number, targetY: number) => {
    setPuzzlePieces((prev) =>
      prev.map((piece) => {
        if (piece.id === pieceId) {
          const isCorrect = Math.abs(targetX - piece.correctX) < 30 && Math.abs(targetY - piece.correctY) < 30
          return {
            ...piece,
            x: targetX,
            y: targetY,
            placed: isCorrect,
          }
        }
        return piece
      }),
    )

    // Check if puzzle is complete
    const updatedPieces = puzzlePieces.map((piece) => {
      if (piece.id === pieceId) {
        const isCorrect = Math.abs(targetX - piece.correctX) < 30 && Math.abs(targetY - piece.correctY) < 30
        return { ...piece, placed: isCorrect }
      }
      return piece
    })

    if (updatedPieces.every((piece) => piece.placed)) {
      const completionTime = Date.now() - puzzleStartTime
      const score = Math.max(0, 100 - Math.floor(completionTime / 1000))
      setPuzzleScore(score)
      speak("Puzzle complete! Now let's test your clock drawing skills.")
      setCurrentTest("clock")
      initializeClockTest()
    }
  }

  const handleClockSubmit = () => {
    if (selectedHour === null || selectedMinute === null) return

    const currentTest = clockTests[currentClockIndex]
    const [targetHour, targetMinute] = currentTest.time.split(":").map(Number)

    let isCorrect = false
    if (targetMinute === 0) {
      // Exact hour
      isCorrect = selectedHour === targetHour && selectedMinute === 0
    } else if (targetMinute === 30) {
      // Half hour
      isCorrect = selectedHour === targetHour && selectedMinute === 30
    } else if (targetMinute === 15) {
      // Quarter hour
      isCorrect = selectedHour === targetHour && selectedMinute === 15
    }

    if (isCorrect) {
      setClockScore(clockScore + 1)
    }

    if (currentClockIndex === clockTests.length - 1) {
      // Clock test complete
      completeAssessment(clockScore + (isCorrect ? 1 : 0))
    } else {
      setCurrentClockIndex(currentClockIndex + 1)
      setSelectedHour(null)
      setSelectedMinute(null)
      const nextTime = clockTests[currentClockIndex + 1].time
      speak(`Good! Now show ${nextTime} on the clock.`)
    }
  }

  const completeAssessment = (finalClockScore: number) => {
    const userId = localStorage.getItem("currentUserId")
    if (!userId) return

    const totalScore = puzzleScore + finalClockScore * 20 // Scale clock score
    const maxScore = 100 + clockTests.length * 20
    const duration = Date.now() - startTime

    const result: AssessmentResult = {
      id: `visuospatial_${Date.now()}`,
      userId,
      type: "visuospatial",
      score: totalScore,
      maxScore,
      duration,
      details: {
        puzzleScore,
        clockScore: finalClockScore,
        puzzleCompletionTime: Date.now() - puzzleStartTime,
        clockTests: clockTests.length,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(result)
    setTestComplete(true)
    speak("Visuospatial assessment complete. Well done!")
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
              <CardTitle className="text-2xl">Visuospatial Assessment Complete!</CardTitle>
              <CardDescription>Your results have been saved to your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{puzzleScore}</div>
                  <div className="text-sm text-muted-foreground">Puzzle Assembly</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{clockScore}</div>
                  <div className="text-sm text-muted-foreground">Clock Drawing</div>
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full button-large" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full button-large bg-transparent" asChild>
                  <Link href="/assessment/speech">Next: Speech Test</Link>
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
                <Puzzle className="w-6 h-6 text-primary" />
                Visuospatial Assessment
              </h1>
              <p className="text-muted-foreground">Test your spatial reasoning and visual processing</p>
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
            <Badge variant={currentTest === "puzzle" ? "default" : "secondary"}>Puzzle Assembly</Badge>
            <Badge variant={currentTest === "clock" ? "default" : "secondary"}>Clock Drawing</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}m {Math.floor(((Date.now() - startTime) / 1000) % 60)}
                s
              </span>
            </div>
          </div>
        </div>

        {/* Puzzle Test */}
        {currentTest === "puzzle" && (
          <Card>
            <CardHeader>
              <CardTitle>Digital Puzzle Assembly</CardTitle>
              <CardDescription>
                Drag the puzzle pieces to form a complete square. Click on a piece and then click where you want to
                place it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/20 rounded-lg mx-auto" style={{ height: "400px", width: "500px" }}>
                {/* Target area outline */}
                <div
                  className="absolute border-2 border-dashed border-primary/50"
                  style={{
                    left: "180px",
                    top: "80px",
                    width: "140px",
                    height: "140px",
                  }}
                />

                {/* Puzzle pieces */}
                {puzzlePieces.map((piece) => (
                  <div
                    key={piece.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                      const x = e.clientX - rect.left
                      const y = e.clientY - rect.top
                      handlePuzzlePieceClick(piece.id, x, y)
                    }}
                    className={`absolute w-16 h-16 border-2 cursor-pointer transition-all ${
                      piece.placed ? "bg-success/20 border-success" : "bg-primary/20 border-primary hover:bg-primary/30"
                    }`}
                    style={{
                      left: `${piece.x}px`,
                      top: `${piece.y}px`,
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg">{piece.id}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Pieces placed: {puzzlePieces.filter((p) => p.placed).length} / {puzzlePieces.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clock Drawing Test */}
        {currentTest === "clock" && (
          <Card>
            <CardHeader>
              <CardTitle>Digital Clock Drawing Test</CardTitle>
              <CardDescription>
                Set the clock to show: <strong>{clockTests[currentClockIndex]?.time}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-8">
                {/* Clock face */}
                <div className="relative w-64 h-64 mx-auto">
                  <div className="w-full h-full border-4 border-primary rounded-full bg-background relative">
                    {/* Clock numbers */}
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                      const angle = (num === 12 ? 0 : num * 30) - 90
                      const radian = (angle * Math.PI) / 180
                      const x = Math.cos(radian) * 100 + 128
                      const y = Math.sin(radian) * 100 + 128
                      return (
                        <div
                          key={num}
                          className="absolute w-8 h-8 flex items-center justify-center font-bold text-lg"
                          style={{
                            left: `${x - 16}px`,
                            top: `${y - 16}px`,
                          }}
                        >
                          {num}
                        </div>
                      )
                    })}

                    {/* Hour hand */}
                    {selectedHour !== null && (
                      <div
                        className="absolute w-1 bg-primary origin-bottom"
                        style={{
                          height: "60px",
                          left: "50%",
                          top: "50%",
                          transform: `translate(-50%, -100%) rotate(${(selectedHour % 12) * 30 - 90}deg)`,
                        }}
                      />
                    )}

                    {/* Minute hand */}
                    {selectedMinute !== null && (
                      <div
                        className="absolute w-0.5 bg-primary origin-bottom"
                        style={{
                          height: "80px",
                          left: "50%",
                          top: "50%",
                          transform: `translate(-50%, -100%) rotate(${selectedMinute * 6 - 90}deg)`,
                        }}
                      />
                    )}

                    {/* Center dot */}
                    <div className="absolute w-3 h-3 bg-primary rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Hour Hand</h4>
                    <div className="grid grid-cols-6 gap-2 max-w-md mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hour) => (
                        <Button
                          key={hour}
                          variant={selectedHour === hour ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedHour(hour)}
                          className="bg-transparent"
                        >
                          {hour}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Minute Hand</h4>
                    <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                      {[0, 15, 30, 45].map((minute) => (
                        <Button
                          key={minute}
                          variant={selectedMinute === minute ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMinute(minute)}
                          className="bg-transparent"
                        >
                          :{minute.toString().padStart(2, "0")}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleClockSubmit}
                    disabled={selectedHour === null || selectedMinute === null}
                    className="button-large"
                  >
                    Submit Time
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  Test {currentClockIndex + 1} of {clockTests.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
