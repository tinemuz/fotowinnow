import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        // 1. Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Reconstruct the full key from the catch-all segments
        const resolvedParams = await params;
        const fullKey = resolvedParams.key.join('/');
        console.log('Attempting to serve image:', { fullKey, requestingUserId: userId });

        // 3. Extract ownerId from the key (assuming format: albums/{albumId}/{userId}/{filename})
        // Adjust the index based on your final key structure
        const keyParts = fullKey.split('/');
        let ownerId: string | undefined;
        if (keyParts.length >= 3 && keyParts[0] === 'albums') {
            ownerId = keyParts[2]; // Expecting userId at index 2
        } else if (keyParts.length >= 2 && keyParts[0] === 'user-uploads') {
            ownerId = keyParts[1]; // Expecting userId at index 1 for older/generic uploads
        }
        console.log('Extracted ownerId from key:', { ownerId });

        // 4. Verify ownership
        if (!ownerId || ownerId !== userId) {
            console.warn('Forbidden access attempt:', { fullKey, requestingUserId: userId, ownerId });
            return new NextResponse('Forbidden', { status: 403 });
        }

        // 5. Get the file from R2
        console.log('Fetching object from R2:', { fullKey });
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME ?? '',
            Key: fullKey,
        });

        const object = await s3Client.send(command);
        console.log('Received object metadata from R2', {
            contentType: object.ContentType,
            contentLength: object.ContentLength
        });

        if (!object.Body) {
            console.warn('Object body not found in R2 response:', { fullKey });
            return new NextResponse('File not found', { status: 404 });
        }

        // 6. Stream the file back to the client
        const headers = new Headers();
        if (object.ContentType) {
            headers.set('Content-Type', object.ContentType);
        }
        if (object.ContentLength) {
            headers.set('Content-Length', object.ContentLength.toString());
        }

        // Set cache control headers (private since it's user-specific)
        headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

        console.log('Streaming image back to client:', { fullKey });
        // Convert the readable stream to a Response
        return new NextResponse(object.Body.transformToWebStream(), {
            headers,
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 