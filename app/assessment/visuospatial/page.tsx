"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Puzzle, Clock, ArrowLeft, CheckCircle, Volume2, RotateCcw } from "lucide-react"
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
  color: string
}

interface PatternTest {
  id: number
  pattern: number[][]
  userPattern: number[][]
  completed: boolean
}

export default function VisuospatialAssessmentPage() {
  const router = useRouter()
  const [currentTest, setCurrentTest] = useState<"puzzle" | "pattern" | "rotation" | "complete">("puzzle")
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Puzzle Test State
  const [puzzlePieces, setPuzzlePieces] = useState<PuzzlePiece[]>([])
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [puzzleScore, setPuzzleScore] = useState(0)
  const [puzzleStartTime, setPuzzleStartTime] = useState<number>(0)

  // Pattern Test State
  const [patternTests, setPatternTests] = useState<PatternTest[]>([])
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0)
  const [patternScore, setPatternScore] = useState(0)
  const [showPattern, setShowPattern] = useState(true)

  // Rotation Test State
  const [rotationScore, setRotationScore] = useState(0)
  const [currentShape, setCurrentShape] = useState(0)
  const [rotationAnswer, setRotationAnswer] = useState<number | null>(null)

  const [testComplete, setTestComplete] = useState(false)

  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const initializePuzzleTest = useCallback(() => {
    const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]
    const pieces: PuzzlePiece[] = [
      { id: 1, x: 50, y: 300, placed: false, correctX: 150, correctY: 150, color: colors[0] },
      { id: 2, x: 150, y: 300, placed: false, correctX: 200, correctY: 150, color: colors[1] },
      { id: 3, x: 250, y: 300, placed: false, correctX: 150, correctY: 200, color: colors[2] },
      { id: 4, x: 350, y: 300, placed: false, correctX: 200, correctY: 200, color: colors[3] },
      { id: 5, x: 450, y: 300, placed: false, correctX: 175, correctY: 125, color: colors[4] },
      { id: 6, x: 550, y: 300, placed: false, correctX: 175, correctY: 225, color: colors[5] },
    ]

    setPuzzlePieces(pieces)
    setPuzzleStartTime(Date.now())
    speak("Drag the colorful puzzle pieces to form a complete pattern in the target area.")
  }, [voiceEnabled])

  const initializePatternTest = useCallback(() => {
    const tests: PatternTest[] = [
      {
        id: 1,
        pattern: [
          [1, 0, 1],
          [0, 1, 0],
          [1, 0, 1],
        ],
        userPattern: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        completed: false,
      },
      {
        id: 2,
        pattern: [
          [1, 1, 0, 1],
          [0, 1, 1, 0],
          [1, 0, 1, 1],
          [1, 1, 0, 0],
        ],
        userPattern: [
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        completed: false,
      },
    ]

    setPatternTests(tests)
    setCurrentPatternIndex(0)
    setShowPattern(true)
    speak("Memorize the pattern, then recreate it by clicking the squares.")

    // Hide pattern after 3 seconds
    setTimeout(() => {
      setShowPattern(false)
      speak("Now recreate the pattern you just saw.")
    }, 3000)
  }, [voiceEnabled])

  useEffect(() => {
    initializePuzzleTest()
  }, [initializePuzzleTest])

  const handlePuzzlePieceClick = (pieceId: number) => {
    if (selectedPiece === pieceId) {
      setSelectedPiece(null)
    } else {
      setSelectedPiece(pieceId)
    }
  }

  const handleTargetAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectedPiece === null) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - 25 // Center the piece
    const y = event.clientY - rect.top - 25

    setPuzzlePieces((prev) =>
      prev.map((piece) => {
        if (piece.id === selectedPiece) {
          const isCorrect = Math.abs(x - piece.correctX) < 40 && Math.abs(y - piece.correctY) < 40
          return {
            ...piece,
            x: isCorrect ? piece.correctX : x,
            y: isCorrect ? piece.correctY : y,
            placed: isCorrect,
          }
        }
        return piece
      }),
    )

    setSelectedPiece(null)

    // Check if puzzle is complete
    const updatedPieces = puzzlePieces.map((piece) => {
      if (piece.id === selectedPiece) {
        const isCorrect = Math.abs(x - piece.correctX) < 40 && Math.abs(y - piece.correctY) < 40
        return { ...piece, placed: isCorrect }
      }
      return piece
    })

    if (updatedPieces.every((piece) => piece.placed)) {
      const completionTime = Date.now() - puzzleStartTime
      const score = Math.max(20, 100 - Math.floor(completionTime / 1000))
      setPuzzleScore(score)
      speak("Excellent! Puzzle complete! Now let's test your pattern memory.")
      setTimeout(() => {
        setCurrentTest("pattern")
        initializePatternTest()
      }, 1500)
    }
  }

  const handlePatternCellClick = (row: number, col: number) => {
    if (showPattern) return

    setPatternTests((prev) =>
      prev.map((test, index) => {
        if (index === currentPatternIndex) {
          const newUserPattern = [...test.userPattern]
          newUserPattern[row][col] = newUserPattern[row][col] === 1 ? 0 : 1
          return { ...test, userPattern: newUserPattern }
        }
        return test
      }),
    )
  }

  const submitPattern = () => {
    const currentTest = patternTests[currentPatternIndex]
    const isCorrect = JSON.stringify(currentTest.pattern) === JSON.stringify(currentTest.userPattern)

    if (isCorrect) {
      setPatternScore(patternScore + 1)
      speak("Correct! Well done.")
    } else {
      speak("Not quite right, but good effort.")
    }

    if (currentPatternIndex === patternTests.length - 1) {
      speak("Pattern test complete! Now let's test your spatial rotation skills.")
      setTimeout(() => {
        setCurrentTest("rotation")
        initializeRotationTest()
      }, 2000)
    } else {
      setCurrentPatternIndex(currentPatternIndex + 1)
      setShowPattern(true)
      setTimeout(() => {
        setShowPattern(false)
        speak("Now recreate this new pattern.")
      }, 3000)
    }
  }

  const initializeRotationTest = () => {
    setCurrentShape(0)
    setRotationAnswer(null)
    speak("Look at the shape on the left, then select which rotated version matches it on the right.")
  }

  const submitRotation = (answer: number) => {
    const correctAnswers = [2, 1, 3] // Correct rotation for each shape
    const isCorrect = answer === correctAnswers[currentShape]

    if (isCorrect) {
      setRotationScore(rotationScore + 1)
      speak("Correct!")
    } else {
      speak("Not quite right.")
    }

    if (currentShape === 2) {
      completeAssessment()
    } else {
      setCurrentShape(currentShape + 1)
      setRotationAnswer(null)
    }
  }

  const completeAssessment = () => {
    const userId = localStorage.getItem("currentUserId")
    if (!userId) return

    const totalScore = puzzleScore + patternScore * 30 + rotationScore * 25
    const maxScore = 100 + patternTests.length * 30 + 3 * 25
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
        patternScore,
        rotationScore,
        puzzleCompletionTime: Date.now() - puzzleStartTime,
        totalTests: 3,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(result)
    setTestComplete(true)
    speak("Visuospatial assessment complete! Excellent work on all the spatial reasoning tasks.")
  }

  const resetPuzzle = () => {
    initializePuzzleTest()
    setSelectedPiece(null)
  }

  if (testComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center animate-in fade-in duration-500">
            <CardHeader>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Visuospatial Assessment Complete!</CardTitle>
              <CardDescription>Your spatial reasoning skills have been evaluated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg animate-in slide-in-from-left duration-300">
                  <div className="text-2xl font-bold">{puzzleScore}</div>
                  <div className="text-sm text-muted-foreground">Puzzle Assembly</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg animate-in slide-in-from-bottom duration-300 delay-100">
                  <div className="text-2xl font-bold">{patternScore}</div>
                  <div className="text-sm text-muted-foreground">Pattern Memory</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg animate-in slide-in-from-right duration-300 delay-200">
                  <div className="text-2xl font-bold">{rotationScore}</div>
                  <div className="text-sm text-muted-foreground">Spatial Rotation</div>
                </div>
              </div>

              <div className="bg-primary/10 p-6 rounded-lg animate-in fade-in duration-500 delay-300">
                <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                <div className="text-4xl font-bold text-primary mb-2">
                  {puzzleScore + patternScore * 30 + rotationScore * 25}
                </div>
                <Progress value={(puzzleScore + patternScore * 30 + rotationScore * 25) / 2.35} className="h-3" />
              </div>

              <div className="space-y-4">
                <Button className="w-full button-large" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full button-large bg-transparent" asChild>
                  <Link href="/assessment/speech">Next: Speech Assessment</Link>
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
      <div className="container mx-auto max-w-5xl">
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
              <p className="text-muted-foreground">Test your spatial reasoning and visual processing abilities</p>
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
            <Badge variant={currentTest === "pattern" ? "default" : "secondary"}>Pattern Memory</Badge>
            <Badge variant={currentTest === "rotation" ? "default" : "secondary"}>Spatial Rotation</Badge>
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
          <Card className="animate-in fade-in duration-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Interactive Puzzle Assembly</CardTitle>
                  <CardDescription>
                    Click a puzzle piece to select it, then click in the target area to place it. Form a complete
                    pattern!
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={resetPuzzle}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Target Area */}
                <div>
                  <h3 className="font-semibold mb-4">Target Area - Click to place selected piece</h3>
                  <div
                    className="relative bg-muted/20 rounded-lg border-2 border-dashed border-primary/50 cursor-crosshair"
                    style={{ height: "300px", width: "300px" }}
                    onClick={handleTargetAreaClick}
                  >
                    {/* Placed pieces */}
                    {puzzlePieces
                      .filter((piece) => piece.x >= 100 && piece.x <= 400 && piece.y >= 100 && piece.y <= 400)
                      .map((piece) => (
                        <div
                          key={piece.id}
                          className={`absolute w-12 h-12 rounded-lg border-2 transition-all duration-300 ${
                            piece.placed
                              ? "border-success shadow-lg scale-105"
                              : "border-primary/50 hover:border-primary"
                          }`}
                          style={{
                            left: `${piece.x - 100}px`,
                            top: `${piece.y - 100}px`,
                            backgroundColor: piece.color,
                          }}
                        >
                          <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm">
                            {piece.id}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Puzzle Pieces */}
                <div>
                  <h3 className="font-semibold mb-4">Puzzle Pieces - Click to select</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {puzzlePieces
                      .filter((piece) => !piece.placed)
                      .map((piece) => (
                        <div
                          key={piece.id}
                          onClick={() => handlePuzzlePieceClick(piece.id)}
                          className={`w-16 h-16 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedPiece === piece.id
                              ? "border-primary shadow-lg ring-2 ring-primary/50 scale-105"
                              : "border-primary/30 hover:border-primary"
                          }`}
                          style={{ backgroundColor: piece.color }}
                        >
                          <div className="w-full h-full flex items-center justify-center font-bold text-white">
                            {piece.id}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span>
                        {puzzlePieces.filter((p) => p.placed).length} / {puzzlePieces.length}
                      </span>
                    </div>
                    <Progress value={(puzzlePieces.filter((p) => p.placed).length / puzzlePieces.length) * 100} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pattern Memory Test */}
        {currentTest === "pattern" && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle>Pattern Memory Test</CardTitle>
              <CardDescription>
                {showPattern
                  ? "Memorize this pattern - it will disappear in a few seconds"
                  : "Recreate the pattern by clicking the squares"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="inline-block">
                  {patternTests[currentPatternIndex] && (
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${patternTests[currentPatternIndex].pattern[0].length}, 1fr)`,
                      }}
                    >
                      {(showPattern
                        ? patternTests[currentPatternIndex].pattern
                        : patternTests[currentPatternIndex].userPattern
                      ).map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handlePatternCellClick(rowIndex, colIndex)}
                            className={`w-12 h-12 border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                              cell === 1
                                ? "bg-primary border-primary"
                                : "bg-muted border-muted-foreground/30 hover:border-primary/50"
                            } ${!showPattern ? "hover:bg-primary/20" : ""}`}
                          />
                        )),
                      )}
                    </div>
                  )}
                </div>

                {!showPattern && (
                  <Button onClick={submitPattern} className="button-large">
                    Submit Pattern
                  </Button>
                )}

                <div className="text-sm text-muted-foreground">
                  Pattern {currentPatternIndex + 1} of {patternTests.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spatial Rotation Test */}
        {currentTest === "rotation" && (
          <Card className="animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle>Spatial Rotation Test</CardTitle>
              <CardDescription>
                Which of the shapes on the right is the same as the shape on the left, just rotated?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Original Shape */}
                <div className="text-center">
                  <h3 className="font-semibold mb-4">Original Shape</h3>
                  <div className="bg-muted/20 p-8 rounded-lg">
                    {currentShape === 0 && (
                      <div className="w-24 h-24 bg-primary mx-auto relative">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-accent"></div>
                      </div>
                    )}
                    {currentShape === 1 && (
                      <div className="w-24 h-16 bg-primary mx-auto relative">
                        <div className="absolute bottom-0 left-0 w-8 h-8 bg-accent"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-accent"></div>
                      </div>
                    )}
                    {currentShape === 2 && (
                      <div className="w-20 h-20 bg-primary mx-auto relative transform rotate-45">
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-accent"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Answer Options */}
                <div className="text-center">
                  <h3 className="font-semibold mb-4">Choose the Matching Rotated Shape</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((option) => (
                      <Button
                        key={option}
                        variant={rotationAnswer === option ? "default" : "outline"}
                        className="h-24 bg-transparent hover:bg-primary/10"
                        onClick={() => setRotationAnswer(option)}
                      >
                        <div className="bg-muted/20 p-4 rounded">
                          {/* Different rotated versions based on current shape and option */}
                          {currentShape === 0 && option === 1 && (
                            <div className="w-16 h-16 bg-primary relative">
                              <div className="absolute bottom-0 left-0 w-6 h-6 bg-accent"></div>
                            </div>
                          )}
                          {currentShape === 0 && option === 2 && (
                            <div className="w-16 h-16 bg-primary relative">
                              <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent"></div>
                            </div>
                          )}
                          {currentShape === 0 && option === 3 && (
                            <div className="w-16 h-16 bg-primary relative">
                              <div className="absolute top-0 left-0 w-6 h-6 bg-accent"></div>
                            </div>
                          )}
                          {currentShape === 0 && option === 4 && (
                            <div className="w-16 h-16 bg-primary relative">
                              <div className="absolute top-0 right-0 w-6 h-6 bg-accent"></div>
                            </div>
                          )}
                          {/* Add more shape variations for other currentShape values */}
                        </div>
                      </Button>
                    ))}
                  </div>

                  {rotationAnswer && (
                    <Button onClick={() => submitRotation(rotationAnswer)} className="button-large mt-4">
                      Submit Answer
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-muted-foreground">Shape {currentShape + 1} of 3</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
