import { createSupabaseServerActionClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    { params }: { params: { path: string } }
) {
    try {
        const supabase = await createSupabaseServerActionClient()
        const { data, error } = await supabase.storage
            .from("photos")
            .createSignedUrl(params.path, 3600)

        if (error) {
            console.error("Error creating signed URL:", error)
            return new NextResponse("Error creating signed URL", { status: 500 })
        }

        return NextResponse.redirect(data.signedUrl)
    } catch (error) {
        console.error("Error in photos route:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
} 