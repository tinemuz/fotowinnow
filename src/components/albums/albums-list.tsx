"use client"

import {useState} from "react"
import {IconArchive, IconFolder} from "@tabler/icons-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Album } from "@/types/database"

interface AlbumsListProps {
  initialAlbums: Album[]
}

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
  const [activeAlbums, setActiveAlbums] = useState(initialAlbums.filter(album => album.status !== 'archived'))
  const [archivedAlbums, setArchivedAlbums] = useState(initialAlbums.filter(album => album.status === 'archived'))

  const handleArchive = (albumId: string) => {
    const album = activeAlbums.find((a) => a.id === albumId)
    if (album) {
      setActiveAlbums(activeAlbums.filter((a) => a.id !== albumId))
      setArchivedAlbums([...archivedAlbums, { ...album, status: 'archived' }])
    }
  }

  const handleRestore = (albumId: string) => {
    const album = archivedAlbums.find((a) => a.id === albumId)
    if (album) {
      setArchivedAlbums(archivedAlbums.filter((a) => a.id !== albumId))
      setActiveAlbums([...activeAlbums, { ...album, status: 'draft' }])
    }
  }

  if (initialAlbums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No albums yet</h3>
        <p className="text-sm text-muted-foreground">Create your first album to get started</p>
      </div>
    )
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
            <Card key={album.id} className="min-w-[250px] min-h-[150px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                    <IconFolder className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="truncate">{album.name}</span>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
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
                <CardDescription className="truncate">{album.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground truncate">
                  Created {new Date(album.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="archived" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedAlbums.map((album) => (
            <Card key={album.id} className="min-w-[250px] min-h-[150px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                    <IconFolder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{album.name}</span>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
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
                <CardDescription className="truncate">{album.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground truncate">
                  Created {new Date(album.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
} 