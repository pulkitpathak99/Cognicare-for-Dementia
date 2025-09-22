// In: app/assessment/speech/page.tsx
"use client";

import {
  ArrowLeft,
  AudioLines,
  CheckCircle,
  Clock,
  FileAudio,
  Mic,
  Pause,
  Play,
  Square,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useReducer, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { speechAnalyzer, type SpeechAnalysisResult } from "@/lib/speech-analysis";
import { storage, type AssessmentResult } from "@/lib/storage";

// Helper to format time from seconds
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// --- STATE MANAGEMENT ---
type State = {
  status: "idle" | "recording" | "paused" | "analyzing" | "complete";
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  interimTranscript: string;
  analysisResult: SpeechAnalysisResult | null;
  currentPromptIndex: number;
  prompts: string[];
  isBrowserSupported: boolean;
  voiceAssist: boolean;
  startTime: number;
};

type Action =
  | { type: "START_RECORDING" }
  | { type: "PAUSE_RECORDING" }
  | { type: "RESUME_RECORDING" }
  | { type: "STOP_RECORDING"; blob: Blob; url: string }
  | { type: "START_ANALYSIS" }
  | { type: "ANALYSIS_COMPLETE"; result: SpeechAnalysisResult }
  | { type: "TICK" }
  | { type: "SET_TRANSCRIPT"; payload: string }
  | { type: "SET_INTERIM_TRANSCRIPT"; payload: string }
  | { type: "RESET_TEST" }
  | { type: "TOGGLE_VOICE_ASSIST" }
  | { type: "SET_PROMPTS"; payload: string[] }
  | { type: "SET_UNSUPPORTED" };

const initialState: State = {
  status: "idle",
  recordingTime: 0,
  audioBlob: null,
  audioUrl: null,
  transcript: "",
  interimTranscript: "",
  analysisResult: null,
  currentPromptIndex: 0,
  prompts: [],
  isBrowserSupported: true,
  voiceAssist: false,
  startTime: 0,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_PROMPTS":
      return { ...state, prompts: action.payload };
    case "START_RECORDING":
      return {
        ...state,
        status: "recording",
        recordingTime: 0,
        transcript: "",
        interimTranscript: "",
        audioBlob: null,
        audioUrl: null,
        startTime: Date.now(),
      };
    case "PAUSE_RECORDING":
      return { ...state, status: "paused" };
    case "RESUME_RECORDING":
      return { ...state, status: "recording" };
    case "STOP_RECORDING":
      return { ...state, status: "analyzing", audioBlob: action.blob, audioUrl: action.url };
    case "ANALYSIS_COMPLETE":
      return { ...state, status: "complete", analysisResult: action.result };
    case "TICK":
      return { ...state, recordingTime: state.recordingTime + 1 };
    case "SET_TRANSCRIPT":
      return { ...state, transcript: state.transcript + action.payload };
    case "SET_INTERIM_TRANSCRIPT":
      return { ...state, interimTranscript: action.payload };
    case "RESET_TEST":
      return {
        ...initialState,
        prompts: state.prompts,
        voiceAssist: state.voiceAssist,
        isBrowserSupported: state.isBrowserSupported,
      };
    case "TOGGLE_VOICE_ASSIST":
      return { ...state, voiceAssist: !state.voiceAssist };
    case "SET_UNSUPPORTED":
      return { ...state, isBrowserSupported: false };
    default:
      return state;
  }
};

// --- Custom Hook for Audio & Speech Recognition ---
const useSpeechRecognition = (dispatch: React.Dispatch<Action>) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        dispatch({ type: "STOP_RECORDING", blob: audioBlob, url: audioUrl });
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();
      dispatch({ type: "START_RECORDING" });

      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        dispatch({ type: "SET_UNSUPPORTED" });
        return;
      }
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            dispatch({ type: "SET_TRANSCRIPT", payload: transcriptPart + " " });
          } else {
            interim += transcriptPart;
          }
        }
        dispatch({ type: "SET_INTERIM_TRANSCRIPT", payload: interim });
      };

      recognition.onend = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          try {
            recognition.start();
          } catch (e) {
            console.error("Error restarting recognition:", e);
          }
        }
      };
      recognition.start();
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access is required for this test.");
    }
  };

  const stop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const pause = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      recognitionRef.current?.stop();
      dispatch({ type: "PAUSE_RECORDING" });
    }
  };

  const resume = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      recognitionRef.current?.start();
      dispatch({ type: "RESUME_RECORDING" });
    }
  };

  return { start, stop, pause, resume };
};

// --- UI Sub-components ---
const TestHeader = ({
  status,
  recordingTime,
  voiceAssist,
  onToggleVoice,
}: {
  status: State["status"];
  recordingTime: number;
  voiceAssist: boolean;
  onToggleVoice: () => void;
}) => (
  <header className="mb-8">
    <Link
      href="/dashboard"
      className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Dashboard
    </Link>
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AudioLines className="w-6 h-6 text-primary" />
          Speech Assessment
        </h1>
        <p className="text-muted-foreground">
          Analyze your speech patterns and language skills.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onToggleVoice}>
        <Volume2 className="w-4 h-4 mr-2" />
        {voiceAssist ? "Voice On" : "Voice Off"}
      </Button>
    </div>
    <div className="flex items-center gap-4 mt-4">
      <Badge>Speech Recording</Badge>
      {(status === "recording" || status === "paused") && (
        <div className="flex items-center gap-2 ml-auto">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(recordingTime)}
          </span>
        </div>
      )}
    </div>
  </header>
);

