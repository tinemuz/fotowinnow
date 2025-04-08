import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { type WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from "~/server/db";
import { photographers } from "~/server/db/schema";

type WebhookPayload = {
    type: string;
    data: {
        id: string;
        email_addresses: Array<{
            id: string;
            email_address: string;
        }>;
        first_name?: string;
        last_name?: string;
        primary_email_address_id?: string;
    };
};

export async function POST(req: Request) {
    console.log('🔔 Webhook received - Starting processing');
    console.log('📍 Request URL:', req.url);

    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('❌ Clerk Webhook secret key is not set in environment variables.');
        return new Response('Webhook secret not configured', { status: 500 });
    }
    console.log('✅ Webhook secret found');

    // Get the headers
    const headersList = headers();
    const svix_id = (await headersList).get("svix-id");
    const svix_timestamp = (await headersList).get("svix-timestamp");
    const svix_signature = (await headersList).get("svix-signature");

    console.log('📨 Webhook headers:', {
        svix_id,
        svix_timestamp,
        has_signature: !!svix_signature
    });

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('❌ Missing required Svix headers');
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = (await req.json()) as WebhookPayload;
    const body = JSON.stringify(payload);
    console.log('📦 Webhook payload received:', {
        type: payload.type,
        data: {
            id: payload.data.id,
            email_addresses: payload.data.email_addresses.length,
            has_first_name: !!payload.data.first_name,
            has_last_name: !!payload.data.last_name
        }
    });

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
        console.log('✅ Webhook signature verified successfully');
    } catch (err) {
        console.error('❌ Error verifying webhook:', err);
        return new Response('Error occured during webhook verification', {
            status: 400
        });
    }

    // Get the ID and type
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`🎯 Processing webhook - ID: ${id}, Type: ${eventType}`);

    // --- Handle the 'user.created' event ---
    if (eventType === 'user.created') {
        console.log('👤 Processing user.created event');
        const { id: clerk_user_id, email_addresses, first_name, last_name } = evt.data;

        // Ensure we have essential data
        if (!clerk_user_id || !email_addresses || email_addresses.length === 0) {
            console.error('❌ Missing required user data:', {
                has_clerk_user_id: !!clerk_user_id,
                email_addresses_count: email_addresses?.length
            });
            return NextResponse.json({ success: false, error: 'Missing required user data' }, { status: 400 });
        }

        const primaryEmail = email_addresses[0]!.email_address;

        let userName = primaryEmail;
        if (first_name) {
            userName = last_name ? `${first_name} ${last_name}` : first_name;
        }

        console.log('📝 User data prepared:', {
            clerk_user_id,
            primaryEmail,
            userName
        });

        try {
            // Insert the photographer into our database
            const [newPhotographer] = await db
                .insert(photographers)
                .values({
                    clerkId: clerk_user_id,
                    email: primaryEmail,
                    name: userName,
                    tier: 'free',
                    isActive: true,
                    metadata: {
                        firstName: first_name,
                        lastName: last_name,
                        emailAddresses: email_addresses
                    }
                })
                .returning();

            if (!newPhotographer) {
                throw new Error('Failed to create photographer - no data returned');
            }

            console.log('✅ Photographer created successfully:', {
                id: newPhotographer.id,
                clerkId: newPhotographer.clerkId,
                email: newPhotographer.email
            });

            return NextResponse.json({ success: true, photographer: newPhotographer });
        } catch (error) {
            console.error('❌ Database operation error:', error);
            // Handle unique constraint violation
            if (error instanceof Error && error.message.includes('unique constraint')) {
                console.warn(`⚠️ Photographer for Clerk user ${clerk_user_id} likely already exists.`);
                return NextResponse.json({ success: true, message: 'Photographer likely already exists' });
            }
            return NextResponse.json(
                { success: false, error: 'Failed to create photographer' },
                { status: 500 }
            );
        }
    }

    // --- Handle other event types (Optional) ---
    console.log(`ℹ️ Unhandled event type: ${eventType}`);
    return new Response('', { status: 200 });
}

// Define GET/PUT/PATCH etc. if needed, otherwise POST is sufficient for webhook
export async function GET() {
    return new Response('Method Not Allowed', { status: 405 });
} 