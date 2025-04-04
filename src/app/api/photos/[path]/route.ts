import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrls } from '@/lib/actions/photos';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string }> }
): Promise<Response> {
    try {
        const resolvedParams = await params;
        const storagePath = decodeURIComponent(resolvedParams.path);
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