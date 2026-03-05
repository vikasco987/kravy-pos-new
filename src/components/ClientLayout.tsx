"use client";

import { ReactNode, useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>

      <SignedIn>
        <div
          className="h-screen flex flex-col overflow-hidden relative"
          style={{ background: "var(--kravy-bg)", transition: "background 0.4s ease" }}
        >
          {/* Mobile Sidebar Overlay */}
          {isMobile && sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar */}
            <div className={`
              ${isMobile ? 'fixed' : 'relative'} 
              ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
              transition-transform duration-300 ease-in-out
              z-50 lg:z-auto
            `}>
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
              <Navbar
                isMobile={isMobile}
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />

              <main
                className="flex-1 overflow-y-auto transition-all duration-400"
                style={{
                  marginLeft: isMobile ? 0 : (collapsed ? "72px" : "260px"),
                  background: "var(--kravy-bg)",
                  minHeight: "calc(100vh - 72px)",
                  transition: "margin-left 0.4s cubic-bezier(.4,0,.2,1), background 0.4s ease"
                }}
              >
                <div
                  className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 kravy-page-fade"
                  style={{ minHeight: "100%" }}
                >
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}