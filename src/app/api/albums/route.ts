import { db } from "~/server/db";
import { albums, photographers } from "~/server/db/schema";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET(_request: NextRequest) {
    try {
        const allAlbums = await db
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
            .leftJoin(photographers, eq(albums.photographerId, photographers.id));

        return NextResponse.json(allAlbums);
    } catch (error) {
        console.error("Error fetching albums:", error);
        return NextResponse.json(
            { error: "Failed to fetch albums" },
            { status: 500 }
        );
    }
}

interface PostAlbumRequestBody {
    name: string;
    description?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get the authenticated user's ID
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, description } = await request.json() as PostAlbumRequestBody;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const coverImage = "/placeholder.svg?height=400&width=600";

        const newAlbumData = {
            title: name,
            description: description ?? "",
            coverImage,
            isShared: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            photographerId: userId,
        };

        const insertedAlbums: { id: number }[] = await db.insert(albums).values(newAlbumData).returning({ id: albums.id });

        if (!insertedAlbums || insertedAlbums.length === 0) {
            return NextResponse.json(
                { error: "Failed to create album" },
                { status: 500 }
            );
        }

        const newAlbumId = insertedAlbums[0]?.id;

        return NextResponse.json({ id: newAlbumId }, { status: 201 });
    } catch (error) {
        console.error("Error creating album:", error);
        return NextResponse.json(
            { error: "Failed to create album" },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic'; 