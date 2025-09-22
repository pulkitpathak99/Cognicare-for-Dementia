"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Mic, MicOff, Volume2, User, Heart, Shield, CheckCircle } from "lucide-react"
import { storage, type UserProfile } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<any>
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    medicalHistory: [] as string[],
    consentGiven: false,
    voiceAssistance: false,
  })

  // Voice synthesis for accessibility
  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  // Voice recognition for input assistance
  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        // Handle voice input based on current step
        handleVoiceInput(transcript)
      }

      recognition.start()
    }
  }

  const handleVoiceInput = (transcript: string) => {
    // Simple voice command processing
    if (currentStep === 0 && transcript.toLowerCase().includes("name")) {
      const nameMatch = transcript.match(/my name is (.+)/i)
      if (nameMatch) {
        setFormData((prev) => ({ ...prev, name: nameMatch[1] }))
      }
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      speak(steps[currentStep + 1].title)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      speak(steps[currentStep - 1].title)
    }
  }

  const completeOnboarding = () => {
    const userId = `user_${Date.now()}`
    const userProfile: UserProfile = {
      id: userId,
      name: formData.name,
      age: Number.parseInt(formData.age),
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      emergencyContact: formData.emergencyContactName
        ? {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelationship,
          }
        : undefined,
      medicalHistory: formData.medicalHistory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    storage.saveUserProfile(userProfile)
    localStorage.setItem("currentUserId", userId)
    router.push("/dashboard")
  }

  // Onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to CogniCare",
      description: "Let's get you set up for your cognitive assessment",
      component: WelcomeStep,
    },
    {
      id: "basic-info",
      title: "Basic Information",
      description: "Tell us a bit about yourself",
      component: BasicInfoStep,
    },
    {
      id: "emergency-contact",
      title: "Emergency Contact",
      description: "Someone we can contact if needed",
      component: EmergencyContactStep,
    },
    {
      id: "medical-history",
      title: "Medical History",
      description: "Help us understand your health background",
      component: MedicalHistoryStep,
    },
    {
      id: "consent",
      title: "Privacy & Consent",
      description: "Review and agree to our privacy practices",
      component: ConsentStep,
    },
    {
      id: "complete",
      title: "Setup Complete",
      description: "You're ready to begin your assessment",
      component: CompleteStep,
    },
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  useEffect(() => {
    speak(steps[currentStep].title)
  }, [currentStep, voiceEnabled])

  const CurrentStepComponent = steps[currentStep].component

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Getting Started</h1>
            <div className="flex items-center gap-2">
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
              {voiceEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startListening}
                  disabled={isListening}
                  className={isListening ? "bg-destructive/10" : ""}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
            <CardDescription className="text-large">{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              speak={speak}
              voiceEnabled={voiceEnabled}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="button-large bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button onClick={completeOnboarding} className="button-large" disabled={!formData.consentGiven}>
              Complete Setup
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="button-large">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function WelcomeStep({ speak, voiceEnabled }: any) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
        <User className="w-10 h-10 text-primary" />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Welcome to Your Cognitive Health Journey</h3>
        <p className="text-muted-foreground text-large leading-relaxed">
          CogniCare is designed to help you monitor your cognitive health through simple, engaging assessments. This
          setup will take about 5 minutes and helps us personalize your experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4">
            <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium">Personalized</h4>
            <p className="text-sm text-muted-foreground">Tailored to your needs</p>
          </div>
          <div className="text-center p-4">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium">Private</h4>
            <p className="text-sm text-muted-foreground">Your data stays secure</p>
          </div>
          <div className="text-center p-4">
            <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
            <h4 className="font-medium">Simple</h4>
            <p className="text-sm text-muted-foreground">Easy to use interface</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BasicInfoStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            Full Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            placeholder="Enter your full name"
            className="text-large h-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age" className="text-base">
            Age *
          </Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => updateFormData("age", e.target.value)}
            placeholder="Enter your age"
            className="text-large h-12"
            min="18"
            max="120"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">
            Email (Optional)
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder="your.email@example.com"
            className="text-large h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base">
            Phone Number (Optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            placeholder="(555) 123-4567"
            className="text-large h-12"
          />
        </div>
      </div>
    </div>
  )
}

function EmergencyContactStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Please provide an emergency contact who we can reach if needed during your assessment.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emergencyName" className="text-base">
            Contact Name
          </Label>
          <Input
            id="emergencyName"
            value={formData.emergencyContactName}
            onChange={(e) => updateFormData("emergencyContactName", e.target.value)}
            placeholder="Emergency contact's full name"
            className="text-large h-12"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyPhone" className="text-base">
              Contact Phone
            </Label>
            <Input
              id="emergencyPhone"
              type="tel"
              value={formData.emergencyContactPhone}
              onChange={(e) => updateFormData("emergencyContactPhone", e.target.value)}
              placeholder="(555) 123-4567"
              className="text-large h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship" className="text-base">
              Relationship
            </Label>
            <Select onValueChange={(value) => updateFormData("emergencyContactRelationship", value)}>
              <SelectTrigger className="h-12 text-large">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function MedicalHistoryStep({ formData, updateFormData }: any) {
  const medicalConditions = [
    "Diabetes",
    "High Blood Pressure",
    "Heart Disease",
    "Stroke",
    "Depression",
    "Anxiety",
    "Memory Problems",
    "Head Injury",
    "Sleep Disorders",
    "Hearing Loss",
    "Vision Problems",
  ]

  const toggleCondition = (condition: string) => {
    const current = formData.medicalHistory || []
    const updated = current.includes(condition)
      ? current.filter((c: string) => c !== condition)
      : [...current, condition]
    updateFormData("medicalHistory", updated)
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Please select any medical conditions that apply to you. This information helps us provide more accurate
        assessments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicalConditions.map((condition) => (
          <div key={condition} className="flex items-center space-x-3">
            <Checkbox
              id={condition}
              checked={formData.medicalHistory?.includes(condition) || false}
              onCheckedChange={() => toggleCondition(condition)}
              className="touch-target"
            />
            <Label htmlFor={condition} className="text-base cursor-pointer">
              {condition}
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="otherConditions" className="text-base">
          Other Conditions or Medications
        </Label>
        <Textarea
          id="otherConditions"
          placeholder="Please list any other medical conditions or medications..."
          className="text-large min-h-20"
        />
      </div>
    </div>
  )
}

function ConsentStep({ formData, updateFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-6 rounded-lg">
        <h3 className="font-semibold mb-4">Privacy & Data Protection</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• Your personal information is encrypted and stored securely on your device</p>
          <p>• Assessment data is used only to generate your cognitive health insights</p>
          <p>• You can delete your data at any time from the settings</p>
          <p>• We comply with HIPAA and GDPR privacy regulations</p>
          <p>• No data is shared with third parties without your explicit consent</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={formData.consentGiven}
            onCheckedChange={(checked) => updateFormData("consentGiven", checked)}
            className="touch-target mt-1"
          />
          <Label htmlFor="consent" className="text-base leading-relaxed cursor-pointer">
            I understand and agree to the privacy practices described above. I consent to the collection and processing
            of my health data for the purpose of cognitive assessment and risk scoring.
          </Label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="voiceAssistance"
            checked={formData.voiceAssistance}
            onCheckedChange={(checked) => updateFormData("voiceAssistance", checked)}
            className="touch-target mt-1"
          />
          <Label htmlFor="voiceAssistance" className="text-base leading-relaxed cursor-pointer">
            Enable voice assistance for assessments (recommended for accessibility)
          </Label>
        </div>
      </div>
    </div>
  )
}

function CompleteStep({ formData }: any) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-success" />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Setup Complete!</h3>
        <p className="text-muted-foreground text-large leading-relaxed">
          Welcome, {formData.name}! Your profile has been created successfully. You're now ready to begin your cognitive
          health assessment journey.
        </p>
        <div className="bg-accent/10 p-4 rounded-lg">
          <p className="text-sm text-accent-foreground">
            <strong>Next Steps:</strong> You'll be taken to your dashboard where you can start your first cognitive
            assessment. The initial assessment will establish your cognitive baseline for future comparisons.
          </p>
        </div>
      </div>
    </div>
  )
}
