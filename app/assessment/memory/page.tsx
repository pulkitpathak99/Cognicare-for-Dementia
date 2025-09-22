"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Clock, ArrowLeft, CheckCircle, Volume2 } from "lucide-react"
import { storage, type AssessmentResult } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface MemoryItem {
  id: string
  name: string
  image: string
  category: string
}

interface PairedAssociate {
  face: string
  name: string
  id: string
}

export default function MemoryAssessmentPage() {
  const router = useRouter()
  const [currentTest, setCurrentTest] = useState<"shopping" | "pairs" | "complete">("shopping")
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  // Shopping List Test State
  const [shoppingItems, setShoppingItems] = useState<MemoryItem[]>([])
  const [studyPhase, setStudyPhase] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [shoppingScore, setShoppingScore] = useState(0)

  // Paired Associates Test State
  const [pairedAssociates, setPairedAssociates] = useState<PairedAssociate[]>([])
  const [currentPair, setCurrentPair] = useState(0)
  const [showingFace, setShowingFace] = useState(true)
  const [pairsScore, setPairsScore] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])

  const [testComplete, setTestComplete] = useState(false)

  const speak = (text: string) => {
    if (voiceEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  // Initialize shopping list items
  const initializeShoppingTest = useCallback(() => {
    const items: MemoryItem[] = [
      { id: "1", name: "Apples", image: "/red-apples.png", category: "fruit" },
      { id: "2", name: "Bread", image: "/loaf-of-bread.png", category: "bakery" },
      { id: "3", name: "Milk", image: "/milk-carton.png", category: "dairy" },
      { id: "4", name: "Bananas", image: "/yellow-bananas.jpg", category: "fruit" },
      { id: "5", name: "Cheese", image: "/cheese-block.png", category: "dairy" },
      { id: "6", name: "Tomatoes", image: "/red-tomatoes.jpg", category: "vegetable" },
      { id: "7", name: "Chicken", image: "/raw-chicken.png", category: "meat" },
      { id: "8", name: "Rice", image: "/bag-of-rice.png", category: "grain" },
    ]

    // Select 6 random items for the test
    const shuffled = items.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 6)
    setShoppingItems(selected)

    speak("Remember these items from your shopping list. You'll need to select them later.")
  }, [voiceEnabled])

  // Initialize paired associates test
  const initializePairsTest = useCallback(() => {
    const pairs: PairedAssociate[] = [
      { id: "1", face: "/elderly-woman-smiling.png", name: "Margaret" },
      { id: "2", face: "/middle-aged-man-glasses.jpg", name: "Robert" },
      { id: "3", face: "/young-woman-brown-hair.jpg", name: "Sarah" },
      { id: "4", face: "/elderly-man-beard.jpg", name: "William" },
      { id: "5", face: "/middle-aged-woman-blonde.jpg", name: "Jennifer" },
    ]
    setPairedAssociates(pairs)
    speak("Now you'll learn to associate faces with names. Pay close attention.")
  }, [voiceEnabled])

  useEffect(() => {
    initializeShoppingTest()
  }, [initializeShoppingTest])

  const startPairsTest = () => {
    setCurrentTest("pairs")
    initializePairsTest()
    setCurrentPair(0)
    setShowingFace(true)
  }

  const handleShoppingItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter((id) => id !== itemId))
    } else {
      setSelectedItems([...selectedItems, itemId])
    }
  }

  const submitShoppingTest = () => {
    const correctItems = shoppingItems.map((item) => item.id)
    const correctSelections = selectedItems.filter((id) => correctItems.includes(id))
    const incorrectSelections = selectedItems.filter((id) => !correctItems.includes(id))

    const score = Math.max(0, correctSelections.length - incorrectSelections.length)
    setShoppingScore(score)

    speak(`Shopping test complete. You scored ${score} out of ${shoppingItems.length}.`)
    startPairsTest()
  }

  const handleNameInput = (name: string) => {
    const newAnswers = [...userAnswers]
    newAnswers[currentPair] = name
    setUserAnswers(newAnswers)

    if (currentPair < pairedAssociates.length - 1) {
      setCurrentPair(currentPair + 1)
      setShowingFace(true)
    } else {
      // Calculate pairs score
      let correct = 0
      pairedAssociates.forEach((pair, index) => {
        if (newAnswers[index]?.toLowerCase().trim() === pair.name.toLowerCase()) {
          correct++
        }
      })
      setPairsScore(correct)
      completeAssessment(correct)
    }
  }

  const completeAssessment = (finalPairsScore: number) => {
    const userId = localStorage.getItem("currentUserId")
    if (!userId) return

    const totalScore = shoppingScore + finalPairsScore
    const maxScore = shoppingItems.length + pairedAssociates.length
    const duration = Date.now() - startTime

    const result: AssessmentResult = {
      id: `memory_${Date.now()}`,
      userId,
      type: "memory",
      score: totalScore,
      maxScore,
      duration,
      details: {
        shoppingScore,
        pairsScore: finalPairsScore,
        shoppingItems: shoppingItems.length,
        pairsItems: pairedAssociates.length,
      },
      completedAt: new Date().toISOString(),
    }

    storage.saveAssessmentResult(result)
    setTestComplete(true)
    speak("Memory assessment complete. Great job!")
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
              <CardTitle className="text-2xl">Memory Assessment Complete!</CardTitle>
              <CardDescription>Your results have been saved to your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{shoppingScore}</div>
                  <div className="text-sm text-muted-foreground">Shopping List</div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">{pairsScore}</div>
                  <div className="text-sm text-muted-foreground">Name-Face Pairs</div>
                </div>
              </div>
              <div className="space-y-4">
                <Button className="w-full button-large" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
                <Button variant="outline" className="w-full button-large bg-transparent" asChild>
                  <Link href="/assessment/attention">Next: Attention Test</Link>
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
                <Brain className="w-6 h-6 text-primary" />
                Memory Assessment
              </h1>
              <p className="text-muted-foreground">Test your memory with shopping lists and face-name associations</p>
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
            <Badge variant={currentTest === "shopping" ? "default" : "secondary"}>Shopping List</Badge>
            <Badge variant={currentTest === "pairs" ? "default" : "secondary"}>Face-Name Pairs</Badge>
            <div className="flex items-center gap-2 ml-auto">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}m {Math.floor(((Date.now() - startTime) / 1000) % 60)}
                s
              </span>
            </div>
          </div>
        </div>

        {/* Shopping List Test */}
        {currentTest === "shopping" && (
          <Card>
            <CardHeader>
              <CardTitle>Virtual Shopping List</CardTitle>
              <CardDescription>
                {studyPhase
                  ? "Study these items carefully. You'll need to remember them in the next step."
                  : "Select the items that were on your shopping list"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studyPhase ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {shoppingItems.map((item) => (
                      <div key={item.id} className="text-center p-4 border rounded-lg">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-20 h-20 mx-auto mb-2 rounded-lg object-cover"
                        />
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setStudyPhase(false)
                        speak("Now select the items that were on your shopping list")
                      }}
                      className="button-large"
                    >
                      I've Studied the List
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Mix original items with distractors */}
                    {[
                      ...shoppingItems,
                      { id: "d1", name: "Oranges", image: "/vibrant-oranges.png", category: "fruit" },
                      { id: "d2", name: "Pasta", image: "/colorful-pasta-arrangement.png", category: "grain" },
                      { id: "d3", name: "Yogurt", image: "/creamy-yogurt-bowl.png", category: "dairy" },
                      { id: "d4", name: "Carrots", image: "/bunch-of-carrots.png", category: "vegetable" },
                    ]
                      .sort(() => 0.5 - Math.random())
                      .map((item) => (
                        <div
                          key={item.id}
                          className={`text-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedItems.includes(item.id)
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleShoppingItemSelect(item.id)}
                        >
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
                          />
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          {selectedItems.includes(item.id) && (
                            <CheckCircle className="w-5 h-5 text-primary mx-auto mt-2" />
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="text-center">
                    <Button onClick={submitShoppingTest} className="button-large" disabled={selectedItems.length === 0}>
                      Submit Shopping List ({selectedItems.length} selected)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Paired Associates Test */}
        {currentTest === "pairs" && (
          <Card>
            <CardHeader>
              <CardTitle>Face-Name Association</CardTitle>
              <CardDescription>
                {showingFace
                  ? `Learn this person's name: ${pairedAssociates[currentPair]?.name}`
                  : "What was this person's name?"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="w-40 h-40 mx-auto">
                  <img
                    src={pairedAssociates[currentPair]?.face || "/placeholder.svg"}
                    alt="Person to remember"
                    className="w-full h-full rounded-full object-cover border-4 border-primary/20"
                  />
                </div>

                {showingFace ? (
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">{pairedAssociates[currentPair]?.name}</h3>
                    <Button
                      onClick={() => {
                        setShowingFace(false)
                        speak("What was this person's name?")
                      }}
                      className="button-large"
                    >
                      I Remember This Name
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md mx-auto">
                      {/* Show current name plus distractors */}
                      {[pairedAssociates[currentPair]?.name, "Michael", "Patricia", "David", "Linda", "James"]
                        .filter((name, index, arr) => arr.indexOf(name) === index)
                        .slice(0, 6)
                        .sort(() => 0.5 - Math.random())
                        .map((name) => (
                          <Button
                            key={name}
                            variant="outline"
                            onClick={() => handleNameInput(name)}
                            className="button-large bg-transparent"
                          >
                            {name}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <Progress value={((currentPair + 1) / pairedAssociates.length) * 100} className="w-64 h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Person {currentPair + 1} of {pairedAssociates.length}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
