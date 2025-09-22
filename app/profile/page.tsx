"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Shield,
  ArrowLeft,
  Edit3,
  Save,
  X,
  UserCheck,
  Activity,
  Brain,
} from "lucide-react"
import { storage, type UserProfile } from "@/lib/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem("currentUserId")
    if (userId) {
      const userProfile = storage.getUserProfile(userId)
      setProfile(userProfile)
      setEditedProfile(userProfile)
    }
    setLoading(false)
  }, [])

  const handleSave = () => {
    if (editedProfile) {
      const updatedProfile = {
        ...editedProfile,
        updatedAt: new Date().toISOString(),
      }
      storage.saveUserProfile(updatedProfile)
      setProfile(updatedProfile)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 py-8 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <Card>
            <CardContent className="py-12">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-6">Please complete the onboarding process first.</p>
              <Button asChild>
                <Link href="/onboarding">Complete Onboarding</Link>
              </Button>
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
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                My Profile
              </h1>
              <p className="text-muted-foreground mt-2">Manage your personal information and health data</p>
            </div>

            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="button-large">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="button-large">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" className="button-large bg-transparent">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedProfile?.name || ""}
                        onChange={(e) => setEditedProfile((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">{profile.name}</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="age" className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Age
                    </Label>
                    {isEditing ? (
                      <Input
                        id="age"
                        type="number"
                        value={editedProfile?.age || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) => (prev ? { ...prev, age: Number.parseInt(e.target.value) } : null))
                        }
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">{profile.age} years</div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile?.email || ""}
                        onChange={(e) => setEditedProfile((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">
                        {profile.email || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedProfile?.phone || ""}
                        onChange={(e) => setEditedProfile((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">
                        {profile.phone || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="animate-in slide-in-from-bottom-4 duration-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Emergency Contact
                </CardTitle>
                <CardDescription>Person to contact in case of emergency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergency-name" className="mb-2 block">
                      Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergency-name"
                        value={editedProfile?.emergencyContact?.name || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  emergencyContact: { ...prev.emergencyContact!, name: e.target.value },
                                }
                              : null,
                          )
                        }
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">
                        {profile.emergencyContact?.name || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergency-phone" className="mb-2 block">
                      Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergency-phone"
                        value={editedProfile?.emergencyContact?.phone || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  emergencyContact: { ...prev.emergencyContact!, phone: e.target.value },
                                }
                              : null,
                          )
                        }
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">
                        {profile.emergencyContact?.phone || "Not provided"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emergency-relationship" className="mb-2 block">
                      Relationship
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergency-relationship"
                        value={editedProfile?.emergencyContact?.relationship || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  emergencyContact: { ...prev.emergencyContact!, relationship: e.target.value },
                                }
                              : null,
                          )
                        }
                        className="text-large"
                      />
                    ) : (
                      <div className="text-large font-medium p-3 bg-muted/50 rounded-md">
                        {profile.emergencyContact?.relationship || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="animate-in slide-in-from-bottom-4 duration-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Medical History
                </CardTitle>
                <CardDescription>Relevant medical conditions and medications</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedProfile?.medicalHistory?.join(", ") || ""}
                    onChange={(e) =>
                      setEditedProfile((prev) =>
                        prev
                          ? {
                              ...prev,
                              medicalHistory: e.target.value.split(",").map((item) => item.trim()),
                            }
                          : null,
                      )
                    }
                    placeholder="Enter medical conditions, medications, or other relevant health information..."
                    className="min-h-24 text-large"
                  />
                ) : (
                  <div className="space-y-2">
                    {profile.medicalHistory && profile.medicalHistory.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.medicalHistory.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic">No medical history provided</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cognitive Baseline */}
            <Card className="animate-in slide-in-from-right-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Cognitive Baseline
                </CardTitle>
                <CardDescription>Your initial cognitive assessment scores</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.cognitiveBaseline ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory</span>
                      <Badge variant="outline">{profile.cognitiveBaseline.memoryScore}/100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Attention</span>
                      <Badge variant="outline">{profile.cognitiveBaseline.attentionScore}/100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Visuospatial</span>
                      <Badge variant="outline">{profile.cognitiveBaseline.visuospatialScore}/100</Badge>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      Established: {new Date(profile.cognitiveBaseline.establishedAt).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Complete assessments to establish baseline</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="animate-in slide-in-from-right-4 duration-700">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
