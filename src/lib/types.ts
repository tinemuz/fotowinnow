export interface Photographer {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Album {
    id: number;
    title: string;
    description: string | null;
    coverImage: string;
    createdAt: Date;
    updatedAt: Date;
    isShared: boolean;
    photographerId: string;
    photographerName?: string;
    watermarkText?: string;
    watermarkQuality?: "512p" | "1080p" | "2K" | "4K";
    watermarkOpacity?: number;
}

export interface Image {
    id: number;
    albumId: number;
    url: string;
    optimizedUrl: string;
    watermarkedUrl: string;
    caption: string | null;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
}

export interface Comment {
    id: number;
    imageId: number;
    text: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
} 