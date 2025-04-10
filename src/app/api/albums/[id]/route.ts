import { db } from "~/server/db";
import { albums, photographers } from "~/server/db/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get the authenticated user's ID
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // First get the photographer ID from our database
        const photographerResult = await db
            .select({ id: photographers.id })
            .from(photographers)
            .where(eq(photographers.clerkId, userId))
            .limit(1);

        if (!photographerResult.length) {
            return NextResponse.json(
                { error: "Photographer not found" },
                { status: 404 }
            );
        }

        const photographerId = photographerResult[0]!.id;

        const albumId = parseInt((await params).id, 10);

        if (isNaN(albumId)) {
            return NextResponse.json(
                { error: "Invalid album ID" },
                { status: 400 }
            );
        }

        const album = await db
            .select({
                id: albums.id,
                title: albums.title,
                description: albums.description,
                coverImage: albums.coverImage,
                createdAt: albums.createdAt,
                isShared: albums.isShared,
                photographerId: albums.photographerId,
            })
            .from(albums)
            .where(
                and(
                    eq(albums.id, albumId),
                    eq(albums.photographerId, photographerId.toString())
                )
            )
            .limit(1);

        if (album.length === 0) {
            return NextResponse.json(
                { error: "Album not found or unauthorized" },
                { status: 404 }
            );
        }

        return NextResponse.json(album[0]);
    } catch (error) {
        console.error("Error fetching album:", error);
        return NextResponse.json(
            { error: "Failed to fetch album" },
            { status: 500 }
        );
    }
}

interface PatchAlbumRequestBody {
    title?: string;
    description?: string;
    watermarkText?: string;
    watermarkQuality?: "512p" | "1080p" | "2K" | "4K";
    watermarkOpacity?: number;
    coverImage?: string;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get the authenticated user's ID
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // First get the photographer ID from our database
        const photographerResult = await db
            .select({ id: photographers.id })
            .from(photographers)
            .where(eq(photographers.clerkId, userId))
            .limit(1);

        if (!photographerResult.length) {
            return NextResponse.json(
                { error: "Photographer not found" },
                { status: 404 }
            );
        }

        const photographerId = photographerResult[0]!.id;
        const albumId = parseInt((await params).id, 10);

        if (isNaN(albumId)) {
            return NextResponse.json(
                { error: "Invalid album ID" },
                { status: 400 }
            );
        }

        // Verify album ownership
        const albumResult = await db
            .select({ id: albums.id })
            .from(albums)
            .where(
                and(
                    eq(albums.id, albumId),
                    eq(albums.photographerId, photographerId.toString())
                )
            )
            .limit(1);

        if (!albumResult.length) {
            return NextResponse.json(
                { error: "Album not found" },
                { status: 404 }
            );
        }

        const body = await request.json() as PatchAlbumRequestBody;

        // Update album settings
        const updatedAlbum = await db
            .update(albums)
            .set({
                ...(body.title && { title: body.title }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.watermarkText !== undefined && { watermarkText: body.watermarkText }),
                ...(body.watermarkQuality !== undefined && { watermarkQuality: body.watermarkQuality }),
                ...(body.watermarkOpacity !== undefined && { watermarkOpacity: body.watermarkOpacity }),
                ...(body.coverImage && { coverImage: body.coverImage }),
                updatedAt: new Date(),
            })
            .where(eq(albums.id, albumId))
            .returning({
                id: albums.id,
                title: albums.title,
                description: albums.description,
                coverImage: albums.coverImage,
                watermarkText: albums.watermarkText,
                watermarkQuality: albums.watermarkQuality,
                watermarkOpacity: albums.watermarkOpacity,
                createdAt: albums.createdAt,
                updatedAt: albums.updatedAt,
                isShared: albums.isShared,
                photographerId: albums.photographerId,
            });

        if (!updatedAlbum.length) {
            return NextResponse.json(
                { error: "Failed to update album" },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedAlbum[0]);
    } catch (error) {
        console.error("Error updating album:", error);
        return NextResponse.json(
            { error: "Failed to update album" },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic' 