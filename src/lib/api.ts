import { type Album, type Image, type Comment } from "./types";

const API_BASE_URL = "/api";

// Fetch all albums
export async function fetchAlbums(): Promise<Album[]> {
    const response = await fetch(`${API_BASE_URL}/albums`);
    if (!response.ok) {
        throw new Error("Failed to fetch albums");
    }
    return response.json() as Promise<Album[]>;
}

// Fetch a single album by ID
export async function fetchAlbumById(id: number): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch album ${id}`);
    }
    return response.json() as Promise<Album>;
}

// Create a new album
export async function createAlbum(data: {
    name: string;
    description?: string;
}): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to create album");
    }
    return response.json() as Promise<Album>;
}

// Fetch images for an album
export async function fetchAlbumImages(albumId: number): Promise<Image[]> {
    const response = await fetch(`${API_BASE_URL}/albums/${albumId}/images`);
    if (!response.ok) {
        throw new Error(`Failed to fetch images for album ${albumId}`);
    }
    return response.json() as Promise<Image[]>;
}

// Create a new image for an album
export async function createImage(albumId: number, data: {
    filename: string;
    caption?: string;
    url?: string;
}): Promise<Image> {
    const response = await fetch(`${API_BASE_URL}/albums/${albumId}/images`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to create image for album ${albumId}`);
    }
    return response.json() as Promise<Image>;
}

export async function fetchPhotographers(): Promise<{ id: number; name: string }[]> {
    const response = await fetch("/api/photographers");
    if (!response.ok) {
        throw new Error("Failed to fetch photographers");
    }
    return response.json() as Promise<{ id: number; name: string }[]>;
}

export async function createPhotographer(data: {
    name: string;
}): Promise<{ id: number; name: string }> {
    const response = await fetch("/api/photographers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to create photographer");
    }
    return response.json() as Promise<{ id: number; name: string }>;
}

// Fetch comments for an image
export async function fetchImageComments(imageId: number): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/comments`);
    if (!response.ok) {
        throw new Error(`Failed to fetch comments for image ${imageId}`);
    }
    return response.json() as Promise<Comment[]>;
}

// Create a new comment for an image
export async function createComment(
    imageId: number,
    data: { text: string; author: string }
): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to create comment for image ${imageId}`);
    }
    return response.json() as Promise<Comment>;
}

// Fetch a shared album by its share ID
export async function fetchSharedAlbum(shareId: string): Promise<Album & { images: Image[] }> {
    const response = await fetch(`${API_BASE_URL}/shared/${shareId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch shared album ${shareId}`);
    }
    return response.json() as Promise<Album & { images: Image[] }>;
}

// Update a shared album (e.g., selections)
export async function updateSharedAlbumSelections(
    shareId: string,
    imageIds: number[]
): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/shared/${shareId}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
    });
    if (!response.ok) {
        throw new Error(`Failed to update selections for shared album ${shareId}`);
    }
    return response.json() as Promise<{ success: boolean }>;
}

export async function updateAlbumSettings(
    albumId: number,
    settings: {
        title: string
        description: string
        watermarkText: string
        watermarkQuality: "512p" | "1080p" | "2K" | "4K"
        watermarkOpacity: number
    }
): Promise<Album> {
    const response = await fetch(`${API_BASE_URL}/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });

    if (!response.ok) {
        throw new Error(`Failed to update album settings ${albumId}`);
    }

    return response.json() as Promise<Album>;
} 