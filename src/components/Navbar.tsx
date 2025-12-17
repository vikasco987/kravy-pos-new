// // components/Navbar.tsx
// "use client";

// import Link from "next/link";
// import { UserButton, useUser } from "@clerk/nextjs";

// export default function Navbar() {
//   const { user } = useUser();

//   return (
//     <nav className="flex items-center justify-between bg-gray-900 text-white px-6 py-4 shadow-md">
//       {/* Left Side - Logo */}
//       <div className="text-xl font-bold">
//         <Link href="/">MyApp</Link>
//       </div>

//       {/* Right Side */}
//       <div className="flex items-center gap-4">
//         {!user && (
//           <>
//             <Link href="/sign-in" className="hover:underline">
//               Sign In
//             </Link>
//             <Link href="/sign-up" className="hover:underline">
//               Sign Up
//             </Link>
//           </>
//         )}

//         {user && (
//           <div className="flex items-center gap-3">
//             <span>
//               {user.fullName || user.primaryEmailAddress?.emailAddress}
//             </span>
//             <span className="text-sm text-gray-400">
//               Role: {user.publicMetadata.role || "User"}
//             </span>
//             <UserButton afterSignOutUrl="/" />
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }













// // components/Navbar.tsx
// "use client";

// import Link from "next/link";
// import { UserButton, useUser } from "@clerk/nextjs";

// export default function Navbar() {
//   const { user } = useUser();

//   return (
//     <nav className="flex items-center justify-between bg-gray-900 text-white px-6 py-4 shadow-md">
//       {/* Left Side - Logo */}
//       <div className="text-xl font-bold">
//         <Link href="/">MyApp</Link>
//       </div>

//       {/* Right Side */}
//       <div className="flex items-center gap-4">
//         {!user && (
//           <>
//             <Link href="/sign-in" className="hover:underline">
//               Sign In
//             </Link>
//             <Link href="/sign-up" className="hover:underline">
//               Sign Up
//             </Link>
//           </>
//         )}

//         {user && (
//           <div className="flex items-center gap-3">
//             <span>
//               {user.fullName || user.primaryEmailAddress?.emailAddress}
//             </span>
//             <span className="text-sm text-gray-400">
//               Role: {String(user?.publicMetadata?.role || "User")}
//             </span>
//             <UserButton afterSignOutUrl="/" />
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }





"use client";

import React from "react";
import styles from "./Navbar.module.css";
import { useSidebar } from "./SidebarContext";

// Clerk
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/nextjs";

export default function Navbar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>

        {/* LEFT — collapse button + brand */}
        <div className={styles.left}>
          <button
            className={styles.collapseBtn}
            onClick={toggle}
            aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
            title={collapsed ? "Open sidebar" : "Close sidebar"}
          >
            {collapsed ? "☰" : "⟨"}
          </button>

          <div className={styles.brand}>
            <span className={styles.logo}>Kravy</span>
            <span className={styles.brandText}>Billing</span>
          </div>
        </div>

        {/* CENTER — your existing nav links */}
        <div className={styles.center}>
          <nav className={styles.nav}>
            <a className={styles.link} href="/">Home</a>
            <a className={styles.link} href="/billing">Billing</a>
            <a className={styles.link} href="/invoices">Invoices</a>
          </nav>
        </div>

        {/* RIGHT — search + Clerk buttons */}
        <div className={styles.right}>
          <input className={styles.search} placeholder="Search..." aria-label="Search" />

          {/* When signed in -> show avatar */}
          <SignedIn>
            <UserButton afterSignOutUrl="/"/>
          </SignedIn>

          {/* When signed out -> show Sign In button */}
          <SignedOut>
            <SignInButton>
              <button className={styles.signinBtn}>Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>

      </div>
    </header>
  );
}
