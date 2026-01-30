// "use client";

// import { ReactNode } from "react";

// export default function ClientLayout({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const handleGlobalClick = () => {
//     if (typeof window !== "undefined") {
//       window.dispatchEvent(new CustomEvent("kravy-close-sidebar"));
//     }
//   };

//   return (
//     <div className="min-h-screen w-full" onClick={handleGlobalClick}>
//       {children}
//     </div>
//   );
// }

"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* STATIC NAVBAR */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* STATIC SIDEBAR */}
        <Sidebar />

        {/* ONLY THIS SCROLLS */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
