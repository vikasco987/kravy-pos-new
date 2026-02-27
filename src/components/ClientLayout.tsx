"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useSidebar } from "@/components/SidebarContext";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* NAVBAR */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTENT AREA */}
        <main
          className="flex-1 overflow-y-auto bg-gray-50 p-6 transition-all duration-300"
          style={{
            marginLeft: collapsed ? "70px" : "240px",
            marginTop: "2px", // navbar height
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}