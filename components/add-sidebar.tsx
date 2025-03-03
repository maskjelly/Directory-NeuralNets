// add-sidebar.tsx
"use client";

import * as React from "react";
import { Command, Table as TableIcon } from "lucide-react";
import { getData } from "@/app/actions/route";
import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onResourceSelect?: (resource: Resource) => void;
  selectedResourceId?: string | null;
  onViewChange?: (view: "resources" | "table") => void;
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
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        url
      )}&format=json`
    );
    const data = await response.json();
    return {
      videoTitle: data.title || "Untitled Video",
      thumbnailUrl: data.thumbnail_url,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      authorName: data.author_name,
      authorUrl: data.author_url,
      uploadDate: data.upload_date,
      html: data.html,
    };
  } catch (error) {
    console.error("Error fetching YouTube details:", error);
    return {
      videoTitle: "Untitled Video",
    };
  }
}

function extractPlaylistId(url: string): string | null {
  const playlistRegex = /[?&]list=([^#\&\?]+)/;
  const match = url.match(playlistRegex);
  return match ? match[1] : null;
}

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

const navMain = [
  { title: "All Resources", url: "#", icon: Command, isActive: true },
  { title: "Table", url: "#", icon: TableIcon, isActive: false },
];

export function AppSidebar({
  onResourceSelect,
  selectedResourceId,
  onViewChange,
  ...props
}: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState(navMain[0]);
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedPlaylistLink, setSelectedPlaylistLink] = React.useState<
    string | null
  >(null);
  const [watchedVideos, setWatchedVideos] = React.useState<Set<string>>(
    new Set()
  );
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(350);
  const { open, setOpen } = useSidebar();
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedWidth = localStorage.getItem("sidebarWidth");
      const storedWatched = localStorage.getItem("watchedVideos");
      if (storedWidth) setSidebarWidth(parseInt(storedWidth, 10));
      if (storedWatched) setWatchedVideos(new Set(JSON.parse(storedWatched)));
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("watchedVideos", JSON.stringify([...watchedVideos]));
    }
  }, [watchedVideos]);

  React.useEffect(() => {
    async function fetchResourcesAndDetails() {
      const response = await getData();
      if (response.success) {
        const enhancedResources = await Promise.all(
          response.data.map(async (resource) => {
            const playlistId = extractPlaylistId(resource.Link);
            const ytDetails = await fetchYouTubeDetails(resource.Link);
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
            };
          })
        );
        setResources(enhancedResources);
      }
    }
    fetchResourcesAndDetails();
  }, []);

  const handlePlaylistClick = (resource: Resource) => {
    if (resource.isPlaylist) {
      setSelectedPlaylistLink(resource.Link);
      setOpenDialog(true);
    }
    onResourceSelect?.(resource);
  };

  const toggleWatched = (resourceId: string) => {
    setWatchedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  const handleResize = (e: MouseEvent) => {
    if (sidebarRef.current) {
      const newWidth = e.clientX;
      const minWidth = open ? 200 : 60;
      const maxWidth = window.innerWidth * 0.5;
      const adjustedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      setSidebarWidth(adjustedWidth);
      sidebarRef.current.style.width = `${adjustedWidth}px`;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${adjustedWidth}px`
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebarWidth", adjustedWidth.toString());
      }
    }
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResizing);
  };

  const stopResizing = () => {
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResizing);
  };

  return (
    <div>
      <Sidebar
        collapsible="icon"
        className="flex-1 overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
        {...props}
      >
        <Sidebar
          collapsible="none"
          className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="md:h-8 md:p-0">
                  <a href="#">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        Resource Dir
                      </span>
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
                          setActiveItem(item);
                          setOpen(true);
                          onViewChange?.(
                            item.title === "All Resources"
                              ? "resources"
                              : "table"
                          );
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

        <Sidebar
          collapsible="none"
          className={cn("hidden flex-1 md:flex", !open && "hidden")}
        >
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
                {activeItem.title === "All Resources" &&
                  resources.map((resource) =>
                    resource.isPlaylist ? (
                      <Accordion type="single" collapsible key={resource.id}>
                        <AccordionItem value={resource.id}>
                          <AccordionTrigger
                            className={cn(
                              "flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              selectedResourceId === resource.id &&
                                "bg-gray-700 text-white",
                              watchedVideos.has(resource.id) && "bg-pink-100"
                            )}
                            onClick={() => handlePlaylistClick(resource)}
                          >
                            <div className="flex w-full items-center gap-2 flex-wrap">
                              {resource.thumbnailUrl && (
                                <img
                                  src={resource.thumbnailUrl}
                                  alt="Thumbnail"
                                  className="w-12 h-12 object-cover rounded"
                                  width={resource.thumbnailWidth}
                                  height={resource.thumbnailHeight}
                                />
                              )}
                              <span className="break-words max-w-[150px] md:max-w-[200px]">
                                {resource.videoTitle || resource.Title}
                              </span>
                              <span className="ml-auto text-xs shrink-0">
                                {new Date(
                                  resource.uploadDate || resource.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="break-words max-w-[260px] text-xs">
                              {resource.Description}
                            </span>
                            {resource.authorName && (
                              <div className="text-xs text-muted-foreground">
                                By:{" "}
                                <a
                                  href={resource.authorUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  {resource.authorName}
                                </a>
                              </div>
                            )}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 py-2 text-sm break-words max-w-[260px] flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleWatched(resource.id)}
                                className={cn(
                                  watchedVideos.has(resource.id) &&
                                    "bg-green-100 text-green-700"
                                )}
                              >
                                {watchedVideos.has(resource.id)
                                  ? "Watched"
                                  : "Mark Watched"}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      <div
                        key={resource.id}
                        className={cn(
                          "flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                          selectedResourceId === resource.id &&
                            "bg-gray-700 text-white",
                          watchedVideos.has(resource.id) && "bg-pink-100"
                        )}
                        onClick={() => handlePlaylistClick(resource)}
                      >
                        <div className="flex w-full items-center gap-2 flex-wrap">
                          {resource.thumbnailUrl && (
                            <img
                              src={resource.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-12 h-12 object-cover rounded"
                              width={resource.thumbnailWidth}
                              height={resource.thumbnailHeight}
                            />
                          )}
                          <span className="break-words max-w-[150px] md:max-w-[200px]">
                            {resource.videoTitle || resource.Title}
                          </span>
                          <span className="ml-auto text-xs shrink-0">
                            {new Date(
                              resource.uploadDate || resource.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="break-words max-w-[260px] text-xs">
                          {resource.Description}
                        </span>
                        {resource.authorName && (
                          <div className="text-xs text-muted-foreground">
                            By:{" "}
                            <a
                              href={resource.authorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {resource.authorName}
                            </a>
                          </div>
                        )}
                        <div className="break-words max-w-[260px] text-xs flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatched(resource.id);
                            }}
                            className={cn(
                              watchedVideos.has(resource.id) &&
                                "bg-green-100 text-green-700"
                            )}
                          >
                            {watchedVideos.has(resource.id)
                              ? "Watched"
                              : "Mark Watched"}
                          </Button>
                        </div>
                      </div>
                    )
                  )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>

      <div
        className={cn(
          "absolute top-0 right-0 w-2 h-full bg-gray-300 cursor-col-resize hover:bg-gray-400",
          !open && "hidden"
        )}
        onMouseDown={startResizing}
      />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Watch Full Playlist</DialogTitle>
            <DialogDescription>
              This is a YouTube playlist. For the best experience, we suggest
              watching the full playlist on YouTube.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Stay Here
            </Button>
            <Button asChild>
              <a
                href={selectedPlaylistLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Go to YouTube
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
