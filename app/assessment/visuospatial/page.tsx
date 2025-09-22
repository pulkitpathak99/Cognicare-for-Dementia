"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  ChevronRight,
  RefreshCcw,
  Palette,
  Eraser,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { storage, type AssessmentResult } from "@/lib/storage"

type VisuospatialTask = {
  id: string
  title: string
  instruction: string
  type: "clock_drawing" | "cube_copy" | "line_bisection" | "spatial_memory"
}

type TaskResult = {
  taskId: string
  score: number
  timeToComplete: number
  accuracy: number
  details: any
}

type DrawingPoint = {
  x: number
  y: number
  pressure?: number
  timestamp: number
}

type DrawingStroke = {
  points: DrawingPoint[]
  color: string
  width: number
}

const VISUOSPATIAL_TASKS: VisuospatialTask[] = [
  {
    id: "clock_drawing",
    title: "Clock Drawing Test",
    instruction:
      "Draw a clock face showing the time 10:11. Include all numbers (1-12) and both hands pointing to the correct time.",
    type: "clock_drawing",
  },
  {
    id: "cube_copy",
    title: "3D Cube Drawing",
    instruction: "Look at the reference cube and draw it as accurately as possible using the drawing tools below.",
    type: "cube_copy",
  },
  {
    id: "line_bisection",
    title: "Line Bisection Test",
    instruction: "Click on the exact center of each horizontal line. Try to be as precise as possible.",
    type: "line_bisection",
  },
  {
    id: "spatial_memory",
    title: "Spatial Memory Pattern",
    instruction: "First, memorize the pattern of highlighted squares. Then recreate it by clicking on the grid.",
    type: "spatial_memory",
  },
]

