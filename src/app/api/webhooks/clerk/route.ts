// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { type WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server'; // Adjust path if needed

export async function POST(req: Request) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error('Clerk Webhook secret key is not set in environment variables.');
        return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

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
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured during webhook verification', {
            status: 400
        });
    }

    // Get the ID and type
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    // console.log('Webhook body:', body) // Optional: log for debugging

    // --- Handle the 'user.created' event ---
    if (eventType === 'user.created') {
        const { id: clerk_user_id, email_addresses, first_name, last_name /*, image_url, created_at, updated_at */ } = evt.data;

        // Ensure we have essential data
        if (!clerk_user_id || !email_addresses || email_addresses.length === 0) {
            console.error('Error: Missing user ID or email address in webhook payload');
            return NextResponse.json({ success: false, error: 'Missing required user data' }, { status: 400 });
        }

        const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id)?.email_address ?? email_addresses[0].email_address;
        const userName = first_name ? (last_name ? `${first_name} ${last_name}` : first_name) : primaryEmail; // Construct a name or default to email

        try {
            const supabaseAdmin = createSupabaseAdminClient();

            // Insert data into your 'profiles' table
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        // id: // Let Supabase generate the UUID PK automatically
                        clerk_user_id: clerk_user_id,
                        email: primaryEmail,
                        name: userName,
                        // user_tier_id: // Assign a default tier ID if needed/configured
                    },
                ])
                .select(); // Optionally select the inserted data

            if (error) {
                console.error('Supabase insert error:', error);
                // Handle potential errors like duplicate clerk_user_id if webhook fires unexpectedly multiple times
                if (error.code === '23505') { // Unique violation
                    console.warn(`Profile for Clerk user ${clerk_user_id} likely already exists.`);
                    // Consider fetching the existing profile instead of erroring, or just return success
                    return NextResponse.json({ success: true, message: 'Profile likely already exists' });
                }
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            console.log('Supabase profile created:', data);
            return NextResponse.json({ success: true, profile: data });

        } catch (dbError) {
            console.error('Database operation error:', dbError);
            return NextResponse.json({ success: false, error: 'Internal server error during database operation' }, { status: 500 });
        }
    }

    // --- Handle other event types (Optional) ---
    // if (eventType === 'user.updated') { ... handle updates ... }
    // if (eventType === 'user.deleted') { ... handle deletions ... }

    // If the event type isn't handled, return success
    return new Response('', { status: 200 });
}

// Define GET/PUT/PATCH etc. if needed, otherwise POST is sufficient for webhook
export async function GET() {
    return new Response('Method Not Allowed', { status: 405 });
}
// ... add other methods if necessary