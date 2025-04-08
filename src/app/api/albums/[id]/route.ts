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
                    eq(albums.photographerId, photographerId)
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

export const dynamic = 'force-dynamic' 