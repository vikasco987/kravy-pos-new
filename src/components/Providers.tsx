"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { SidebarProvider } from "@/components/SidebarContext";
import { SearchProvider } from "@/components/SearchContext";
import ThemeProvider from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "@/components/ConfirmContext";
import FetchInterceptor from "@/components/FetchInterceptor";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <ConfirmProvider>
          <FetchInterceptor />
          <SidebarProvider>
            <SearchProvider>
              <Toaster position="top-right" />
              {children}
            </SearchProvider>
          </SidebarProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
