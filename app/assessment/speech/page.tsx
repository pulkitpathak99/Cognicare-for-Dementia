// In: app/assessment/speech/page.tsx
"use client";

import React, { useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AudioLines,
  CheckCircle,
  ChevronRight,
  Loader2,
  Mic,
  RefreshCcw,
  Square,
  Volume2,
} from "lucide-react";
import { speechAnalyzer, type SpeechAnalysisResult } from "@/lib/speech-analysis";
import { storage, type AssessmentResult } from "@/lib/storage";
import { cn } from "@/lib/utils"; // Assuming you have this utility

// ============================================================================
// RE-DEFINED & SIMPLIFIED UI COMPONENTS (for consistency and reliability)
// ============================================================================

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "destructive" | "outline" }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 gap-2",
        variants[variant],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// ============================================================================
// STATE MANAGEMENT & TYPES
// ============================================================================

type Status = "idle" | "ready" | "recording" | "reviewing" | "analyzing" | "complete";
type State = {
  status: Status;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  analysisResult: SpeechAnalysisResult | null;
  error: string | null;
  prompt: string;
};

type Action =
  | { type: "INITIALIZE" }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING"; payload: { blob: Blob; url: string; transcript: string } }
  | { type: "CONFIRM_RECORDING" }
  | { type: "RETAKE" }
  | { type: "ANALYSIS_COMPLETE"; payload: SpeechAnalysisResult }
  | { type: "ERROR"; payload: string };

const initialState: State = {
  status: "idle",
  audioBlob: null,
  audioUrl: null,
  transcript: "",
  analysisResult: null,
  error: null,
  prompt: speechAnalyzer.generateSpeechPrompts()[0], // Start with the first prompt
};

function speechReducer(state: State, action: Action): State {
  switch (action.type) {
    case "INITIALIZE":
      return { ...state, status: "ready" };
    case "START_RECORDING":
      return { ...state, status: "recording", audioBlob: null, audioUrl: null, transcript: "" };
    case "STOP_RECORDING":
      return { ...state, status: "reviewing", ...action.payload };
    case "CONFIRM_RECORDING":
      return { ...state, status: "analyzing" };
    case "RETAKE":
      return { ...state, status: "ready", audioBlob: null, audioUrl: null, transcript: "" };
    case "ANALYSIS_COMPLETE":
      return { ...state, status: "complete", analysisResult: action.payload };
    case "ERROR":
      return { ...state, status: "idle", error: action.payload };
    default:
      return state;
  }
}

// ============================================================================
// CUSTOM HOOK: useSpeechRecorder
// ============================================================================

function useSpeechRecorder(onStop: Action["payload"] => void, onError: (msg: string) => void) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef("");

  const start = async () => {
    transcriptRef.current = "";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        onStop({ blob, url, transcript: transcriptRef.current });
        stream.getTracks().forEach((track) => track.stop());
      };

      // --- Speech Recognition ---
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcriptRef.current += event.results[i][0].transcript + " ";
            }
          }
        };
        recognitionRef.current.start();
      }
      mediaRecorderRef.current.start();
    } catch (err) {
      onError("Microphone access was denied. Please enable it in your browser settings.");
    }
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
  };

  return { start, stop };
}

// ============================================================================
// MAIN COMPONENT: SpeechAssessmentPage
// ============================================================================

