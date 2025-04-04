// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { type WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server'; // Adjust path if needed

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
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

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
    const payload = await req.json();
    const body = JSON.stringify(payload);
    console.log('📦 Webhook payload received:', {
        type: payload.type,
        data: {
            id: payload.data?.id,
            email_addresses: payload.data?.email_addresses?.length,
            has_first_name: !!payload.data?.first_name,
            has_last_name: !!payload.data?.last_name
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

        const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id)?.email_address ?? email_addresses[0].email_address;
        const userName = first_name ? (last_name ? `${first_name} ${last_name}` : first_name) : primaryEmail;

        console.log('📝 User data prepared:', {
            clerk_user_id,
            primaryEmail,
            userName
        });

        try {
            console.log('🔌 Creating Supabase admin client');
            const supabaseAdmin = createSupabaseAdminClient();

            // Verify Supabase connection
            const { data: testData, error: testError } = await supabaseAdmin
                .from('profiles')
                .select('count')
                .limit(1);

            if (testError) {
                console.error('❌ Supabase connection test failed:', {
                    error: testError,
                    message: testError.message,
                    details: testError.details,
                    hint: testError.hint
                });
                return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
            }
            console.log('✅ Supabase connection test successful');

            console.log('💾 Attempting to insert user into profiles table');
            // Insert data into your 'profiles' table
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .insert([
                    {
                        clerk_user_id: clerk_user_id,
                        email: primaryEmail,
                        name: userName,
                    },
                ])
                .select();

            if (error) {
                console.error('❌ Supabase insert error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });

                // Handle potential errors like duplicate clerk_user_id if webhook fires unexpectedly multiple times
                if (error.code === '23505') { // Unique violation
                    console.warn(`⚠️ Profile for Clerk user ${clerk_user_id} likely already exists.`);
                    return NextResponse.json({ success: true, message: 'Profile likely already exists' });
                }
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            console.log('✅ Profile created successfully:', {
                profile_id: data[0]?.id,
                clerk_user_id: data[0]?.clerk_user_id,
                email: data[0]?.email
            });
            return NextResponse.json({ success: true, profile: data });

        } catch (dbError) {
            console.error('❌ Database operation error:', {
                error: dbError,
                message: dbError instanceof Error ? dbError.message : 'Unknown error',
                stack: dbError instanceof Error ? dbError.stack : undefined
            });
            return NextResponse.json({ success: false, error: 'Internal server error during database operation' }, { status: 500 });
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
// ... add other methods if necessary