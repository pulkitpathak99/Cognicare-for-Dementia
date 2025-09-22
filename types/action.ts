// Action types for speech assessment reducer
export interface Action {
  type: string
  payload?: any
}

// Specific action types for better type safety
export type SpeechAction =
  | { type: "INITIALIZE"; payload: { canUseSpeechRecognition: boolean } }
  | { type: "START_RECORDING" }
  | { type: "STOP_RECORDING"; payload: { blob: Blob; url: string; transcript: string; duration: number } }
  | { type: "CONFIRM_RECORDING" }
  | { type: "RETAKE" }
  | { type: "ANALYSIS_COMPLETE"; payload: any }
  | { type: "ERROR"; payload: string }
  | { type: "UPDATE_TRANSCRIPT"; payload: string }

// Generic action interface for other reducers
export interface BaseAction {
  type: string
  payload?: any
}
