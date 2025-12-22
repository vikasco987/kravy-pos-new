"use client";

import { ReactNode } from "react";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const handleGlobalClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kravy-close-sidebar"));
    }
  };

  return (
    <div className="min-h-screen w-full" onClick={handleGlobalClick}>
      {children}
    </div>
  );
}
