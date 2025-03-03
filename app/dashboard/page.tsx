// Dashboard.tsx
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

export default function Dashboard() {
  const [selectedResource, setSelectedResource] = React.useState<{
    resource: Resource;
  } | null>(null)
  const [view, setView] = React.useState<"resources" | "table">("resources")
  const [resources, setResources] = React.useState<Resource[]>([])
  const [watchedVideos, setWatchedVideos] = React.useState<Set<string>>(new Set())

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  React.useEffect(() => {
    const storedWatched = localStorage.getItem("watchedVideos")
    if (storedWatched) {
      setWatchedVideos(new Set(JSON.parse(storedWatched)))
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem("watchedVideos", JSON.stringify([...watchedVideos]))
  }, [watchedVideos])

  React.useEffect(() => {
    async function fetchResources() {
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
          "--sidebar-width": `${localStorage.getItem("sidebarWidth") || 350}px`, // Use stored width or default
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        onResourceSelect={handleResourceSelect}
        selectedResourceId={selectedResource?.resource.id}
        onViewChange={handleViewChange}
      />
      <SidebarInset className="flex-1">
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">All Resources</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {view === "resources" 
                    ? (selectedResource
                        ? selectedResource.resource.videoTitle || selectedResource.resource.Title
                        : "Directory")
                    : "Table View"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {view === "resources" ? (
            selectedResource ? (
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
                />
                {selectedResource.resource.authorName && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    By: <a href={selectedResource.resource.authorUrl} target="_blank" rel="noopener noreferrer" className="underline">{selectedResource.resource.authorName}</a>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Select a resource to view its video
              </div>
            )
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 hover:bg-gray-100">
                    <TableHead className="font-semibold">Thumbnail</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Description</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Link</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Author</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Date</TableHead>
                    <TableHead className="font-semibold">Watched</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow 
                      key={resource.id}
                      className={cn(
                        "cursor-pointer",
                        selectedResource?.resource.id === resource.id && "bg-gray-700 text-white hover:bg-gray-600",
                        watchedVideos.has(resource.id) && "bg-pink-100 hover:bg-pink-200"
                      )}
                      onClick={() => handleResourceSelect(resource)}
                    >
                      <TableCell>
                        {resource.thumbnailUrl ? (
                          <img 
                            src={resource.thumbnailUrl} 
                            alt="Thumbnail" 
                            className="w-16 h-9 object-cover rounded"
                            width={resource.thumbnailWidth}
                            height={resource.thumbnailHeight}
                          />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{resource.videoTitle || resource.Title}</TableCell>
                      <TableCell className="hidden md:table-cell">{resource.Description}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <a href={resource.Link} target="_blank" rel="noopener noreferrer" className="underline">{resource.Link}</a>
                      </TableCell>
                      <TableCell>{resource.isPlaylist ? "Playlist" : "Video"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {resource.authorName ? (
                          <a href={resource.authorUrl} target="_blank" rel="noopener noreferrer" className="underline">{resource.authorName}</a>
                        ) : "Unknown"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                            watchedVideos.has(resource.id) && "bg-green-100 text-green-700"
                          )}
                        >
                          {watchedVideos.has(resource.id) ? "Watched" : "Mark Watched"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}