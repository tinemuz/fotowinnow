import { db } from "~/server/db"
import { comments } from "~/server/db/schema"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"

interface PostBody {
    text: string
}

// GET /api/images/[id]/comments - Get all comments for an image
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const imageId = parseInt((await params).id, 10)
        if (isNaN(imageId)) {
            return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
        }

        const imageComments = await db
            .select()
            .from(comments)
            .where(
                and(
                    eq(comments.imageId, imageId),
                    eq(comments.isDeleted, false)
                )
            )
            .orderBy(comments.createdAt)

        console.log('Fetching comments for image:', imageId)
        console.log('Found comments:', imageComments)

        return NextResponse.json(imageComments)
    } catch (error) {
        console.error("Error fetching comments:", error)
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        )
    }
}

// POST /api/images/[id]/comments - Create a new comment for an image
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const imageId = Number((await params).id)
        if (isNaN(imageId)) {
            return NextResponse.json({ error: "Invalid image ID" }, { status: 400 })
        }

        const { text } = await request.json() as PostBody

        if (!text) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            )
        }

        const newCommentData = {
            imageId,
            text,
            author: "Anonymous",
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        const insertedComments: { id: number }[] = await db
            .insert(comments)
            .values(newCommentData)
            .returning({ id: comments.id })

        if (!insertedComments || insertedComments.length === 0) {
            return NextResponse.json(
                { error: "Failed to create comment" },
                { status: 500 }
            )
        }

        const newComment = {
            id: insertedComments[0]!.id,
            ...newCommentData,
        }

        return NextResponse.json(newComment, { status: 201 })
    } catch (error) {
        console.error("Error creating comment:", error)
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        )
    }
}

export const dynamic = 'force-dynamic' 