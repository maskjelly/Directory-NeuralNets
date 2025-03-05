"use client"

import { useState, useEffect } from "react"
import { onSubmit } from "../actions/route"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Toaster, toast } from "sonner"
import { ArrowLeft, Plus, Lock } from 'lucide-react'
import Link from "next/link"

export default function AddData() {
  const [title, setTitle] = useState<string>("")
  const [link, setLink] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Check if user has a stored auth token
  useEffect(() => {
    const authToken = localStorage.getItem("resource-auth-token")
    if (authToken) {
      // Simple validation - in a real app, you'd verify this token with the server
      setIsAuthenticated(true)
    }
  }, [])

  const handleAuthenticate = () => {
    setIsAuthenticating(true)
    
    // Simple password check - in a real app, this would be a server-side check
    // The correct password is "admin123" for this demo
    setTimeout(() => {
      if (password === "admin123") {
        localStorage.setItem("resource-auth-token", Date.now().toString())
        setIsAuthenticated(true)
        toast.success("Authentication successful")
      } else {
        toast.error("Invalid password")
      }
      setIsAuthenticating(false)
    }, 800)
  }

  const handleSubmit = async () => {
    if (!title || !link || !description) {
      toast.error("Missing Fields", {
        description: "Please fill in all fields before submitting."
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await onSubmit(title, description, link)

      if (response.success) {
        toast.success("Success!", {
          description: response.message
        })
        // Clear form
        setTitle("")
        setLink("")
        setDescription("")
      } else {
        toast.error("Error", {
          description: response.message
        })
      }
    } catch (error) {
      toast.error("Error", {
        description: "Something went wrong. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Resources
            </Link>
          </Button>
        </div>

        <div className="border rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Authentication Required
            </h1>
            <p className="text-muted-foreground">
              Please enter the password to access the resource management area
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthenticate()
                  }
                }}
              />
            </div>
            
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating || !password}
              className="w-full"
            >
              {isAuthenticating ? "Authenticating..." : "Authenticate"}
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Add New Resource</h1>
          <p className="text-muted-foreground">
            Add a new video or playlist to your resource directory
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Enter resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">
              YouTube Link
            </Label>
            <div className="relative">
              <Input
                id="link"
                placeholder="Paste YouTube video or playlist URL"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="pl-9"
              />
              <div className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter a description of the resource"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              "Adding Resource..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </>
            )}
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
