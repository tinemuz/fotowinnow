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
    { params }: { params: Promise<{ id: string; key: string }> }
) {
    try {
        // 1. Authenticate the user
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const resolvedParams = await params;
        const { id, key } = resolvedParams;

        // 2. Get the file from R2
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME ?? '',
            Key: id,
        });

        const object = await s3Client.send(command);

        if (!object.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        // 3. Stream the file back to the client
        const headers = new Headers();
        if (object.ContentType) {
            headers.set('Content-Type', object.ContentType);
        }
        if (object.ContentLength) {
            headers.set('Content-Length', object.ContentLength.toString());
        }

        // Set cache control headers
        headers.set('Cache-Control', 'private, max-age=3600');

        // Convert the readable stream to a Response
        return new NextResponse(object.Body.transformToWebStream(), {
            headers,
        });
    } catch (error) {
        console.error('Error serving image:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 