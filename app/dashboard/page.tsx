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
import React from "react"

interface Resource {
  id: string;
  Title: string;
  Description: string;
  Link: string;
  createdAt: string;
  videoTitle?: string;
  isPlaylist?: boolean;
  playlistId?: string;
}

export default function Dashboard() {
  const [selectedResource, setSelectedResource] = React.useState<{
    resource: Resource;
  } | null>(null)

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResource({ resource })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar 
        onResourceSelect={handleResourceSelect}
        selectedResourceId={selectedResource?.resource.id}
      />
      <SidebarInset>
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
                  {selectedResource
                    ? selectedResource.resource.videoTitle || selectedResource.resource.Title
                    : "Directory"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {selectedResource ? (
            <div className="aspect-video w-full">
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
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a resource to view its video
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}