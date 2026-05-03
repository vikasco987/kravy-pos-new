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
  "/auth/custom(.*)", // Added
  "/api/auth/(.*)",   // Added
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/staff/login",
  "/api/staff/login",
  "/"
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const staffToken = request.cookies.get("staff_token")?.value;
  const customToken = request.cookies.get("kravy_auth_token")?.value;

  // 1. Redirect to dashboard if already logged in (for auth pages)
  if ((userId || customToken) && request.nextUrl.pathname.startsWith('/auth/custom')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (userId && (request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Allow access for Custom Auth Users
  if (customToken) {
    return NextResponse.next();
  }

  // 3. Allow access for Staff
  if (staffToken) {
    try {
      const payloadBase64 = staffToken.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const permissions = payload.permissions || [];
      const path = request.nextUrl.pathname;

      if (path.startsWith('/dashboard')) {
        const isAllowed = permissions.some((p: string) => path === p || path.startsWith(p + '/'));
        if (!isAllowed) {
           return NextResponse.redirect(new URL('/staff/login?error=denied', request.url));
        }
      }
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/staff/login?error=invalid_session', request.url));
    }
  }

  // 4. Allow Public Routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // 5. Protect all other routes via Clerk
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
