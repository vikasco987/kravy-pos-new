// // import { NextRequest, NextResponse } from "next/server";

// // // MUST BE NAMED "proxy"
// // export function proxy(req: NextRequest) {
// //   const url = req.nextUrl.clone();

// //   // Proxy API routes → Backend
// //   if (url.pathname.startsWith("/api/")) {
// //     url.hostname = "localhost";
// //     url.port = "3000"; // backend port
// //     url.protocol = "http";
// //     return NextResponse.rewrite(url);
// //   }

// //   return NextResponse.next();
// // }

// // // REQUIRED
// // export const config = {
// //   matcher: ["/api/:path*"],
// // };

// // #2nd last working version ---------------------------------------------------------------------------------


// // src/proxy.ts
// import type { NextFetchEvent } from "next/server";
// import { NextRequest, NextResponse } from "next/server";
// import { clerkMiddleware } from "@clerk/nextjs/server";

// /**
//  * Minimal wrapper to run clerkMiddleware() for matching requests,
//  * then forward to your backend (if configured).
//  *
//  * Notes:
//  * - This avoids requiring a separate src/middleware.ts file (so no conflict).
//  * - We apply clerkMiddleware for API and app routes so server helpers work.
//  * - If you already had complex proxy logic, you can extend this.
//  */

// const clerkMw = clerkMiddleware();

// // Exported function name must be default or 'proxy' depending on Next version.
// // We'll export default function which Next expects for proxy files.
// export default async function proxy(req: NextRequest, ev: NextFetchEvent) {
//   // Run Clerk middleware first so Clerk can detect middleware usage.
//   // clerkMiddleware is a middleware factory; calling it as below ensures it runs.
//   // NOTE: clerkMiddleware expects a NextRequest-like object; this pattern runs it.
//   // If clerkMiddleware returns a Response, return it immediately.
//   let middlewareResp = await (async () => {
//     try {
//       // Call clerk middleware and capture return (it sometimes returns Response)
//       // @ts-ignore - clerkMiddleware returns a function compatible with middleware.
//       const mwResult = await clerkMw(req, ev);
//       return mwResult;
//     } catch (e) {
//       // continue — we still want to proxy
//       return undefined;
//     }
//   })();

//   if (middlewareResp instanceof Response) {
//     // Clerk middleware produced a response (redirect/401 etc.) — return it.
//     return middlewareResp;
//   }

//   // --- Proxy behavior ---
//   // If you use NEXT_PUBLIC_BACKEND_URL, forward requests there.
//   const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || null;

//   // If no backend configured, just continue with normal Next handling.
//   if (!backend) {
//     return NextResponse.next();
//   }

//   // Build forward URL
//   const url = new URL(req.url);
//   const backendUrl = new URL(backend);
//   backendUrl.pathname = url.pathname;
//   backendUrl.search = url.search;

//   // Forward method, headers, body
//   const headers: Record<string, string> = {};
//   req.headers.forEach((v, k) => {
//     // skip host header to avoid host mismatch
//     if (k.toLowerCase() === "host") return;
//     headers[k] = v;
//   });

//   // Keep cookies so Clerk state/cookies travel to backend if needed
//   if (req.headers.get("cookie")) headers["cookie"] = req.headers.get("cookie")!;

//   // perform fetch to backend
//   const forwardResp = await fetch(backendUrl.toString(), {
//     method: req.method,
//     headers,
//     body: req.body ?? undefined,
//     redirect: "manual",
//   });

//   // Build NextResponse from forwarded response
//   const resHeaders = new Headers(forwardResp.headers);
//   // strip hop-by-hop headers if needed (optional)
//   resHeaders.delete("transfer-encoding");

//   const arrayBuffer = await forwardResp.arrayBuffer();
//   return new NextResponse(arrayBuffer, {
//     status: forwardResp.status,
//     headers: resHeaders,
//   });
// }

// // optional config — run for all routes (customize to your needs)
// export const config = {
//   matcher: ["/api/:path*", "/menu/:path*", "/menu", "/billing/:path*", "/parties/:path*"],
// };

// // # Last working version ---------------------------------------------------------------------------------


// src/proxy.ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// ✅ matcher must be exported separately
export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // app pages
    "/api/:path*",            // api routes
  ],
};
