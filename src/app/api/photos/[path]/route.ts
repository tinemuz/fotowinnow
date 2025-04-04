import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrls } from '@/lib/actions/photos';

// Define the params type
type Params = {
    path: string;
};

export async function GET(
    request: NextRequest,
    context: { params: Params }
): Promise<Response> {
    try {
        const storagePath = decodeURIComponent(context.params.path);
        const signedUrls = await getSignedUrls([storagePath]);

        if (!signedUrls?.[storagePath]) {
            return new NextResponse('Photo not found', { status: 404 });
        }

        // Redirect to the signed URL
        return NextResponse.redirect(signedUrls[storagePath]);
    } catch (error) {
        console.error('Error in photo access route:', error);
        return new NextResponse('Unauthorized', { status: 401 });
    }
} 