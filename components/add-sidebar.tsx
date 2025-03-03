// add-sidebar.tsx
"use client"

import * as React from "react"
import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react"
import { getData } from "@/app/actions/route"
import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" // Assuming you have this utility for classNames

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onResourceSelect?: (resource: Resource) => void;
  selectedResourceId?: string | null; // New prop to track selected resource
}

async function fetchYouTubeTitle(url: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    const data = await response.json()
    return data.title || "Untitled Video"
  } catch (error) {
    console.error("Error fetching YouTube title:", error)
    return "Untitled Video"
  }
}

function extractPlaylistId(url: string): string | null {
  const playlistRegex = /[?&]list=([^#\&\?]+)/
  const match = url.match(playlistRegex)
  console.log(`Extracting playlist ID from ${url}:`, match ? match[1] : null)
  return match ? match[1] : null
}

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

const navMain = [
  { title: "Resources", url: "#", icon: Inbox, isActive: true },
  { title: "Drafts", url: "#", icon: File, isActive: false },
  { title: "Sent", url: "#", icon: Send, isActive: false },
  { title: "Junk", url: "#", icon: ArchiveX, isActive: false },
  { title: "Trash", url: "#", icon: Trash2, isActive: false },
]

export function AppSidebar({ 
  onResourceSelect, 
  selectedResourceId, 
  ...props 
}: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState(navMain[0])
  const [resources, setResources] = React.useState<Resource[]>([])
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedPlaylistLink, setSelectedPlaylistLink] = React.useState<string | null>(null)
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    async function fetchResourcesAndDetails() {
      const response = await getData()
      if (response.success) {
        const enhancedResources = await Promise.all(
          response.data.map(async (resource) => {
            const playlistId = extractPlaylistId(resource.Link)
            const videoTitle = await fetchYouTubeTitle(resource.Link)
            
            if (playlistId) {
              return {
                ...resource,
                isPlaylist: true,
                videoTitle,
                playlistId,
              }
            }
            return {
              ...resource,
              isPlaylist: false,
              videoTitle,
            }
          })
        )
        setResources(enhancedResources)
      }
    }
    fetchResourcesAndDetails()
  }, [])

  const handlePlaylistClick = (resource: Resource) => {
    if (resource.isPlaylist) {
      setSelectedPlaylistLink(resource.Link)
      setOpenDialog(true)
    }
    onResourceSelect?.(resource)
  }

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Resource Dir</span>
                    <span className="truncate text-xs">Directory</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{ children: item.title, hidden: false }}
                      onClick={() => {
                        setActiveItem(item)
                        setOpen(true)
                      }}
                      isActive={activeItem.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem.title}
            </div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Filter</span>
              <Switch className="shadow-none" />
            </Label>
          </div>
          <SidebarInput placeholder="Search resources..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {resources.map((resource) => (
                resource.isPlaylist ? (
                  <Accordion type="single" collapsible key={resource.id}>
                    <AccordionItem value={resource.id}>
                      <AccordionTrigger 
                        className={cn(
                          "flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          selectedResourceId === resource.id && "bg-gray-700 text-white"
                        )}
                        onClick={() => handlePlaylistClick(resource)}
                      >
                        <div className="flex w-full items-center gap-2 flex-wrap">
                          <span className="break-words max-w-[200px]">
                            {resource.videoTitle || resource.Title}
                          </span>
                          <span className="ml-auto text-xs shrink-0">
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="break-words max-w-[260px] text-xs">
                          {resource.Description}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-4 py-2 text-sm break-words max-w-[260px]">
                          Link: {resource.Link}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <a
                    href="#"
                    key={resource.id}
                    className={cn(
                      "flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      selectedResourceId === resource.id && "bg-gray-700 text-white"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      handlePlaylistClick(resource)
                    }}
                  >
                    <div className="flex w-full items-center gap-2 flex-wrap">
                      <span className="break-words max-w-[200px]">
                        {resource.videoTitle || resource.Title}
                      </span>
                      <span className="ml-auto text-xs shrink-0">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="break-words max-w-[260px] text-xs">
                      {resource.Description}
                    </span>
                    <span className="break-words max-w-[260px] text-xs">
                      Link: {resource.Link}
                    </span>
                  </a>
                )
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Watch Full Playlist</DialogTitle>
            <DialogDescription>
              This is a YouTube playlist. For the best experience, we suggest watching the full playlist on YouTube.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Stay Here
            </Button>
            <Button asChild>
              <a href={selectedPlaylistLink || "#"} target="_blank" rel="noopener noreferrer">
                Go to YouTube
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}