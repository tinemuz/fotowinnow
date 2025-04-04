import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrls } from '@/lib/actions/photos';

export async function GET(request: NextRequest, props: { params: Promise<{ path: string }> }): Promise<Response> {
    const params = await props.params;
    try {
        const storagePath = decodeURIComponent(params.path);
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