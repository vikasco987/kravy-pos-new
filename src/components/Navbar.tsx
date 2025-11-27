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
















// components/Navbar.tsx
"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav
      className="h-16 fixed top-0 left-[250px] right-0 z-50 
                 flex items-center justify-between 
                 bg-gray-900 text-white px-6 shadow-md backdrop-blur"
    >
      {/* Left - Logo */}
      <div className="text-xl font-bold tracking-wide">
        <Link href="/">MyApp</Link>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* View Bills */}
        <Link
          href="/bills"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg 
                     hover:bg-indigo-700 transition shadow-sm"
        >
          View Bills
        </Link>

        {/* ⭐ New - Deleted Bills Button */}
        <Link
          href="/deleted-bills"
          className="px-4 py-2 bg-red-600 text-white rounded-lg 
                     hover:bg-red-700 transition shadow-sm"
        >
          Deleted Bills
        </Link>

        {!user && (
          <>
            <Link
              href="/sign-in"
              className="hover:underline text-gray-300"
            >
              Sign In
            </Link>

            <Link
              href="/sign-up"
              className="hover:underline text-gray-300"
            >
              Sign Up
            </Link>
          </>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user.fullName || user.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-xs text-gray-400">
                Role: {String(user?.publicMetadata?.role || "User")}
              </p>
            </div>

            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </nav>
  );
}
