"use client"

import { AppSidebar } from "@/components/add-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import React from "react"
import { getData } from "@/app/actions/route"
import { Card, CardContent } from "@/components/ui/card"
import { BookmarkCheck, Bookmark, ExternalLink } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

interface Resource {
  id: string;
  Title: string;
  Description: string;
  Link: string;
  createdAt: string;
  videoTitle?: string;
  isPlaylist?: boolean;
  playlistId?: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  authorName?: string;
  authorUrl?: string;
  uploadDate?: string;
  html?: string;
}

async function fetchYouTubeDetails(url: string): Promise<{
  videoTitle: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  authorName?: string;
  authorUrl?: string;
  uploadDate?: string;
  html?: string;
}> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    const data = await response.json()
    return {
      videoTitle: data.title || "Untitled Video",
      thumbnailUrl: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      authorName: data.author_name,
      authorUrl: data.author_url,
      uploadDate: data.upload_date,
      html: data.html,
    }
  } catch (error) {
    console.error("Error fetching YouTube details:", error)
    return {
      videoTitle: "Untitled Video",
    }
  }
}

function extractPlaylistId(url: string): string | null {
  const playlistRegex = /[?&]list=([^#\&\?]+)/
  const match = url.match(playlistRegex)
  return match ? match[1] : null
}

export default function Dashboard() {
  const [selectedResource, setSelectedResource] = React.useState<{
    resource: Resource;
  } | null>(null)
  const [view, setView] = React.useState<"resources" | "table">("resources")
  const [resources, setResources] = React.useState<Resource[]>([])
  const [watchedVideos, setWatchedVideos] = React.useState<Set<string>>(new Set())
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(350)
  const [loading, setLoading] = React.useState(true)

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWidth = localStorage.getItem("sidebarWidth")
      const storedWatched = localStorage.getItem("watchedVideos")
      if (storedWidth) setSidebarWidth(parseInt(storedWidth, 10))
      if (storedWatched) setWatchedVideos(new Set(JSON.parse(storedWatched)))
    }
  }, [])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("watchedVideos", JSON.stringify([...watchedVideos]))
    }
  }, [watchedVideos])

  React.useEffect(() => {
    async function fetchResources() {
      setLoading(true)
      try {
        const response = await getData()
        if (response.success) {
          const enhancedResources = await Promise.all(
            response.data.map(async (resource) => {
              const playlistId = extractPlaylistId(resource.Link)
              const ytDetails = await fetchYouTubeDetails(resource.Link)
              return {
                ...resource,
                isPlaylist: !!playlistId,
                playlistId: playlistId || undefined,
                videoTitle: ytDetails.videoTitle,
                thumbnailUrl: ytDetails.thumbnailUrl,
                thumbnailWidth: ytDetails.thumbnailWidth,
                thumbnailHeight: ytDetails.thumbnailHeight,
                authorName: ytDetails.authorName,
                authorUrl: ytDetails.authorUrl,
                uploadDate: ytDetails.uploadDate || resource.createdAt,
                html: ytDetails.html,
              }
            })
          )
          setResources(enhancedResources)
        }
      } catch (error) {
        console.error("Error fetching resources:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchResources()
  }, [])

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource({ resource })
  }

  const handleViewChange = (newView: "resources" | "table") => {
    setView(newView)
    if (newView === "resources") {
      setSelectedResource(null)
    }
  }

  const toggleWatched = (resourceId: string) => {
    setWatchedVideos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        onResourceSelect={handleResourceSelect}
        selectedResourceId={selectedResource?.resource.id}
        onViewChange={handleViewChange}
      />
      <SidebarInset className="flex-1">
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#" className="text-foreground">All Resources</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground">
                  {view === "resources" 
                    ? (selectedResource
                        ? selectedResource.resource.videoTitle || selectedResource.resource.Title
                        : "Directory")
                    : "Table View"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {view === "resources" ? (
            selectedResource ? (
              <Card className="overflow-hidden border-foreground/10">
                <CardContent className="p-0">
                  <div className="aspect-video w-full max-w-4xl mx-auto">
                    <iframe
                      width="100%"
                      height="100%"
                      src={
                        selectedResource.resource.isPlaylist
                          ? `https://www.youtube.com/embed/videoseries?list=${selectedResource.resource.playlistId}`
                          : `https://www.youtube.com/embed/${getYouTubeId(selectedResource.resource.Link)}`
                      }
                      title={selectedResource.resource.videoTitle || selectedResource.resource.Title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="rounded-t-lg"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-foreground">{selectedResource.resource.videoTitle || selectedResource.resource.Title}</h2>
                      <Badge variant={selectedResource.resource.isPlaylist ? "secondary" : "outline"} className="text-foreground border-foreground/20">
                        {selectedResource.resource.isPlaylist ? "Playlist" : "Video"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{selectedResource.resource.Description}</p>
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedResource.resource.authorName && (
                          <p className="text-sm text-muted-foreground">
                            By: <a href={selectedResource.resource.authorUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">{selectedResource.resource.authorName}</a>
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Added: {new Date(selectedResource.resource.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWatched(selectedResource.resource.id)}
                          className={cn(
                            "rounded-full border-foreground/20 text-foreground",
                            watchedVideos.has(selectedResource.resource.id) && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}
                        >
                          {watchedVideos.has(selectedResource.resource.id) ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 mr-2" />
                              Watched
                            </>
                          ) : (
                            <>
                              <Bookmark className="h-4 w-4 mr-2" />
                              Mark Watched
                            </>
                          )}
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-full border-foreground/20 text-foreground">
                          <a href={selectedResource.resource.Link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in YouTube
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2 text-foreground">Resource Directory</h2>
                  <p>Select a resource from the sidebar to view its content</p>
                </div>
              </div>
            )
          ) : (
            <div className="w-full overflow-x-auto">
              {resources.length > 0 ? (
                <div className="rounded-lg border border-foreground/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50">
                        <TableHead className="font-semibold text-foreground">Thumbnail</TableHead>
                        <TableHead className="font-semibold text-foreground">Title</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell text-foreground">Description</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell text-foreground">Link</TableHead>
                        <TableHead className="font-semibold text-foreground">Type</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell text-foreground">Author</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell text-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Watched</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow 
                          key={resource.id}
                          className={cn(
                            "cursor-pointer",
                            selectedResource?.resource.id === resource.id && "bg-purple-100 dark:bg-purple-900/30 text-foreground",
                            watchedVideos.has(resource.id) && "bg-green-100 dark:bg-green-900/30 text-foreground"
                          )}
                          onClick={() => handleResourceSelect(resource)}
                        >
                          <TableCell>
                            {resource.thumbnailUrl ? (
                              <img 
                                src={resource.thumbnailUrl || "/placeholder.svg"} 
                                alt="Thumbnail" 
                                className="w-16 h-9 object-cover rounded-lg"
                                width={resource.thumbnailWidth}
                                height={resource.thumbnailHeight}
                              />
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{resource.videoTitle || resource.Title}</TableCell>
                          <TableCell className="hidden md:table-cell text-foreground">{resource.Description}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <a href={resource.Link} target="_blank" rel="noopener noreferrer" className="underline text-primary">{resource.Link}</a>
                          </TableCell>
                          <TableCell>
                            <Badge variant={resource.isPlaylist ? "secondary" : "outline"} className="text-foreground border-foreground/20">
                              {resource.isPlaylist ? "Playlist" : "Video"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {resource.authorName ? (
                              <a href={resource.authorUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">{resource.authorName}</a>
                            ) : "Unknown"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-foreground">
                            {new Date(resource.uploadDate || resource.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleWatched(resource.id)
                              }}
                              className={cn(
                                "rounded-full border-foreground/20 text-foreground",
                                watchedVideos.has(resource.id) && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              )}
                            >
                              {watchedVideos.has(resource.id) ? (
                                <>
                                  <BookmarkCheck className="h-4 w-4 mr-2" />
                                  Watched
                                </>
                              ) : (
                                <>
                                  <Bookmark className="h-4 w-4 mr-2" />
                                  Mark
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-[calc(100vh-8rem)] items-center justify-center text-muted-foreground">
                  {loading ? (
                    <p>Loading resources...</p>
                  ) : (
                    <p>No resources available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
