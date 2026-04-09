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
    try {
      // Decode JWT payload (standard base64 decode for Edge compatibility)
      const payloadBase64 = staffToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const permissions = payload.permissions || [];
      const path = request.nextUrl.pathname;

      // If accessing dashboard, check if the path (or a parent path) is allowed
      if (path.startsWith('/dashboard')) {
        const isAllowed = permissions.some((p: string) => path === p || path.startsWith(p + '/'));
        
        if (!isAllowed) {
           console.log(`[AUTH] Staff ${payload.name} denied access to ${path}`);
           // Redirect to staff login if not allowed
           return NextResponse.redirect(new URL('/staff/login?error=denied', request.url));
        }
      }
      return NextResponse.next();
    } catch (e) {
      console.error("[AUTH] Staff token decode failed", e);
      return NextResponse.redirect(new URL('/staff/login?error=invalid_session', request.url));
    }
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
