"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <>
      {/* If NOT signed in → redirect to sign in */}
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      {/* If signed in → show dashboard layout */}
      <SignedIn>
        <div className="h-screen flex flex-col overflow-hidden">
          <Navbar />

          <div className="flex flex-1 overflow-hidden">
            <Sidebar />

            <main
              className="flex-1 overflow-y-auto bg-gray-50 p-6 transition-all duration-300"
              style={{
                marginLeft: collapsed ? "70px" : "240px",
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  );
}