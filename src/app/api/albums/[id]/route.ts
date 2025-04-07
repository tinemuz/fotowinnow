import { db } from "~/server/db";
import { albums, photographers } from "~/server/db/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
                photographerName: photographers.name,
            })
            .from(albums)
            .leftJoin(photographers, eq(albums.photographerId, photographers.id))
            .where(eq(albums.id, albumId))
            .limit(1);

        if (album.length === 0) {
            return NextResponse.json(
                { error: "Album not found" },
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