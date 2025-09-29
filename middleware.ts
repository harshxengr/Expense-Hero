import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createMiddleware } from "@arcjet/next";
import aj from "@/lib/arcjet";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/account(.*)",
    "/transaction(.*)",
]);

// Clerk authentication middleware only (keep edge bundle small)
const clerk = clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    if (!userId && isProtectedRoute(req)) {
        const { redirectToSignIn } = await auth();
        return redirectToSignIn();
    }

    return NextResponse.next();
});

// Compose lightweight Arcjet (token bucket) + Clerk
// Use createMiddleware with no custom props to satisfy types
export default createMiddleware(aj as any, clerk);

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};