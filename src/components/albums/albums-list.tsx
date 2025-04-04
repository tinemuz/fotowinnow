"use client"

import {useState, useEffect} from "react"
import {IconArchive, IconFolder} from "@tabler/icons-react"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import { Album } from "@/types/database"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface AlbumsListProps {
  initialAlbums: Album[]
}

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
  const [activeAlbums, setActiveAlbums] = useState(initialAlbums.filter(album => album.status === 'published'))
  const [draftAlbums, setDraftAlbums] = useState(initialAlbums.filter(album => album.status === 'draft'))
  const [archivedAlbums, setArchivedAlbums] = useState(initialAlbums.filter(album => album.status === 'archived'))

  // Subscribe to album updates
  useEffect(() => {
    const albumsChannel = supabase
      .channel('albums-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'albums'
        },
        (payload: RealtimePostgresChangesPayload<Album>) => {
          const updatedAlbum = payload.new as Album;
          if (!updatedAlbum?.id) return;

          // Update the album in the appropriate list
          const updateAlbumInList = (albums: Album[], setAlbums: (albums: Album[]) => void) => {
            setAlbums(albums.map(album => 
              album.id === updatedAlbum.id ? updatedAlbum : album
            ));
          };

          // Remove from all lists first
          setActiveAlbums(prev => prev.filter(a => a.id !== updatedAlbum.id));
          setDraftAlbums(prev => prev.filter(a => a.id !== updatedAlbum.id));
          setArchivedAlbums(prev => prev.filter(a => a.id !== updatedAlbum.id));

          // Add to the appropriate list based on status
          switch (updatedAlbum.status) {
            case 'published':
              setActiveAlbums(prev => [...prev, updatedAlbum]);
              break;
            case 'draft':
              setDraftAlbums(prev => [...prev, updatedAlbum]);
              break;
            case 'archived':
              setArchivedAlbums(prev => [...prev, updatedAlbum]);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      albumsChannel.unsubscribe();
    };
  }, []);

  const handleArchive = async (albumId: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ status: 'archived' })
        .eq('id', albumId)

      if (error) throw error

      const album = activeAlbums.find((a) => a.id === albumId) || draftAlbums.find((a) => a.id === albumId)
      if (album) {
        if (album.status === 'published') {
          setActiveAlbums(activeAlbums.filter((a) => a.id !== albumId))
        } else {
          setDraftAlbums(draftAlbums.filter((a) => a.id !== albumId))
        }
        setArchivedAlbums([...archivedAlbums, { ...album, status: 'archived' }])
        toast.success("Album archived successfully")
      }
    } catch (error) {
      toast.error("Failed to archive album")
      console.error(error)
    }
  }

  const handleRestore = async (albumId: string) => {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ status: 'draft' })
        .eq('id', albumId)

      if (error) throw error

      const album = archivedAlbums.find((a) => a.id === albumId)
      if (album) {
        setArchivedAlbums(archivedAlbums.filter((a) => a.id !== albumId))
        setDraftAlbums([...draftAlbums, { ...album, status: 'draft' }])
        toast.success("Album restored successfully")
      }
    } catch (error) {
      toast.error("Failed to restore album")
      console.error(error)
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
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Albums</TabsTrigger>
        <TabsTrigger value="active">Active Albums</TabsTrigger>
        <TabsTrigger value="draft">Draft Albums</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialAlbums.map((album) => (
            <Link href={`/dashboard/albums/${album.id}`} key={album.id}>
              <Card className="min-w-[250px] min-h-[150px] hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                      <IconFolder className={`h-5 w-5 ${album.status === 'published' ? 'text-primary' : 'text-muted-foreground'} flex-shrink-0`} />
                      <span className="truncate">{album.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
                          <span className="sr-only">Open menu</span>
                          <IconArchive className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {album.status !== 'archived' ? (
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault()
                            handleArchive(album.id)
                          }}>
                            Archive Album
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={(e) => {
                            e.preventDefault()
                            handleRestore(album.id)
                          }}>
                            Restore Album
                          </DropdownMenuItem>
                        )}
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
            </Link>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="active" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAlbums.map((album) => (
            <Link href={`/dashboard/albums/${album.id}`} key={album.id}>
              <Card className="min-w-[250px] min-h-[150px] hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                      <IconFolder className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="truncate">{album.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
                          <span className="sr-only">Open menu</span>
                          <IconArchive className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault()
                          handleArchive(album.id)
                        }}>
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
            </Link>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="draft" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {draftAlbums.map((album) => (
            <Link href={`/dashboard/albums/${album.id}`} key={album.id}>
              <Card className="min-w-[250px] min-h-[150px] hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                      <IconFolder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{album.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
                          <span className="sr-only">Open menu</span>
                          <IconArchive className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault()
                          handleArchive(album.id)
                        }}>
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
            </Link>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="archived" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedAlbums.map((album) => (
            <Link href={`/dashboard/albums/${album.id}`} key={album.id}>
              <Card className="min-w-[250px] min-h-[150px] hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base truncate pr-2">
                      <IconFolder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{album.name}</span>
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
                          <span className="sr-only">Open menu</span>
                          <IconArchive className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.preventDefault()
                          handleRestore(album.id)
                        }}>
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
            </Link>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
} 