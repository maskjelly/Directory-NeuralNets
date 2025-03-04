"use client"

import { useState } from "react"
import { onSubmit } from "../actions/route"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Toaster, toast } from "sonner"
import { Link, ArrowLeft, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AddData() {
  const [title, setTitle] = useState<string>("")
  const [link, setLink] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  return (
    <div className="min-h-screen w-full p-4 md:p-8 relative">
      <div className="gradient-background" />

      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="mb-6 text-foreground hover:text-primary" asChild>
          <a href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </a>
        </Button>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">Add New Resource</CardTitle>
            <CardDescription className="text-muted-foreground">
              Add a new video or playlist to your resource directory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Enter resource title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50 border-foreground/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link" className="text-foreground">
                YouTube Link
              </Label>
              <div className="relative">
                <Input
                  id="link"
                  placeholder="Paste YouTube video or playlist URL"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="bg-background/50 border-foreground/10 pl-9"
                />
                <Link className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter a description of the resource"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-background/50 border-foreground/10"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn("w-full", isSubmitting && "opacity-50 cursor-not-allowed")}
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
          </CardFooter>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}