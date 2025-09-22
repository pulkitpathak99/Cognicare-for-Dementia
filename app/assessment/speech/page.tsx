"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Mic, Square, CheckCircle, ChevronRight, RefreshCcw, Volume2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { storage, type AssessmentResult } from "@/lib/storage"

type SpeechTask = {
  id: string
  title: string
  instruction: string
  category: "fluency" | "naming" | "description"
  timeLimit: number
  prompt?: string
}

type TaskResult = {
  taskId: string
  audioBlob: Blob | null
  duration: number
  wordsSpoken: number
  pauseCount: number
  score: number
}

const SPEECH_TASKS: SpeechTask[] = [
  {
    id: "semantic_fluency",
    title: "Category Fluency",
    instruction: "Name as many animals as you can in 60 seconds. Speak clearly and don't repeat any animals.",
    category: "fluency",
    timeLimit: 60000,
  },
  {
    id: "phonemic_fluency",
    title: "Letter Fluency",
    instruction:
      "Name as many words as you can that start with the letter 'F' in 60 seconds. Don't use proper names or repeat words.",
    category: "fluency",
    timeLimit: 60000,
  },
  {
    id: "picture_naming",
    title: "Picture Description",
    instruction:
      "Look at this kitchen scene and describe everything you see in detail. Take your time and be thorough.",
    category: "description",
    timeLimit: 120000,
    prompt: "Describe this busy kitchen scene with people cooking, utensils on the counter, and food being prepared.",
  },
]

export default function SpeechAssessmentPage() {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [taskResults, setTaskResults] = useState<TaskResult[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const wordCountRef = useRef<number>(0)
  const pauseCountRef = useRef<number>(0)

  const currentTask = SPEECH_TASKS[currentTaskIndex]

  useEffect(() => {
    checkMicrophonePermission()
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setHasPermission(true)
    } catch (error) {
      console.error("Microphone permission denied:", error)
      setHasPermission(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      wordCountRef.current = 0
      pauseCountRef.current = 0
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setTimeRemaining(currentTask.timeLimit)

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            stopRecording()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    } catch (error) {
      console.error("Failed to start recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Calculate basic metrics (simplified for demo)
      const duration = Date.now() - startTimeRef.current
      const estimatedWords = Math.floor(duration / 2000) // Rough estimate
      const estimatedPauses = Math.floor(duration / 5000) // Rough estimate
      const score = Math.min(100, Math.max(20, estimatedWords * 2))

      const result: TaskResult = {
        taskId: currentTask.id,
        audioBlob,
        duration,
        wordsSpoken: estimatedWords,
        pauseCount: estimatedPauses,
        score,
      }

      setTaskResults((prev) => [...prev, result])
    }
  }

  const nextTask = () => {
    if (currentTaskIndex < SPEECH_TASKS.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1)
      setAudioBlob(null)
      setTimeRemaining(0)
    } else {
      completeAssessment()
    }
  }

  const completeAssessment = () => {
    const userId = localStorage.getItem("currentUserId") || "guest"
    const totalScore = taskResults.reduce((sum, result) => sum + result.score, 0)
    const avgScore = Math.round(totalScore / taskResults.length)
    const totalDuration = taskResults.reduce((sum, result) => sum + result.duration, 0)

    const assessment: AssessmentResult = {
      id: `speech_${Date.now()}`,
      userId,
      type: "speech",
      score: avgScore,
      maxScore: 100,
      duration: totalDuration,
      details: {
        tasks: taskResults,
        fluencyScore:
          taskResults
            .filter((r) => SPEECH_TASKS.find((t) => t.id === r.taskId)?.category === "fluency")
            .reduce((sum, r) => sum + r.score, 0) / 2,
        descriptionScore: taskResults.find((r) => r.taskId === "picture_naming")?.score || 0,
        totalWords: taskResults.reduce((sum, r) => sum + r.wordsSpoken, 0),
        avgPauses: taskResults.reduce((sum, r) => sum + r.pauseCount, 0) / taskResults.length,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(assessment)
    setIsComplete(true)
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Microphone Access Required</CardTitle>
            <CardDescription>Please allow microphone access to complete the speech assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkMicrophonePermission} className="w-full">
              Grant Permission
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isComplete) {
    const avgScore = Math.round(taskResults.reduce((sum, r) => sum + r.score, 0) / taskResults.length)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-4xl py-8 px-4">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-3xl">Speech Assessment Complete!</CardTitle>
              <CardDescription className="text-lg">
                You completed all {SPEECH_TASKS.length} speech tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xl font-semibold">Overall Score</h4>
                  <p className="text-4xl font-bold">{avgScore}/100</p>
                </div>
                <Progress value={avgScore} className="h-3 bg-white/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {taskResults.map((result, index) => (
                  <div key={result.taskId} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">{SPEECH_TASKS[index].title}</h5>
                    <p className="text-2xl font-bold text-blue-600">{result.score}/100</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(result.duration / 1000)}s • ~{result.wordsSpoken} words
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => window.location.reload()}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retake Assessment
                </Button>
                <Button className="flex-1" asChild>
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
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Volume2 className="w-6 h-6 text-blue-600" />
                  Speech Assessment
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Task {currentTaskIndex + 1} of {SPEECH_TASKS.length}: {currentTask.title}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {SPEECH_TASKS.map((_, index) => (
                  <Badge
                    key={index}
                    variant={
                      index === currentTaskIndex ? "default" : index < currentTaskIndex ? "secondary" : "outline"
                    }
                  >
                    {index + 1}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">{currentTask.title}</h3>
              <p className="text-gray-700 leading-relaxed">{currentTask.instruction}</p>
              {currentTask.prompt && (
                <div className="mt-4 p-4 bg-white rounded-lg border">
                  <p className="text-gray-600 italic">{currentTask.prompt}</p>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-semibold">Recording in progress...</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-600">
                  <Clock className="w-6 h-6" />
                  {Math.ceil(timeRemaining / 1000)}s remaining
                </div>
                <Progress
                  value={((currentTask.timeLimit - timeRemaining) / currentTask.timeLimit) * 100}
                  className="mt-4 h-2"
                />
              </div>
            )}

            {audioBlob && !isRecording && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-semibold mb-3">Recording Complete!</h4>
                <audio src={URL.createObjectURL(audioBlob)} controls className="w-full mb-4" />
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setAudioBlob(null)}>
                    Record Again
                  </Button>
                  <Button onClick={nextTask} className="flex-1">
                    {currentTaskIndex < SPEECH_TASKS.length - 1 ? "Next Task" : "Complete Assessment"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Mic className="mr-3 h-6 w-6" />
                Start Recording ({Math.ceil(currentTask.timeLimit / 1000)}s)
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="w-full h-14 text-lg">
                <Square className="mr-3 h-6 w-6" />
                Stop Recording
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