const RecordingControls = ({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  status: State["status"];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) => (
  <div className="flex justify-center gap-4 py-4">
    {status === "idle" && (
      <Button onClick={onStart} size="lg">
        <Mic className="w-5 h-5 mr-2" />
        Start Recording
      </Button>
    )}
    {status === "recording" && (
      <>
        <Button onClick={onPause} variant="outline" size="lg">
          <Pause className="w-5 h-5 mr-2" />
          Pause
        </Button>
        <Button onClick={onStop} variant="destructive" size="lg">
          <Square className="w-5 h-5 mr-2" />
          Stop & Analyze
        </Button>
      </>
    )}
    {status === "paused" && (
      <>
        <Button onClick={onResume} variant="outline" size="lg">
          <Play className="w-5 h-5 mr-2" />
          Resume
        </Button>
        <Button onClick={onStop} variant="destructive" size="lg">
          <Square className="w-5 h-5 mr-2" />
          Stop & Analyze
        </Button>
      </>
    )}
  </div>
);

const TranscriptDisplay = ({
  transcript,
  interimTranscript,
  isSupported,
  onTranscriptChange,
}: {
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  onTranscriptChange: (value: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Live Transcript</CardTitle>
      <CardDescription>
        {isSupported
          ? "Your speech is being transcribed in real-time."
          : "Transcription is not supported. Please type your response."}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Textarea
        value={`${transcript}${interimTranscript}`}
        onChange={(e) => onTranscriptChange(e.target.value)}
        placeholder="Your transcribed speech will appear here..."
        className="min-h-[200px] text-base"
        readOnly={isSupported}
      />
    </CardContent>
  </Card>
);

const ResultsDisplay = ({
  result,
  onReset,
}: {
  result: SpeechAnalysisResult;
  onReset: () => void;
}) => {
  const overallScore = Math.round(
    Object.values(result.metrics).reduce((a, b) => a + b, 0) / 5
  );

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card className="text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          <CardDescription>Your speech patterns have been analyzed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/10 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Overall Speech Score</h3>
            <div className="text-4xl font-bold text-primary mb-2">{overallScore}</div>
            <Progress value={overallScore} className="h-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            {Object.entries(result.metrics).map(([key, value]) => (
              <div key={key} className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
              </div>
            ))}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-2xl font-bold">{Math.round(result.speakingRate)}</div>
              <div className="text-sm text-muted-foreground">Words/Min</div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={onReset} variant="outline">
              Take Another Test
            </Button>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Main Page Component ---
export default function SpeechAssessmentPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const { start, stop, pause, resume } = useSpeechRecognition(dispatch);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Text-to-speech utility
  const speak = (text: string) => {
    if (state.voiceAssist && "speechSynthesis" in window) {
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  // Effect to load prompts on mount
  useEffect(() => {
    dispatch({ type: "SET_PROMPTS", payload: speechAnalyzer.generateSpeechPrompts() });
  }, []);

  // Effect to manage recording timer
  useEffect(() => {
    if (state.status === "recording") {
      recordingIntervalRef.current = setInterval(() => dispatch({ type: "TICK" }), 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [state.status]);

  // Effect to handle analysis and save results
  useEffect(() => {
    if (state.status === "analyzing" && state.audioBlob) {
      const analyze = async () => {
        const result = speechAnalyzer.analyzeTranscript(
          state.transcript,
          state.recordingTime
        );
        dispatch({ type: "ANALYSIS_COMPLETE", result });

        const userId = localStorage.getItem("currentUserId");
        if (userId) {
          const score = Math.round(
            Object.values(result.metrics).reduce((a, b) => a + b, 0) / 5
          );
          const assessment: AssessmentResult = {
            id: `speech_${Date.now()}`,
            userId,
            type: "speech",
            score,
            maxScore: 100,
            duration: Date.now() - state.startTime,
            details: { ...result, prompt: state.prompts[state.currentPromptIndex] },
            completedAt: new Date().toISOString(),
          };
          storage.saveAssessmentResult(assessment);
        }
      };
      analyze();
    }
  }, [
    state.status,
    state.audioBlob,
    state.transcript,
    state.recordingTime,
    state.startTime,
    state.prompts,
    state.currentPromptIndex,
  ]);

  const handleToggleVoice = () => {
    dispatch({ type: "TOGGLE_VOICE_ASSIST" });
    speak(state.voiceAssist ? "Voice assistance disabled." : "Voice assistance enabled.");
  };

  if (state.status === "complete" && state.analysisResult) {
    return (
      <ResultsDisplay
        result={state.analysisResult}
        onReset={() => dispatch({ type: "RESET_TEST" })}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <TestHeader
        status={state.status}
        recordingTime={state.recordingTime}
        voiceAssist={state.voiceAssist}
        onToggleVoice={handleToggleVoice}
      />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Prompt {state.currentPromptIndex + 1} of {state.prompts.length}
              </CardTitle>
              <CardDescription className="text-lg pt-2">
                {state.prompts[state.currentPromptIndex] || "Loading prompt..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecordingControls
                status={state.status}
                onStart={start}
                onPause={pause}
                onResume={resume}
                onStop={stop}
              />
              {state.status === "analyzing" && (
                <div className="text-center text-muted-foreground">Analyzing...</div>
              )}
              {state.audioUrl && state.status !== "recording" && (
                <div className="mt-4 bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <FileAudio className="w-5 h-5 text-primary" />
                    <span className="font-medium">Your Recording</span>
                  </div>
                  <audio controls src={state.audioUrl} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <TranscriptDisplay
            transcript={state.transcript}
            interimTranscript={state.interimTranscript}
            isSupported={state.isBrowserSupported}
            onTranscriptChange={(value) =>
              dispatch({ type: "SET_TRANSCRIPT", payload: value })
            }
          />
        </div>
      </main>
    </div>
  );
}
