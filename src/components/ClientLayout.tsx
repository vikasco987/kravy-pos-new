"use client";

import { ReactNode, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";
import { useUser, RedirectToSignIn } from "@clerk/nextjs"; // Using useUser instead of SignedIn/SignedOut
import { OrderNotificationProvider } from "@/components/OrderNotificationProvider";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { collapsed } = useSidebar();
  const { isLoaded, isSignedIn } = useUser();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // 1. Check for Staff Token Cookie
    const staffToken = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('staff_token=')) : null;
    setIsStaffAuthenticated(Boolean(staffToken));

    // 2. Mobile Detection Logic
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

  // Show nothing while loading Clerk or checking Staff cookie
  if (!isLoaded || isStaffAuthenticated === null) {
    return null; 
  }

  // If NOT Clerk User AND NOT Staff User -> Redirect to Clerk login
  if (!isSignedIn && !isStaffAuthenticated) {
    return <RedirectToSignIn />;
  }

  // Staff Authorization Check (UI side)
  if (!isSignedIn && isStaffAuthenticated) {
    try {
        const staffToken = document.cookie.split('; ').find(row => row.startsWith('staff_token='))?.split('=')[1];
        if (staffToken) {
            const payload = JSON.parse(atob(staffToken.split('.')[1]));
            const permissions = payload.permissions || [];
            const path = window.location.pathname;
            
            if (path.startsWith('/dashboard')) {
                const isAllowed = permissions.some((p: string) => path === p || path.startsWith(p + '/'));
                if (!isAllowed) {
                    return (
                        <div className="h-screen flex items-center justify-center bg-slate-50">
                            <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Lock size={32} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Access Denied</h2>
                                <p className="text-slate-500 text-sm mt-2 mb-6">
                                    You don't have permission to access this module. Contact your manager.
                                </p>
                                <button 
                                    onClick={() => {
                                        document.cookie = "staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                                        window.location.href = "/staff/login";
                                    }}
                                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all"
                                >
                                    Log out & Try Again
                                </button>
                            </div>
                        </div>
                    );
                }
            }
        }
    } catch (e) {
        console.error("Staff permission check failed", e);
    }
  }

  // If either Clerk User or Staff User -> Show Dashboard
  return (
    <>
      {/* 🔔 Real-time order sound + popup notifications */}
      <OrderNotificationProvider />

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
            ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
            transition-transform duration-300 ease-in-out
            z-50
          `}>
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex flex-col flex-1 min-w-0">
            <Navbar
              isMobile={isMobile}
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
              sidebarOpen={sidebarOpen}
            />

            <main
              className="flex-1 overflow-y-auto transition-all duration-400"
              style={{
                background: "var(--kravy-bg)",
                minHeight: "calc(100vh - 72px)",
                transition: "background 0.4s ease"
              }}
            >
              <div
                className="w-full mx-auto p-4 sm:p-6 lg:p-8 kravy-page-fade"
                style={{ minHeight: "100%" }}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}