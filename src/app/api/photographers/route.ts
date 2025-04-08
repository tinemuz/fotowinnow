import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { photographers } from "~/server/db/schema";
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface PostBody {
    name: string;
    email: string;
}

export async function GET() {
    try {
        const allPhotographers = await db.select().from(photographers);
        return NextResponse.json(allPhotographers);
    } catch (error) {
        console.error("Error fetching photographers:", error);
        return NextResponse.json(
            { error: "Failed to fetch photographers" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name, email } = await request.json() as PostBody;

        if (!name || !email) {
            return NextResponse.json(
                { error: "Name and email are required" },
                { status: 400 }
            );
        }

        const insertedPhotographers: { id: number }[] = await db
            .insert(photographers)
            .values({
                name,
                email,
                clerkId: userId,
                tier: 'free',
                isActive: true,
                metadata: {},
            })
            .returning({ id: photographers.id });

        if (!insertedPhotographers || insertedPhotographers.length === 0) {
            return NextResponse.json(
                { error: "Failed to create photographer" },
                { status: 500 }
            );
        }

        return NextResponse.json(insertedPhotographers[0]);
    } catch (error) {
        console.error("Error creating photographer:", error);
        return NextResponse.json(
            { error: "Failed to create photographer" },
            { status: 500 }
        );
    }
} 