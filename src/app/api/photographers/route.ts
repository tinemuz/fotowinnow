import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { photographers } from "~/server/db/schema";
import type { NextRequest } from "next/server";

interface PostBody {
    name: string;
}

// Placeholder for authentication logic
// In a real app, you'd verify the user's identity here
const authenticateUser = async (request: NextRequest): Promise<boolean> => {
    // TODO: Implement actual authentication logic
    console.log("Placeholder auth check for request:", request.url) // Added log
    return true; // Return true for the placeholder
};

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
    const authResult = await authenticateUser(request);
    if (authResult === false) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { name } = await request.json() as PostBody;

        if (!name) {
            return NextResponse.json(
                { error: "Missing name" },
                { status: 400 }
            );
        }

        const insertedPhotographers: { id: number }[] = await db
            .insert(photographers)
            .values({ name })
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