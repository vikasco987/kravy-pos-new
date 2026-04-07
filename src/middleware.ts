// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     "/((?!_next|.*\\..*).*)",
//     "/(api|trpc)(.*)"
//   ],
// };

// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     "/((?!_next|static|favicon.ico).*)",
//     "/api/(.*)"
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/menu/(.*)",
  "/order-tracking/(.*)",
  "/track",
  "/api/public/(.*)",
  "/api/external/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/staff/login", // Added
  "/api/staff/login", // Added
  "/"
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const staffToken = request.cookies.get("staff_token")?.value;

  // 1. Redirect Clerk users away from sign-in pages if they are already logged in
  if (userId && (request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Allow access for Staff who have our JWT
  if (staffToken) {
    return NextResponse.next();
  }

  // 3. Allow Public Routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 4. Protect all other routes via Clerk
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
