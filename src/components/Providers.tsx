"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import { SearchProvider } from "@/components/SearchContext";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SidebarProvider>
        <SearchProvider>
          {children}
        </SearchProvider>
      </SidebarProvider>
    </ClerkProvider>
  );
}
