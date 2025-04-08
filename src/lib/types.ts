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
}

export interface Image {
    id: number;
    albumId: number;
    url: string;
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