import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// We can implement a simple custom route matcher matching clerk's createRouteMatcher
function createRouteMatcher(routes: string[]) {
  return (req: NextRequest) => {
    return routes.some((route) => {
      const regexStr = route.replace(/\(\.\*\)/g, '.*');
      const regex = new RegExp(`^${regexStr}$`);
      return regex.test(req.nextUrl.pathname);
    });
  };
}

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
  "/qr/(.*)",
  "/"
]);

export async function middleware(request: NextRequest) { return NextResponse.next(); }

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
