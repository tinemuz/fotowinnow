"use client"

import { useState } from "react"
import { IconArchive, IconFolder } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// This would typically come from your database
const mockAlbums = [
  {
    id: "1",
    name: "Family Photos",
    description: "Photos from family gatherings",
    imageCount: 24,
    createdAt: "2024-03-20",
  },
  {
    id: "2",
    name: "Vacation 2024",
    description: "Photos from our recent vacation",
    imageCount: 156,
    createdAt: "2024-03-15",
  },
]

const mockArchivedAlbums = [
  {
    id: "3",
    name: "Old Memories",
    description: "Archived photos from 2023",
    imageCount: 89,
    createdAt: "2023-12-31",
  },
]

export function AlbumsList() {
  const [activeAlbums, setActiveAlbums] = useState(mockAlbums)
  const [archivedAlbums, setArchivedAlbums] = useState(mockArchivedAlbums)

  const handleArchive = (albumId: string) => {
    const album = activeAlbums.find((a) => a.id === albumId)
    if (album) {
      setActiveAlbums(activeAlbums.filter((a) => a.id !== albumId))
      setArchivedAlbums([...archivedAlbums, album])
    }
  }

  const handleRestore = (albumId: string) => {
    const album = archivedAlbums.find((a) => a.id === albumId)
    if (album) {
      setArchivedAlbums(archivedAlbums.filter((a) => a.id !== albumId))
      setActiveAlbums([...activeAlbums, album])
    }
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList>
        <TabsTrigger value="active">Active Albums</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAlbums.map((album) => (
            <Card key={album.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconFolder className="h-5 w-5 text-primary" />
                    {album.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <IconArchive className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleArchive(album.id)}>
                        Archive Album
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{album.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {album.imageCount} images • Created {album.createdAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="archived" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedAlbums.map((album) => (
            <Card key={album.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconFolder className="h-5 w-5 text-muted-foreground" />
                    {album.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <IconArchive className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRestore(album.id)}>
                        Restore Album
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{album.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {album.imageCount} images • Created {album.createdAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
} 