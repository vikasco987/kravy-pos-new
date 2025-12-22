"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SidebarProvider>
        <Navbar />
        <Sidebar />
        <div id="page-root">{children}</div>
      </SidebarProvider>
    </ClerkProvider>
  );
}
