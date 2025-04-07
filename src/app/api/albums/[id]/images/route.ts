import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { images } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

// Remove unused RouteContext type
// type RouteContext = {
//     params: Promise<{ id: string }>;
// };

interface PostBody {
    filename: string;
    caption?: string;
}

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

        const albumImages = await db
            .select()
            .from(images)
            .where(
                and(
                    eq(images.albumId, albumId),
                    eq(images.isDeleted, false)
                )
            );

        console.log("Fetching images for album:", albumId);
        console.log("Found images:", albumImages);

        return NextResponse.json(albumImages);
    } catch (error) {
        console.error("Error fetching album images:", error);
        return NextResponse.json(
            { error: "Failed to fetch album images" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const albumId = Number((await params).id);

        if (isNaN(albumId)) {
            return NextResponse.json(
                { error: "Invalid album ID" },
                { status: 400 }
            );
        }

        const { filename, caption } = await request.json() as PostBody;

        if (!filename) {
            return NextResponse.json(
                { error: "Filename is required" },
                { status: 400 }
            );
        }

        const url = "/placeholder.svg?height=500&width=500";

        const newImageData = {
            albumId,
            url,
            caption,
            photographerId: 1, // TODO: Get from auth
        };

        const insertedImages: { id: number }[] = await db
            .insert(images)
            .values(newImageData)
            .returning({ id: images.id });

        if (!insertedImages || insertedImages.length === 0) {
            return NextResponse.json(
                { error: "Failed to create image" },
                { status: 500 }
            );
        }

        return NextResponse.json(insertedImages[0]);
    } catch (error) {
        console.error("Error creating image:", error);
        return NextResponse.json(
            { error: "Failed to create image" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";