export default function SpeechAssessmentPage() {
  const [state, dispatch] = useReducer(speechReducer, initialState);
  const startTimeRef = useRef<number>(0);

  const handleStop = (payload: Action["payload"]) => {
    const duration = Date.now() - startTimeRef.current;
    dispatch({ type: "STOP_RECORDING", payload: { ...payload, duration } });
  };
  
  const handleError = (message: string) => dispatch({ type: "ERROR", payload: message });

  const { start, stop } = useSpeechRecorder(handleStop, handleError);

  useEffect(() => {
    // On mount, ask for permissions to move to 'ready' state.
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        dispatch({ type: "INITIALIZE" });
        stream.getTracks().forEach((track) => track.stop()); // We don't need the stream yet
      })
      .catch(() =>
        handleError("Microphone access is required. Please grant permission to start.")
      );
  }, []);

  useEffect(() => {
    if (state.status === "analyzing" && state.audioBlob) {
      // Simulate analysis delay
      setTimeout(() => {
        const durationInSeconds = (Date.now() - startTimeRef.current) / 1000;
        const result = speechAnalyzer.analyzeTranscript(state.transcript, durationInSeconds);
        dispatch({ type: "ANALYSIS_COMPLETE", payload: result });
        
        // Save to storage
        const userId = localStorage.getItem("currentUserId") || 'guest';
        const score = Math.round(Object.values(result.metrics).reduce((a, b) => a + b, 0) / 5);
        const assessment: AssessmentResult = {
          id: `speech_${Date.now()}`,
          userId,
          type: "speech",
          score,
          maxScore: 100,
          duration: Math.round(durationInSeconds * 1000),
          details: { ...result, prompt: state.prompt },
          completedAt: new Date().toISOString(),
        };
        storage.saveAssessmentResult(assessment);
      }, 1500);
    }
  }, [state.status, state.audioBlob, state.transcript, state.prompt]);

  const handleStartRecording = () => {
    startTimeRef.current = Date.now();
    start();
    dispatch({ type: "START_RECORDING" });
  };
  
  // --- RENDER LOGIC ---

  if (state.status === 'complete' && state.analysisResult) {
    const result = state.analysisResult;
    const overallScore = Math.round(Object.values(result.metrics).reduce((a, b) => a + b, 0) / 5);
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl mt-4">Assessment Complete</CardTitle>
              <CardDescription>Here is the summary of your speech analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="rounded-lg bg-primary/10 p-4">
                  <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold">Overall Speech Score</h4>
                      <p className="text-2xl font-bold text-primary">{overallScore}</p>
                  </div>
                  <div className="w-full bg-primary/20 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${overallScore}%` }}></div>
                  </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  {Object.entries(result.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-muted/50 p-3">
                          <p className="text-2xl font-bold">{value}</p>
                          <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      </div>
                  ))}
              </div>
              <div className="flex gap-4">
                  <Button variant="outline" className="w-full" onClick={() => dispatch({ type: 'RETAKE' })}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Take Again
                  </Button>
                  <Button className="w-full" asChild>
                      <Link href="/dashboard">
                          Go to Dashboard
                          <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                  </Button>
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <div className="mb-4">
        <Link href="/dashboard" className="text-sm inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <AudioLines className="w-6 h-6 text-primary" />
                Speech Assessment
              </CardTitle>
              <CardDescription>Please respond clearly to the prompt below.</CardDescription>
            </div>
            {state.status === "recording" && (
              <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-sm text-destructive">
                <div className="h-2 w-2 rounded-full bg-destructive animate-pulse"></div>
                Recording
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-accent/50 p-6 text-center">
            <h3 className="text-lg leading-relaxed">{state.prompt}</h3>
          </div>

          {state.error && <p className="text-sm text-center text-destructive">{state.error}</p>}
          
          {state.status === "ready" && (
            <Button className="w-full" onClick={handleStartRecording}>
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </Button>
          )}

          {state.status === "recording" && (
            <Button className="w-full" variant="destructive" onClick={stop}>
              <Square className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          )}

          {state.status === "reviewing" && (
            <div className="space-y-4">
              <h4 className="text-center font-semibold">Review Your Recording</h4>
              <audio src={state.audioUrl!} controls className="w-full" />
              <div className="flex gap-4">
                <Button variant="outline" className="w-full" onClick={() => dispatch({ type: "RETAKE" })}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button className="w-full" onClick={() => dispatch({ type: "CONFIRM_RECORDING" })}>
                  Confirm & Analyze <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {state.status === "analyzing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Analyzing your speech patterns...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
