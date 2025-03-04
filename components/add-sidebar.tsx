"use client";

import * as React from "react";
import { Command, TableIcon, BookmarkCheck, Bookmark } from 'lucide-react';
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
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const SKELETON_COUNT = 5;

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
  const [loading, setLoading] = React.useState(true);
  const [totalResources, setTotalResources] = React.useState(0);
  const [fetchedCount, setFetchedCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const loadingRef = React.useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showWatchedOnly, setShowWatchedOnly] = React.useState(false);

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

  const fetchResourcesAndDetails = React.useCallback(async () => {
    setLoading(true);
    try {
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
        setResources((prevResources) => [...prevResources, ...enhancedResources]);
        setTotalResources(enhancedResources.length); // Assuming all resources are returned at once
        setFetchedCount((prevCount) => prevCount + enhancedResources.length);
        setHasMore(false); // Assuming all resources are fetched at once
      } else {
        console.error("Failed to fetch resources");
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchResourcesAndDetails();
  }, [fetchResourcesAndDetails]);

  React.useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loading]);

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

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === "" || 
      resource.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.videoTitle && resource.videoTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (resource.authorName && resource.authorName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesWatched = !showWatchedOnly || watchedVideos.has(resource.id);
    
    return matchesSearch && matchesWatched;
  });

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
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-foreground">
                        Resource Dir
                      </span>
                      <span className="truncate text-xs text-muted-foreground">Directory</span>
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
                        className="px-2.5 md:px-2 text-foreground"
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
          <SidebarFooter className="flex flex-col gap-2 p-2">
            <ThemeToggle />
            <NavUser user={user} />
          </SidebarFooter>
        </Sidebar>

        <Sidebar
          collapsible="none"
          className={cn("hidden flex-1 md:flex", !open && "hidden")}
          ref={sidebarRef}
        >
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-base font-medium text-foreground">
                {activeItem.title}
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Switch 
                          id="watched-filter"
                          checked={showWatchedOnly}
                          onCheckedChange={setShowWatchedOnly}
                          className="shadow-none"
                        />
                        <Label htmlFor="watched-filter" className="text-sm cursor-pointer text-foreground">
                          Watched
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show only watched resources</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <SidebarInput 
              placeholder="Search resources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-foreground placeholder:text-muted-foreground"
            />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                {activeItem.title === "All Resources" &&
                  (loading
                    ? Array(SKELETON_COUNT)
                        .fill(null)
                        .map((_, i) => (
                          <div
                            key={`skeleton-${i}`}
                            className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0"
                          >
                            <div className="flex w-full items-center gap-2">
                              <Skeleton className="w-12 h-12 rounded-lg" />
                              <Skeleton className="h-4 w-[150px]" />
                              <Skeleton className="h-4 w-[50px] ml-auto" />
                            </div>
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        ))
                    : filteredResources.length > 0 ? (
                        filteredResources.map((resource) =>
                          resource.isPlaylist ? (
                            <Accordion type="single" collapsible key={resource.id}>
                              <AccordionItem value={resource.id} className="border-b">
                                <AccordionTrigger
                                  className={cn(
                                    "resource-card flex flex-col items-start gap-2 p-4 text-sm leading-tight rounded-lg m-1",
                                    selectedResourceId === resource.id && "selected",
                                    watchedVideos.has(resource.id) && "watched"
                                  )}
                                  onClick={() => handlePlaylistClick(resource)}
                                >
                                  <div className="flex w-full items-center gap-2 flex-wrap">
                                    {resource.thumbnailUrl ? (
                                      <img
                                        src={resource.thumbnailUrl || "/placeholder.svg"}
                                        alt="Thumbnail"
                                        className="w-12 h-12 object-cover rounded-lg"
                                        width={resource.thumbnailWidth}
                                        height={resource.thumbnailHeight}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                        <Command className="w-6 h-6 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <span className="break-words max-w-[150px] md:max-w-[200px] font-medium text-foreground">
                                        {resource.videoTitle || resource.Title}
                                      </span>
                                      <Badge variant="outline" className="w-fit mt-1 text-foreground border-foreground/20">Playlist</Badge>
                                    </div>
                                    <span className="ml-auto text-xs shrink-0 text-muted-foreground">
                                      {new Date(
                                        resource.uploadDate || resource.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <span className="break-words max-w-[260px] text-xs text-muted-foreground">
                                    {resource.Description}
                                  </span>
                                  {resource.authorName && (
                                    <div className="text-xs text-muted-foreground">
                                      By:{" "}
                                      <a
                                        href={resource.authorUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-primary"
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
                                        "rounded-full flex gap-2 items-center border-foreground/20 text-foreground",
                                        watchedVideos.has(resource.id) && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      )}
                                    >
                                      {watchedVideos.has(resource.id) ? (
                                        <>
                                          <BookmarkCheck className="h-4 w-4" />
                                          Watched
                                        </>
                                      ) : (
                                        <>
                                          <Bookmark className="h-4 w-4" />
                                          Mark Watched
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ) : (
                            <div
                              key={resource.id}
                              className={cn(
                                "resource-card flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 cursor-pointer rounded-lg m-1",
                                selectedResourceId === resource.id && "selected",
                                watchedVideos.has(resource.id) && "watched"
                              )}
                              onClick={() => handlePlaylistClick(resource)}
                            >
                              <div className="flex w-full items-center gap-2 flex-wrap">
                                {resource.thumbnailUrl ? (
                                  <img
                                    src={resource.thumbnailUrl || "/placeholder.svg"}
                                    alt="Thumbnail"
                                    className="w-12 h-12 object-cover rounded-lg"
                                    width={resource.thumbnailWidth}
                                    height={resource.thumbnailHeight}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <Command className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="break-words max-w-[150px] md:max-w-[200px] font-medium text-foreground">
                                    {resource.videoTitle || resource.Title}
                                  </span>
                                  <Badge variant="outline" className="w-fit mt-1 text-foreground border-foreground/20">Video</Badge>
                                </div>
                                <span className="ml-auto text-xs shrink-0 text-muted-foreground">
                                  {new Date(
                                    resource.uploadDate || resource.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="break-words max-w-[260px] text-xs text-muted-foreground">
                                {resource.Description}
                              </span>
                              {resource.authorName && (
                                <div className="text-xs text-muted-foreground">
                                  By:{" "}
                                  <a
                                    href={resource.authorUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-primary"
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
                                    "rounded-full flex gap-2 items-center border-foreground/20 text-foreground",
                                    watchedVideos.has(resource.id) && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  )}
                                >
                                  {watchedVideos.has(resource.id) ? (
                                    <>
                                      <BookmarkCheck className="h-4 w-4" />
                                      Watched
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="h-4 w-4" />
                                      Mark Watched
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <p>No resources found</p>
                          {searchTerm && (
                            <p className="text-sm mt-2">Try adjusting your search criteria</p>
                          )}
                        </div>
                      )
                  )}
                {hasMore && (
                  <div ref={loadingRef} className="p-4 text-center text-foreground">
                    Loading more resources...
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="sticky bottom-0 bg-background border-t p-2 text-sm text-muted-foreground">
            {loading ? (
              "Loading resources..."
            ) : (
              <>
                Showing {filteredResources.length} of {totalResources} resources
              </>
            )}
          </div>
        </Sidebar>
      </Sidebar>

      <div
        className={cn(
          "absolute top-0 right-0 w-2 h-full bg-border cursor-col-resize hover:bg-muted-foreground/20",
          !open && "hidden"
        )}
        onMouseDown={startResizing}
      />

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md rounded-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle>Watch Full Playlist</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This is a YouTube playlist. For the best experience, we suggest
              watching the full playlist on YouTube.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="border-foreground/20 text-foreground">
              Stay Here
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
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
