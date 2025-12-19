// // // src/app/layout.tsx
// // import ResponsiveHeader from "@/components/ResponsiveHeader";
// // import Sidebar from "@/components/Sidebar";
// // import { ClerkProvider } from "@clerk/nextjs";
// // import type { Metadata } from "next";
// // import { Geist, Geist_Mono } from "next/font/google";
// // import "./globals.css";

// // const geistSans = Geist({
// //   variable: "--font-geist-sans",
// //   subsets: ["latin"],
// // });

// // const geistMono = Geist_Mono({
// //   variable: "--font-geist-mono",
// //   subsets: ["latin"],
// // });

// // export const metadata: Metadata = {
// //   title: "My App",
// //   description: "Using Clerk for authentication",
// // };

// // export default function RootLayout({
// //   children,
// // }: Readonly<{ children: React.ReactNode }>) {
// //   return (
// //     <ClerkProvider>
// //       <html lang="en">
// //         <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-slate-900 dark:text-slate-100`}>
// //           {/* Fixed header */}
// //           <ResponsiveHeader />

// //           {/* Page body: reserve space for header (h-16) */}
// //           <div className="pt-16 min-h-[calc(100vh-4rem)]">
// //             <div className="flex h-full">
// //               {/* Sidebar (desktop): sits below header */}
// //               <aside className="hidden md:block">
// //                 <Sidebar />
// //               </aside>

// //               {/* Main area */}
// //               <main className="flex-1 overflow-y-auto">
// //                 {children}
// //               </main>
// //             </div>
// //           </div>
// //         </body>
// //       </html>
// //     </ClerkProvider>
// //   );
// // }

// // last wokring version above 




// // app/layout.tsx
// "use client";
// import React from "react";
// import type { ReactNode } from "react";
// import { SidebarProvider } from "@/components/SidebarContext";
// import Navbar from "@/components/Navbar";
// import Sidebar from "@/components/Sidebar";
// import "./globals.css";

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <head />
//       <body style={{ margin: 0, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial" }}>
//         <SidebarProvider>
//           <Navbar />
//           <Sidebar />
//           {/* pages render after navbar+sidebar; page should set margin-left based on expanded state */}
//           <div id="page-root">{children}</div>
//         </SidebarProvider>
//       </body>
//     </html>
//   );
// }







// app/layout.tsx
"use client";

import React from "react";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body
          style={{
            margin: 0,
            fontFamily:
              "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
          }}
        >
          <SidebarProvider>
            {/* Fixed Header */}
            <Navbar />

            {/* Sidebar (below navbar) */}
            <Sidebar />

            {/* Page Content */}
            <div id="page-root">{children}</div>
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
