"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getData } from "@/app/actions/route"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookmarkCheck, Bookmark, ExternalLink, Grid, List } from "lucide-react"
import Link from "next/link"

interface Resource {
  id: string
  Title: string
  Description: string
  Link: string
  createdAt: string
  videoTitle?: string
  isPlaylist?: boolean
  playlistId?: string
  thumbnailUrl?: string
  thumbnailWidth?: number
  thumbnailHeight?: number
  authorName?: string
  authorUrl?: string
  uploadDate?: string
}

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

function extractPlaylistId(url: string): string | null {
  const playlistRegex = /[?&]list=([^#&?]+)/
  const match = url.match(playlistRegex)
  return match ? match[1] : null
}

export default function Dashboard() {
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("list")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWatched = localStorage.getItem("watchedVideos")
      if (storedWatched) setWatchedVideos(new Set(JSON.parse(storedWatched)))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("watchedVideos", JSON.stringify([...watchedVideos]))
    }
  }, [watchedVideos])

  useEffect(() => {
    async function fetchResources() {
      setLoading(true)
      try {
        const response = await getData()
        if (response.success) {
          const enhancedResources = await Promise.all(
            response.data.map(async (resource) => {
              const playlistId = extractPlaylistId(resource.Link)
              // Fetch YouTube details for each resource
              try {
                const response = await fetch(
                  `https://www.youtube.com/oembed?url=${encodeURIComponent(resource.Link)}&format=json`,
                )
                const data = await response.json()
                return {
                  ...resource,
                  isPlaylist: !!playlistId,
                  playlistId: playlistId || undefined,
                  videoTitle: data.title || resource.Title,
                  thumbnailUrl: data.thumbnail_url,
                  thumbnailWidth: data.thumbnail_width,
                  thumbnailHeight: data.thumbnail_height,
                  authorName: data.author_name,
                  authorUrl: data.author_url,
                }
              } catch (error) {
                console.error("Error fetching YouTube details:", error)
                return {
                  ...resource,
                  isPlaylist: !!playlistId,
                  playlistId: playlistId || undefined,
                }
              }
            }),
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

  const toggleWatched = (resourceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

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

  const filteredResources = resources.filter(
    (resource) =>
      resource.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.videoTitle && resource.videoTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      resource.Description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Resource Directory</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search resources..."
              className="px-3 py-2 border rounded-md w-full sm:w-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView(view === "grid" ? "list" : "grid")}
              className="hidden sm:flex"
            >
              {view === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button asChild variant="default" size="sm">
              <Link href="/add">Add Resource</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p>No resources found. Try adjusting your search.</p>
          </div>
        ) : (
          <>
            {selectedResource ? (
              <div className="mb-8">
                <div className="bg-card rounded-md overflow-hidden border">
                  <div className="aspect-video w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={
                        selectedResource.isPlaylist
                          ? `https://www.youtube.com/embed/videoseries?list=${selectedResource.playlistId}`
                          : `https://www.youtube.com/embed/${getYouTubeId(selectedResource.Link)}`
                      }
                      title={selectedResource.videoTitle || selectedResource.Title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">{selectedResource.videoTitle || selectedResource.Title}</h2>
                      <Badge variant={selectedResource.isPlaylist ? "secondary" : "outline"}>
                        {selectedResource.isPlaylist ? "Playlist" : "Video"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4">{selectedResource.Description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleWatched(selectedResource.id)}>
                        {watchedVideos.has(selectedResource.id) ? (
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
                      <Button asChild variant="outline" size="sm">
                        <a href={selectedResource.Link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in YouTube
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedResource(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {view === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2 border-b">Title</th>
                      <th className="text-left p-2 border-b hidden md:table-cell">Description</th>
                      <th className="text-left p-2 border-b hidden lg:table-cell">Type</th>
                      <th className="text-left p-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResources.map((resource) => (
                      <tr
                        key={resource.id}
                        className={`hover:bg-muted/30 cursor-pointer ${watchedVideos.has(resource.id) ? "bg-green-50 dark:bg-green-900/10" : ""}`}
                        onClick={() => setSelectedResource(resource)}
                      >
                        <td className="p-2 border-b">
                          <div className="flex items-center gap-2">
                            {resource.thumbnailUrl ? (
                              <img
                                src={resource.thumbnailUrl || "/placeholder.svg"}
                                alt=""
                                className="w-12 h-8 object-cover rounded hidden sm:block"
                              />
                            ) : null}
                            <span className="font-medium">{resource.videoTitle || resource.Title}</span>
                          </div>
                        </td>
                        <td className="p-2 border-b hidden md:table-cell">
                          <div className="truncate max-w-xs">{resource.Description}</div>
                        </td>
                        <td className="p-2 border-b hidden lg:table-cell">
                          <Badge variant={resource.isPlaylist ? "secondary" : "outline"}>
                            {resource.isPlaylist ? "Playlist" : "Video"}
                          </Badge>
                        </td>
                        <td className="p-2 border-b whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => toggleWatched(resource.id, e)}
                              className="h-8 px-2"
                            >
                              {watchedVideos.has(resource.id) ? (
                                <BookmarkCheck className="h-4 w-4" />
                              ) : (
                                <Bookmark className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              <a href={resource.Link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredResources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`border rounded-md overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      watchedVideos.has(resource.id)
                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30"
                        : ""
                    }`}
                    onClick={() => setSelectedResource(resource)}
                  >
                    {resource.thumbnailUrl ? (
                      <img
                        src={resource.thumbnailUrl || "/placeholder.svg"}
                        alt=""
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No thumbnail</span>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium line-clamp-2">{resource.videoTitle || resource.Title}</h3>
                        <Badge variant={resource.isPlaylist ? "secondary" : "outline"} className="shrink-0">
                          {resource.isPlaylist ? "Playlist" : "Video"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resource.Description}</p>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => toggleWatched(resource.id, e)}
                          className="h-8 px-2"
                        >
                          {watchedVideos.has(resource.id) ? (
                            <BookmarkCheck className="h-4 w-4" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <a href={resource.Link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

