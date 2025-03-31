import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Create a simple custom middleware function
export function middleware(req: NextRequest) {
    // Get the current path and hostname
    const url = req.nextUrl;
    const hostname = req.headers.get('host') || '';
    const isAppSubdomain = hostname.startsWith('app.');
    const path = url.pathname;

    // Skip certain paths that should be handled directly
    if (
        path.startsWith('/api') ||
        path.startsWith('/sign-in') ||
        path.startsWith('/sign-up') ||
        path.startsWith('/sso-callback') ||
        path.includes('/clerk')
    ) {
        return NextResponse.next();
    }

    // Handle routing based on subdomain
    if (isAppSubdomain) {
        // For app subdomain, rewrite to the app directory
        if (!path.startsWith('/app')) {
            url.pathname = `/app${path === '/' ? '' : path}`;
            return NextResponse.rewrite(url);
        }
    } else {
        // For main domain, rewrite to the landing directory
        if (!path.startsWith('/landing')) {
            url.pathname = `/landing${path === '/' ? '' : path}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
    matcher: [
        '/((?!_next|_static|_vercel|images|favicon|[\\w-]+\\.\\w+).*)',
    ],
};