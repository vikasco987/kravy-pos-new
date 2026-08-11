import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const isPublicRoute = createRouteMatcher([
  "/menu/(.*)",
  "/public/(.*)",
  "/order-tracking/(.*)",
  "/track",
  "/demo",
  "/api/public/(.*)",
  "/api/external/(.*)",
  "/api/bill-manager/(.*)/pdf",
  "/auth/custom(.*)", 
  "/api/auth/(.*)",   
  "/api/invoice/(.*)", 
  "/api/phonepe/webhook", 
  "/api/update-token", // ✅ Naya Route add kiya hai taki Token block na ho
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/staff/login",
  "/api/staff/login",
  "/qr-menu",
  "/qr-menu/(.*)",
  "/"
]);
export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const staffToken = request.cookies.get("staff_token")?.value;
  const customToken = request.cookies.get("kravy_auth_token")?.value;
  const staffRefreshToken = request.cookies.get("staff_refresh_token")?.value;
  const customRefreshToken = request.cookies.get("kravy_refresh_token")?.value;

  // 1. Redirect to dashboard if already logged in (for auth pages)
  if ((userId || customToken || customRefreshToken) && request.nextUrl.pathname.startsWith('/auth/custom')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  if (userId && (request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  // 2. Allow access for Custom Auth Users
  if (customToken || customRefreshToken) {
    return NextResponse.next();
  }
  // 3. Allow access for Staff
  if (staffToken || staffRefreshToken) {
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
    } else {
       // If only refresh token exists, allow navigation so client fetch interceptor can refresh it
       return NextResponse.next();
    }
  }
  // 4. Allow Public Routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }
  // 5. If not authenticated and not a public route, redirect to CUSTOM auth page
  if (!isPublicRoute(request) && !userId && !customToken && !staffToken && !customRefreshToken && !staffRefreshToken) {
    const signInUrl = new URL('/auth/custom', request.url);
    // signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