export default function VisuospatialAssessmentPage() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [taskResults, setTaskResults] = useState<TaskResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)

  // Enhanced Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingStrokes, setDrawingStrokes] = useState<DrawingStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([])
  const [brushSize, setBrushSize] = useState(3)
  const [brushColor, setBrushColor] = useState("#2563eb")
  const [tool, setTool] = useState<"pen" | "eraser">("pen")

  // Line Bisection State - Fixed positioning
  const [lineClicks, setLineClicks] = useState<
    { lineId: number; clickX: number; accuracy: number; relativeX: number }[]
  >([])
  const lineContainerRef = useRef<HTMLDivElement>(null)
  const lines = [
    { id: 1, length: 300, y: 60 },
    { id: 2, length: 250, y: 120 },
    { id: 3, length: 350, y: 180 },
    { id: 4, length: 200, y: 240 },
  ]

  // Spatial Memory State - Enhanced
  const [memoryPattern, setMemoryPattern] = useState<{ x: number; y: number }[]>([])
  const [userPattern, setUserPattern] = useState<{ x: number; y: number }[]>([])
  const [showingPattern, setShowingPattern] = useState(false)
  const [patternCountdown, setPatternCountdown] = useState(0)

  const currentTask = VISUOSPATIAL_TASKS[currentTaskIndex]

  useEffect(() => {
    setStartTime(Date.now())
    resetTaskState()
    if (currentTask.type === "spatial_memory") {
      initializeSpatialMemory()
    }
  }, [currentTaskIndex])

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 400

    // Clear canvas
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw reference elements for clock
    if (currentTask.type === "clock_drawing") {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(200, 200, 150, 0, 2 * Math.PI)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Redraw all strokes
    drawingStrokes.forEach((stroke) => {
      drawStroke(ctx, stroke)
    })
  }, [currentTask.type, drawingStrokes])

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return

    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }
    ctx.stroke()
  }

  useEffect(() => {
    initializeCanvas()
  }, [initializeCanvas])

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setIsDrawing(true)
    setCurrentStroke([{ x, y, timestamp: Date.now() }])
  }

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newPoint = { x, y, timestamp: Date.now() }
    setCurrentStroke((prev) => [...prev, newPoint])

    // Draw current stroke in real-time
    const ctx = canvas.getContext("2d")
    if (ctx && currentStroke.length > 0) {
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : brushColor
      ctx.lineWidth = tool === "eraser" ? brushSize * 2 : brushSize
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      ctx.beginPath()
      ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing || currentStroke.length === 0) return

    const newStroke: DrawingStroke = {
      points: currentStroke,
      color: tool === "eraser" ? "#ffffff" : brushColor,
      width: tool === "eraser" ? brushSize * 2 : brushSize,
    }

    setDrawingStrokes((prev) => [...prev, newStroke])
    setCurrentStroke([])
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    setDrawingStrokes([])
    setCurrentStroke([])
    initializeCanvas()
  }

  const undoLastStroke = () => {
    setDrawingStrokes((prev) => prev.slice(0, -1))
  }

  const handleLineBisection = (lineId: number, event: React.MouseEvent<HTMLDivElement>) => {
    const container = lineContainerRef.current
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const lineElement = event.currentTarget
    const lineRect = lineElement.getBoundingClientRect()

    const relativeX = event.clientX - lineRect.left
    const lineLength = lineRect.width
    const centerX = lineLength / 2
    const accuracy = Math.max(0, 100 - Math.abs(relativeX - centerX) * 2)

    setLineClicks((prev) => [
      ...prev.filter((c) => c.lineId !== lineId),
      { lineId, clickX: relativeX, accuracy, relativeX: relativeX / lineLength },
    ])
  }

  const initializeSpatialMemory = () => {
    const pattern = []
    const usedPositions = new Set()

    // Generate 5 unique positions
    while (pattern.length < 5) {
      const x = Math.floor(Math.random() * 6)
      const y = Math.floor(Math.random() * 6)
      const key = `${x}-${y}`

      if (!usedPositions.has(key)) {
        pattern.push({ x, y })
        usedPositions.add(key)
      }
    }

    setMemoryPattern(pattern)
    setUserPattern([])
    setShowingPattern(true)
    setPatternCountdown(5)

    const countdownInterval = setInterval(() => {
      setPatternCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setShowingPattern(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSpatialMemoryClick = (x: number, y: number) => {
    if (showingPattern) return

    const exists = userPattern.find((p) => p.x === x && p.y === y)
    if (exists) {
      setUserPattern((prev) => prev.filter((p) => !(p.x === x && p.y === y)))
    } else {
      setUserPattern((prev) => [...prev, { x, y }])
    }
  }

  const completeCurrentTask = () => {
    const timeToComplete = Date.now() - startTime
    let score = 0
    let accuracy = 0
    let details = {}

    switch (currentTask.type) {
      case "clock_drawing":
        // Enhanced scoring based on drawing complexity and coverage
        const totalStrokes = drawingStrokes.length
        const totalPoints = drawingStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
        score = Math.min(100, Math.max(20, totalStrokes * 15 + Math.min(totalPoints / 10, 30)))
        accuracy = totalStrokes > 3 ? 85 : 60
        details = { strokeCount: totalStrokes, pointCount: totalPoints, strokes: drawingStrokes }
        break

      case "cube_copy":
        const cubeStrokes = drawingStrokes.length
        const cubePoints = drawingStrokes.reduce((sum, stroke) => sum + stroke.points.length, 0)
        score = Math.min(100, Math.max(30, cubeStrokes * 20 + Math.min(cubePoints / 15, 40)))
        accuracy = cubeStrokes > 2 ? 80 : 50
        details = { strokeCount: cubeStrokes, pointCount: cubePoints, strokes: drawingStrokes }
        break

      case "line_bisection":
        if (lineClicks.length > 0) {
          const avgAccuracy = lineClicks.reduce((sum, click) => sum + click.accuracy, 0) / lineClicks.length
          score = Math.round(avgAccuracy)
          accuracy = avgAccuracy
        }
        details = { clicks: lineClicks, avgAccuracy: accuracy, completedLines: lineClicks.length }
        break

      case "spatial_memory":
        const correctMatches = userPattern.filter((up) =>
          memoryPattern.some((mp) => mp.x === up.x && mp.y === up.y),
        ).length
        const incorrectSelections = userPattern.length - correctMatches
        score = Math.max(0, Math.round((correctMatches / memoryPattern.length) * 100 - incorrectSelections * 10))
        accuracy = (correctMatches / memoryPattern.length) * 100
        details = {
          correctMatches,
          totalPattern: memoryPattern.length,
          incorrectSelections,
          userPattern,
          memoryPattern,
        }
        break
    }

    const result: TaskResult = {
      taskId: currentTask.id,
      score,
      timeToComplete,
      accuracy,
      details,
    }

    setTaskResults((prev) => [...prev, result])

    if (currentTaskIndex < VISUOSPATIAL_TASKS.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1)
    } else {
      completeAssessment()
    }
  }

  const resetTaskState = () => {
    setDrawingStrokes([])
    setCurrentStroke([])
    setIsDrawing(false)
    setLineClicks([])
    setMemoryPattern([])
    setUserPattern([])
    setShowingPattern(false)
    setPatternCountdown(0)
    setBrushSize(3)
    setBrushColor("#2563eb")
    setTool("pen")
  }

  const completeAssessment = () => {
    const userId = localStorage.getItem("currentUserId") || "guest"
    const totalScore = taskResults.reduce((sum, result) => sum + result.score, 0)
    const avgScore = Math.round(totalScore / taskResults.length)
    const totalDuration = taskResults.reduce((sum, result) => sum + result.timeToComplete, 0)

    const assessment: AssessmentResult = {
      id: `visuospatial_${Date.now()}`,
      userId,
      type: "visuospatial",
      score: avgScore,
      maxScore: 100,
      duration: totalDuration,
      details: {
        tasks: taskResults,
        avgAccuracy: taskResults.reduce((sum, r) => sum + r.accuracy, 0) / taskResults.length,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(assessment)
    setIsComplete(true)
  }

  if (isComplete) {
    const avgScore = Math.round(taskResults.reduce((sum, r) => sum + r.score, 0) / taskResults.length)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <CardTitle className="text-3xl">Visuospatial Assessment Complete!</CardTitle>
              <CardDescription className="text-blue-100 text-lg">
                You completed all {VISUOSPATIAL_TASKS.length} visuospatial tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xl font-semibold">Overall Score</h4>
                  <p className="text-4xl font-bold">{avgScore}/100</p>
                </div>
                <Progress value={avgScore} className="h-3 bg-white/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskResults.map((result, index) => (
                  <div key={result.taskId} className="bg-gray-50 p-4 rounded-lg border">
                    <h5 className="font-semibold mb-2">{VISUOSPATIAL_TASKS[index].title}</h5>
                    <p className="text-2xl font-bold text-blue-600">{result.score}/100</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(result.timeToComplete / 1000)}s • {Math.round(result.accuracy)}% accuracy
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => window.location.reload()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retake Assessment
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600" asChild>
                  <Link href="/dashboard">
                    Continue to Dashboard
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-5xl py-8 px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Eye className="w-6 h-6" />
                  Visuospatial Assessment
                </CardTitle>
                <CardDescription className="text-blue-100 text-base mt-2">
                  Task {currentTaskIndex + 1} of {VISUOSPATIAL_TASKS.length}: {currentTask.title}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {VISUOSPATIAL_TASKS.map((_, index) => (
                  <Badge
                    key={index}
                    variant={
                      index === currentTaskIndex ? "secondary" : index < currentTaskIndex ? "default" : "outline"
                    }
                    className={index === currentTaskIndex ? "bg-white text-blue-600" : ""}
                  >
                    {index + 1}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">{currentTask.title}</h3>
              <p className="text-blue-800 leading-relaxed">{currentTask.instruction}</p>
            </div>

            {/* Enhanced Drawing Tasks */}
            {(currentTask.type === "clock_drawing" || currentTask.type === "cube_copy") && (
              <div className="space-y-6">
                {/* Drawing Tools */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex gap-2">
                      <Button variant={tool === "pen" ? "default" : "outline"} size="sm" onClick={() => setTool("pen")}>
                        <Palette className="w-4 h-4 mr-1" />
                        Pen
                      </Button>
                      <Button
                        variant={tool === "eraser" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTool("eraser")}
                      >
                        <Eraser className="w-4 h-4 mr-1" />
                        Eraser
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      <Slider
                        value={[brushSize]}
                        onValueChange={(value) => setBrushSize(value[0])}
                        max={20}
                        min={1}
                        step={1}
                        className="w-20"
                      />
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium w-8">{brushSize}px</span>
                    </div>

                    <div className="flex gap-2">
                      {["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#000000"].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${brushColor === color ? "border-gray-800" : "border-gray-300"}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setBrushColor(color)}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={undoLastStroke}
                        disabled={drawingStrokes.length === 0}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Undo
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearCanvas}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Reference for Cube Copy */}
                {currentTask.type === "cube_copy" && (
                  <div className="text-center bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-800">Reference Cube:</h4>
                    <div className="inline-block bg-white p-4 rounded-lg shadow-sm">
                      <svg width="150" height="150" viewBox="0 0 150 150">
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="150" height="150" fill="url(#grid)" />

                        {/* Front face */}
                        <path d="M30 50 L30 110 L90 110 L90 50 Z" fill="#e3f2fd" stroke="#1976d2" strokeWidth="2" />

                        {/* Top face */}
                        <path d="M30 50 L50 30 L110 30 L90 50 Z" fill="#bbdefb" stroke="#1976d2" strokeWidth="2" />

                        {/* Right face */}
                        <path d="M90 50 L110 30 L110 90 L90 110 Z" fill="#90caf9" stroke="#1976d2" strokeWidth="2" />

                        {/* Hidden edges (dashed) */}
                        <path
                          d="M30 110 L50 90 L110 90 L110 30"
                          fill="none"
                          stroke="#1976d2"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <path d="M50 90 L50 30" fill="none" stroke="#1976d2" strokeWidth="1" strokeDasharray="3,3" />
                        <path d="M50 90 L90 110" fill="none" stroke="#1976d2" strokeWidth="1" strokeDasharray="3,3" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Drawing Canvas */}
                <div className="flex justify-center">
                  <div className="border-2 border-gray-300 rounded-lg shadow-lg bg-white">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={400}
                      className="cursor-crosshair rounded-lg"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Line Bisection Task */}
            {currentTask.type === "line_bisection" && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-8" ref={lineContainerRef}>
                  <div className="space-y-8">
                    {lines.map((line, index) => (
                      <div key={line.id} className="relative">
                        <div className="text-sm text-gray-600 mb-2">Line {index + 1}</div>
                        <div className="relative flex justify-center">
                          <div
                            className="h-2 bg-gray-800 cursor-crosshair rounded-full hover:bg-gray-700 transition-colors"
                            style={{ width: `${line.length}px` }}
                            onClick={(e) => handleLineBisection(line.id, e)}
                          >
                            {/* Center marker (hidden) */}
                            <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-transparent" />

                            {/* User click marker */}
                            {lineClicks.find((c) => c.lineId === line.id) && (
                              <div
                                className="absolute top-0 w-1 h-2 bg-red-500 rounded-full transform -translate-x-1/2"
                                style={{
                                  left: `${lineClicks.find((c) => c.lineId === line.id)?.relativeX * 100}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Accuracy feedback */}
                        {lineClicks.find((c) => c.lineId === line.id) && (
                          <div className="text-center mt-2">
                            <span
                              className={`text-sm font-medium ${
                                lineClicks.find((c) => c.lineId === line.id)!.accuracy > 80
                                  ? "text-green-600"
                                  : lineClicks.find((c) => c.lineId === line.id)!.accuracy > 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              Accuracy: {Math.round(lineClicks.find((c) => c.lineId === line.id)!.accuracy)}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                    <span className="text-blue-800 font-medium">
                      Progress: {lineClicks.length} / {lines.length} lines completed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Spatial Memory Task */}
            {currentTask.type === "spatial_memory" && (
              <div className="space-y-6">
                {showingPattern && (
                  <div className="text-center bg-blue-100 border border-blue-300 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-800 mb-2">Memorize this pattern</div>
                    <div className="text-lg text-blue-600">Time remaining: {patternCountdown}s</div>
                  </div>
                )}

                {!showingPattern && userPattern.length === 0 && (
                  <div className="text-center bg-green-100 border border-green-300 rounded-lg p-4">
                    <div className="text-lg font-semibold text-green-800">
                      Now recreate the pattern by clicking on the squares
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <div className="grid grid-cols-6 gap-2 p-4 bg-white border rounded-lg shadow-sm">
                    {Array(36)
                      .fill(null)
                      .map((_, index) => {
                        const x = index % 6
                        const y = Math.floor(index / 6)
                        const isMemoryPattern = memoryPattern.some((p) => p.x === x && p.y === y)
                        const isUserPattern = userPattern.some((p) => p.x === x && p.y === y)

                        return (
                          <button
                            key={index}
                            className={`w-12 h-12 border-2 rounded-lg transition-all duration-200 ${
                              showingPattern && isMemoryPattern
                                ? "bg-blue-500 border-blue-600 shadow-lg"
                                : !showingPattern && isUserPattern
                                  ? "bg-green-500 border-green-600 shadow-lg"
                                  : "bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                            }`}
                            onClick={() => handleSpatialMemoryClick(x, y)}
                            disabled={showingPattern}
                          />
                        )
                      })}
                  </div>
                </div>

                {!showingPattern && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                      <span className="text-green-800 font-medium">
                        Selected: {userPattern.length} / {memoryPattern.length} squares
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center pt-6">
              <Button
                onClick={completeCurrentTask}
                className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                disabled={
                  (currentTask.type === "line_bisection" && lineClicks.length < lines.length) ||
                  (currentTask.type === "spatial_memory" && (showingPattern || userPattern.length === 0)) ||
                  ((currentTask.type === "clock_drawing" || currentTask.type === "cube_copy") &&
                    drawingStrokes.length === 0)
                }
              >
                {currentTaskIndex < VISUOSPATIAL_TASKS.length - 1 ? "Next Task" : "Complete Assessment"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
