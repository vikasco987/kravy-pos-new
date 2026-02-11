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

// // src/middleware.ts
// import { clerkMiddleware } from "@clerk/nextjs/server";

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     "/((?!_next|.*\\..*).*)",
//     "/api/(.*)"
//   ],
// };


// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ✅ Define route matchers
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isIgnoredRoute = createRouteMatcher(["/api/webhook", "/api/debug"]); // 👈 Added /api/debug

export default clerkMiddleware(async (auth, req) => {
  // ⏭ Skip Clerk completely for ignored routes
  if (isIgnoredRoute(req)) return;

  // ✅ Get session info
  const { userId } = await auth();

  // 🔒 If not signed in and route is not public → redirect to sign-in
  if (!isPublicRoute(req) && !userId) {
    return Response.redirect(new URL("/sign-in", req.url));
  }
});

// ✅ Required Clerk config
export const config = {
  matcher: [
    // Protect everything except static files, images, etc.
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};