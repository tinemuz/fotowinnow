import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "~/server/db";
import { images } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { albums } from "~/server/db/schema";

// Remove unused RouteContext type
// type RouteContext = {
//     params: Promise<{ id: string }>;
// };

interface PostBody {
    filename: string;
    caption?: string;
    url?: string;
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Authenticate the user
        const { userId } = await auth();
        console.log('Auth check completed for fetching album images', { userId: userId ?? 'unauthorized' });

        if (!userId) {
            console.warn('Unauthorized album image fetch attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get Album ID
        const albumId = parseInt((await params).id, 10);
        console.log('Fetching images for album:', { albumId, requestingUserId: userId });

        if (isNaN(albumId)) {
            console.warn('Invalid album ID received:', { id: (await params).id });
            return NextResponse.json(
                { error: "Invalid album ID" },
                { status: 400 }
            );
        }

        // 3. Verify album ownership (Temporarily disabled - any authenticated user can access any album)
        const albumResults = await db
            .select({ id: albums.id }) // Select only necessary field
            .from(albums)
            .where(
                eq(albums.id, albumId)
            )
            .limit(1);

        if (!albumResults || albumResults.length === 0) {
            console.warn('Album not found when fetching images:', { albumId });
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        // 4. Fetch images for this album (Ownership check temporarily disabled)
        const albumImages = await db
            .select()
            .from(images)
            .where(
                and(
                    eq(images.albumId, albumId),
                    eq(images.isDeleted, false)
                )
            );

        console.log("Found images for user in album:", { count: albumImages.length, albumId, userId });

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
    console.log('Starting image record creation');
    try {
        // 1. Authenticate the user
        const { userId } = await auth();
        console.log('Auth check completed for image creation', { userId: userId ?? 'unauthorized' });

        if (!userId) {
            console.warn('Unauthorized image creation attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Get Album ID
        const albumId = Number((await params).id);
        console.log('Processing request for album:', { albumId });

        if (isNaN(albumId)) {
            console.warn('Invalid album ID received:', { id: (await params).id });
            return NextResponse.json(
                { error: "Invalid album ID" },
                { status: 400 }
            );
        }

        // Verify album exists (Ownership check temporarily disabled)
        const albumResults = await db
            .select({ id: albums.id }) // Select only necessary field
            .from(albums)
            .where(
                eq(albums.id, albumId)
            )
            .limit(1);

        if (!albumResults || albumResults.length === 0) {
            console.warn('Album not found when creating image:', { albumId });
            return NextResponse.json({ error: "Album not found" }, { status: 404 });
        }

        // 3. Parse Request Body
        const { filename, caption, url } = await request.json() as PostBody;
        console.log('Received image data:', { filename, caption, url });

        if (!filename || !url) {
            console.warn('Missing filename or url in request');
            return NextResponse.json(
                { error: "Filename and URL are required" },
                { status: 400 }
            );
        }

        // 4. Prepare Image Data
        const newImageData = {
            albumId,
            url: url,
            caption: caption ?? null,
        };
        console.log('Preparing to insert image record:', newImageData);

        // 5. Insert into Database
        const insertedImages: { id: number }[] = await db
            .insert(images)
            .values(newImageData)
            .returning({ id: images.id });

        if (!insertedImages || insertedImages.length === 0) {
            console.error('Failed to insert image record - no ID returned');
            return NextResponse.json(
                { error: "Failed to create image" },
                { status: 500 }
            );
        }

        const newImageId = insertedImages[0]?.id;

        if (newImageId === undefined) {
            console.error('Failed to insert image record - could not get ID');
            return NextResponse.json(
                { error: "Failed to create image" },
                { status: 500 }
            );
        }

        console.log('Successfully created image record:', { imageId: newImageId, albumId, userId });

        // 6. Return the newly created image
        const newImage = await db
            .select()
            .from(images)
            .where(eq(images.id, newImageId))
            .limit(1);

        if (!newImage || newImage.length === 0) {
            console.error('Failed to retrieve newly created image record:', { newImageId });
            return NextResponse.json(
                { error: "Failed to retrieve created image" },
                { status: 500 }
            );
        }

        return NextResponse.json(newImage[0]);
    } catch (error) {
        console.error("Error creating image record:", error instanceof Error ? {
            message: error.message,
            stack: error.stack
        } : error);
        return NextResponse.json(
            { error: "Failed to create image" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";

