export interface Album {
  id: string
  title: string
  description: string
  coverImage: string
  createdAt: string
  isShared: boolean
  imageCount: number
  photographerName: string
}

export interface Comment {
  id: string
  imageId: string
  text: string
  author: string
  createdAt: string
}

export interface Image {
  id: string
  albumId: string
  url: string
  caption?: string
  createdAt: string
}

export const mockAlbums: Album[] = [
  {
    id: "album-1",
    title: "Summer Wedding",
    description: "John & Sarah's wedding at Lakeside Resort",
    coverImage: "/placeholder.svg?height=400&width=600",
    createdAt: "2023-06-15",
    isShared: true,
    imageCount: 48,
    photographerName: "Jane Smith Photography",
  },
  {
    id: "album-2",
    title: "Corporate Event",
    description: "Annual company retreat at Mountain View",
    coverImage: "/placeholder.svg?height=400&width=600",
    createdAt: "2023-07-22",
    isShared: false,
    imageCount: 32,
    photographerName: "Jane Smith Photography",
  },
  {
    id: "album-3",
    title: "Family Portrait",
    description: "The Johnson family outdoor session",
    coverImage: "/placeholder.svg?height=400&width=600",
    createdAt: "2023-08-05",
    isShared: false,
    imageCount: 15,
    photographerName: "Jane Smith Photography",
  },
]

export const mockImages: Image[] = [
  // Album 1 images
  {
    id: "img-1",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Bride preparation",
    createdAt: "2023-06-15",
  },
  {
    id: "img-2",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Ceremony",
    createdAt: "2023-06-15",
  },
  {
    id: "img-3",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "First dance",
    createdAt: "2023-06-15",
  },
  {
    id: "img-4",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Cake cutting",
    createdAt: "2023-06-15",
  },
  {
    id: "img-5",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Reception",
    createdAt: "2023-06-15",
  },
  {
    id: "img-6",
    albumId: "album-1",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Group photo",
    createdAt: "2023-06-15",
  },

  // Album 2 images
  {
    id: "img-7",
    albumId: "album-2",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Team building",
    createdAt: "2023-07-22",
  },
  {
    id: "img-8",
    albumId: "album-2",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Keynote speech",
    createdAt: "2023-07-22",
  },
  {
    id: "img-9",
    albumId: "album-2",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Award ceremony",
    createdAt: "2023-07-22",
  },
  {
    id: "img-10",
    albumId: "album-2",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Networking event",
    createdAt: "2023-07-22",
  },

  // Album 3 images
  {
    id: "img-11",
    albumId: "album-3",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Family portrait",
    createdAt: "2023-08-05",
  },
  {
    id: "img-12",
    albumId: "album-3",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Children playing",
    createdAt: "2023-08-05",
  },
  {
    id: "img-13",
    albumId: "album-3",
    url: "/placeholder.svg?height=500&width=500",
    caption: "Parents",
    createdAt: "2023-08-05",
  },
]

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    imageId: "img-1",
    text: "Love the lighting in this shot!",
    author: "Client",
    createdAt: "2023-06-16",
  },
  {
    id: "comment-2",
    imageId: "img-1",
    text: "Can we get this one in black and white as well?",
    author: "Client",
    createdAt: "2023-06-17",
  },
  {
    id: "comment-3",
    imageId: "img-3",
    text: "This is my favorite photo from the whole event.",
    author: "Client",
    createdAt: "2023-06-16",
  },
  {
    id: "comment-4",
    imageId: "img-11",
    text: "Could we crop this a bit tighter?",
    author: "Client",
    createdAt: "2023-08-06",
  },
]

