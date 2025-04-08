import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
});

export async function POST(req: NextRequest) {
    try {
        console.log('Starting upload request processing');

        // 1. Authenticate the user
        const { userId } = await auth();
        console.log('Auth check completed', { userId: userId ?? 'unauthorized' });

        if (!userId) {
            console.warn('Unauthorized upload attempt');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse request body
        const body = await req.json() as { filename: string; contentType: string };
        const { filename, contentType } = body;
        console.log('Request body parsed', { filename, contentType });

        if (!filename || !contentType) {
            console.warn('Invalid request - missing parameters', { filename: !!filename, contentType: !!contentType });
            return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
        }

        // 3. Generate a unique key for the R2 object
        const filenameParts = filename.split('.');
        const fileExtension = filenameParts.length > 1 ? filenameParts.pop() : undefined;
        const uniqueKey = `user-uploads/${userId}/${uuidv4()}${fileExtension ? '.' + fileExtension : ''}`;
        console.log('Generated unique key for upload', { uniqueKey });

        // 4. Create the PutObjectCommand
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME ?? '',
            Key: uniqueKey,
            ContentType: contentType,
            Metadata: { 'user-id': userId }
        });
        console.log('Created PutObjectCommand', {
            bucket: process.env.R2_BUCKET_NAME,
            key: uniqueKey,
            contentType
        });

        // 5. Generate the pre-signed URL
        console.log('Generating pre-signed URL...');
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 60 * 5, // URL expires in 5 minutes
        });
        console.log('Pre-signed URL generated successfully');

        // 6. Generate the secure URL for accessing the image
        const secureUrl = `/api/images/${uniqueKey.split('/').join('/')}`;

        // 7. Return the signed URL, key, and secure URL to the client
        console.log('Completing upload request successfully');
        return NextResponse.json({
            signedUrl,
            key: uniqueKey,
            url: secureUrl
        }, { status: 200 });

    } catch (error) {
        console.error("Error in upload process:", error instanceof Error ? {
            message: error.message,
            stack: error.stack
        } : error);
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }
} 