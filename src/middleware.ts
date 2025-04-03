import {clerkMiddleware, createRouteMatcher} from '@clerk/nextjs/server'

// Define the route(s) that should be protected
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)', // Protects /dashboard and all its sub-routes
]);

export default clerkMiddleware(async (auth, req) => {
    // Check if the route requires protection
    if (isProtectedRoute(req)) {
        // If it does, call auth().protect() to enforce authentication
        await auth.protect();
    }
    // Routes not matched by isProtectedRoute remain public by default
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}