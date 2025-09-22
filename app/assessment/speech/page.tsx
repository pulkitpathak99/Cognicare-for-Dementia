"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic,
  Play,
  Pause,
  Square,
  Clock,
  ArrowLeft,
  CheckCircle,
  Volume2,
  AudioWaveform as Waveform,
  FileAudio,
} from "lucide-react"
import { storage, type AssessmentResult } from "@/lib/storage"
import { speechAnalyzer, type SpeechAnalysisResult } from "@/lib/speech-analysis"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SpeechAssessmentPage() {
  const router = useRouter()
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Analysis state
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [prompts, setPrompts] = useState<string[]>([])
  const [transcript, setTranscript] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<SpeechAnalysisResult | null>(null)
  const [testComplete, setTestComplete] = useState(false)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const pauseTimesRef = useRef<number[]>([])
  const lastSpeechTimeRef = useRef<number>(0)

  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    const speechPrompts = speechAnalyzer.generateSpeechPrompts()
    setPrompts(speechPrompts)
    speak(
      "Welcome to the speech assessment. You'll be asked to speak about different topics while we analyze your speech patterns.",
    )
  }, [voiceEnabled])

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
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      pauseTimesRef.current = []
      lastSpeechTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start speech recognition for real-time transcription
      if ("webkitSpeechRecognition" in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " "
              lastSpeechTimeRef.current = Date.now()
            } else {
              interimTranscript += transcript
            }
          }

          setTranscript((prev) => prev + finalTranscript)
        }

        recognition.onspeechend = () => {
          const pauseLength = Date.now() - lastSpeechTimeRef.current
          if (pauseLength > 500) {
            // Pause longer than 500ms
            pauseTimesRef.current.push(pauseLength)
          }
        }

        recognitionRef.current = recognition
        recognition.start()
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      speak("Recording started. Please respond to the prompt.")
    } catch (error) {
      console.error("Error starting recording:", error)
      speak("Unable to access microphone. Please check your permissions.")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        recognitionRef.current?.start()
        setIsPaused(false)
        speak("Recording resumed")
      } else {
        mediaRecorderRef.current.pause()
        recognitionRef.current?.stop()
        setIsPaused(true)
        speak("Recording paused")
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      recognitionRef.current?.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }

      speak("Recording stopped. Analyzing your speech...")
      analyzeRecording()
    }
  }

  const analyzeRecording = async () => {
    if (!transcript || recordingTime === 0) return

    setIsAnalyzing(true)

    try {
      // Analyze the transcript
      const result = speechAnalyzer.analyzeTranscript(transcript, recordingTime, pauseTimesRef.current)

      // Simulate acoustic analysis if audio blob exists
      if (audioBlob) {
        const acousticData = await speechAnalyzer.simulateAcousticAnalysis(audioBlob)
        // In a real implementation, acoustic data would influence the metrics
      }

      setAnalysisResult(result)

      // Save assessment result
      const userId = localStorage.getItem("currentUserId")
      if (userId) {
        const totalScore = Object.values(result.metrics).reduce((a, b) => a + b, 0) / 5

        const assessmentResult: AssessmentResult = {
          id: `speech_${Date.now()}`,
          userId,
          type: "speech",
          score: Math.round(totalScore),
          maxScore: 100,
          duration: Date.now() - startTime,
          details: {
            transcript: result.transcript,
            wordCount: result.wordCount,
            uniqueWords: result.uniqueWords,
            speakingRate: result.speakingRate,
            metrics: result.metrics,
            prompt: prompts[currentPrompt],
          },
          completedAt: new Date().toISOString(),
        }

        storage.saveAssessmentResult(assessmentResult)
      }

      setTestComplete(true)
      speak("Speech analysis complete. Your results are ready.")
    } catch (error) {
      console.error("Error analyzing speech:", error)
      speak("There was an error analyzing your speech. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const nextPrompt = () => {
    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1)
      setTranscript("")
      setAudioBlob(null)
      setAudioUrl(null)
      setAnalysisResult(null)
      speak(prompts[currentPrompt + 1])
    }
  }

  if (testComplete && analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <CardTitle className="text-2xl">Speech Assessment Complete!</CardTitle>
              <CardDescription>Your speech patterns have been analyzed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Speech Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisResult.metrics.fluency}</div>
                  <div className="text-sm text-muted-foreground">Fluency</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisResult.metrics.coherence}</div>
                  <div className="text-sm text-muted-foreground">Coherence</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisResult.metrics.vocabularyDiversity}</div>
                  <div className="text-sm text-muted-foreground">Vocabulary</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisResult.metrics.pauseFrequency}</div>
                  <div className="text-sm text-muted-foreground">Pause Pattern</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{analysisResult.metrics.articulation}</div>
                  <div className="text-sm text-muted-foreground">Articulation</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{Math.round(analysisResult.speakingRate)}</div>
                  <div className="text-sm text-muted-foreground">Words/Min</div>
                </div>
              </div>

              {/* Overall Score */}
              <div className="bg-primary/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Overall Speech Score</h3>
                <div className="text-4xl font-bold text-primary mb-2">
                  {Math.round(Object.values(analysisResult.metrics).reduce((a, b) => a + b, 0) / 5)}
                </div>
                <Progress
                  value={Object.values(analysisResult.metrics).reduce((a, b) => a + b, 0) / 5}
                  className="h-3"
                />
              </div>

              {/* Speech Statistics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p>
                    <strong>Words Spoken:</strong> {analysisResult.wordCount}
                  </p>
                  <p>
                    <strong>Unique Words:</strong> {analysisResult.uniqueWords}
                  </p>
                  <p>
                    <strong>Recording Time:</strong> {Math.floor(analysisResult.duration / 60)}m{" "}
                    {analysisResult.duration % 60}s
                  </p>
                </div>
                <div className="text-left">
                  <p>
                    <strong>Pauses:</strong> {analysisResult.pauseCount}
                  </p>
                  <p>
                    <strong>Filler Words:</strong> {analysisResult.fillerWords}
                  </p>
                  <p>
                    <strong>Avg Pause:</strong> {analysisResult.averagePauseLength.toFixed(1)}s
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button className="w-full button-large" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full button-large bg-transparent" asChild>
                  <Link href="/results">View Detailed Results</Link>
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
                <Waveform className="w-6 h-6 text-primary" />
                Speech Assessment
              </h1>
              <p className="text-muted-foreground">Analyze your speech patterns and language skills</p>
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
            <Badge variant="default">Speech Recording</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recording Controls */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Speech Recording</CardTitle>
                <CardDescription>
                  Prompt {currentPrompt + 1} of {prompts.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Prompt */}
                <div className="bg-accent/10 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Please respond to this prompt:</h3>
                  <p className="text-lg leading-relaxed">{prompts[currentPrompt]}</p>
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center gap-4">
                  {!isRecording ? (
                    <Button onClick={startRecording} className="button-large" disabled={isAnalyzing}>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <>
                      <Button onClick={pauseRecording} variant="outline" className="button-large bg-transparent">
                        {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                        {isPaused ? "Resume" : "Pause"}
                      </Button>
                      <Button onClick={stopRecording} variant="destructive" className="button-large">
                        <Square className="w-5 h-5 mr-2" />
                        Stop & Analyze
                      </Button>
                    </>
                  )}
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                      <span className="text-sm font-medium">{isPaused ? "Recording Paused" : "Recording..."}</span>
                    </div>
                    <div className="text-2xl font-mono">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                )}

                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Analyzing your speech patterns...</p>
                  </div>
                )}

                {/* Audio Playback */}
                {audioUrl && !isAnalyzing && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <FileAudio className="w-5 h-5 text-primary" />
                      <span className="font-medium">Your Recording</span>
                    </div>
                    <audio controls className="w-full">
                      <source src={audioUrl} type="audio/webm" />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live Transcript */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Transcript</CardTitle>
                <CardDescription>Your speech is being transcribed in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your speech will appear here as you talk..."
                  className="min-h-40 text-sm"
                  readOnly={isRecording}
                />

                {transcript && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    <p>Words: {transcript.split(/\s+/).filter((w) => w.length > 0).length}</p>
                    <p>Characters: {transcript.length}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Speak clearly and naturally</p>
                <p>• Take your time to think</p>
                <p>• Include as much detail as possible</p>
                <p>• Don't worry about perfect grammar</p>
                <p>• Aim for 1-2 minutes of speaking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
