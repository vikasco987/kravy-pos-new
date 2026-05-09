"use client";

import { ReactNode, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { OrderNotificationProvider } from "@/components/OrderNotificationProvider";
import { useAuthContext } from "@/components/AuthContext";
import { Lock, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { collapsed } = useSidebar();
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { user: authUser, loading: authLoading } = useAuthContext();
  const pathname = usePathname();
  const isTerminal = pathname === "/dashboard/terminal";
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Show loader while anything is still loading
  if (!mounted || !clerkLoaded || authLoading) {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
    );
  }

  // 2. If NOT Clerk User AND NOT Staff User -> Redirect to Clerk login
  if (!isSignedIn && !authUser) {
    return <RedirectToSignIn />;
  }

  // 3. Staff Authorization Check
  if (!isSignedIn && authUser) {
    const permissions = authUser.permissions || [];
    
    if (pathname.startsWith('/dashboard')) {
        const isAllowed = permissions.includes("*") || permissions.some((p: string) => pathname === p || pathname.startsWith(p + '/'));
        
        // Exclude base dashboard from blocking if they have any access
        const hasAnyAccess = permissions.length > 0;
        const isBaseDashboard = pathname === "/dashboard";

        if (!isAllowed && !(isBaseDashboard && hasAnyAccess)) {
            return (
                <div className="h-screen flex items-center justify-center bg-slate-50">
                    <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-xl font-black text-slate-800">Access Denied</h2>
                        <p className="text-slate-500 text-sm mt-2 mb-6">
                            You don't have permission to access this module ({pathname}). Contact your manager.
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
          {!isTerminal && (
            <div className={`
              ${isMobile ? 'fixed' : 'relative'}
              ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
              transition-transform duration-300 ease-in-out
              z-50
            `}>
              <Sidebar />
            </div>
          )}

          {/* Main Content */}
          <div className="flex flex-col flex-1 min-w-0">
            {!isTerminal && (
              <Navbar
                isMobile={isMobile}
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />
            )}

            <main
              className={`flex-1 ${isTerminal ? 'overflow-hidden' : 'overflow-y-auto'} transition-all duration-400`}
              style={{
                background: "var(--kravy-bg)",
                minHeight: isTerminal ? "100vh" : "calc(100vh - 72px)",
                transition: "background 0.4s ease"
              }}
            >
              <div
                className={`w-full mx-auto ${isTerminal ? 'p-0 h-full' : 'p-4 sm:p-6 lg:p-8 kravy-page-fade'}`}
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