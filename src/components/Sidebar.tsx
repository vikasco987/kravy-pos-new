

// //src/components/Sidebar.tsx

// "use client";

// import React from "react";
// import Link from "next/link";
// import styles from "./Sidebar.module.css";
// import {
//   FaHome,
//   FaUpload,
//   FaUtensils,
//   FaUsers,
//   FaReceipt,
//   FaUser,
//   FaCog,
// } from "react-icons/fa";
// import { useSidebar } from "./SidebarContext";

// export default function Sidebar() {
//   const { collapsed, setCollapsed } = useSidebar();

//   // close handler for backdrop / mobile
//   const close = () => setCollapsed(true);

//   // collapse helper used on nav clicks
//   const handleNavClick = () => {
//     // collapse immediately
//     setCollapsed(true);
//   };

//   return (
//     <>
//       <aside
//         className={`${styles.sidebar} ${collapsed ? styles.collapsed : styles.expanded}`}
//         aria-hidden={collapsed}
//       >
//         <div className={styles.inner}>
//           <nav className={styles.nav} aria-label="Main">
//             <Link href="/" className={styles.item} onClick={handleNavClick}>
//               <FaHome className={styles.icon} />
//               <span className={styles.label}>Home</span>
//             </Link>

//             <Link href="/menu/upload" className={styles.item} onClick={handleNavClick}>
//               <FaUpload className={styles.icon} />
//               <span className={styles.label}>Uploads</span>
//             </Link>

//             <Link href="/menu/view" className={styles.item} onClick={handleNavClick}>
//               <FaUtensils className={styles.icon} />
//               <span className={styles.label}>Menu / Items</span>
//             </Link>

//             <Link href="/billing" className={styles.item} onClick={handleNavClick}>
//              <FaReceipt className={styles.icon} />
//                <span className={styles.label}>Billing</span>
//             </Link>


//             {/* ✅ FIXED: correct lowercase path */}
//             <Link href="/parties" className={styles.item} onClick={handleNavClick}>
//               <FaUsers className={styles.icon} />
//               <span className={styles.label}>Parties</span>
//             </Link>

//             {/* ✅ FIXED lowercase */}
//             <Link href="/bills" className={styles.item} onClick={handleNavClick}>
//               <FaReceipt className={styles.icon} />
//               <span className={styles.label}>Bills</span>
//             </Link>


//             <Link href="/profile" className={styles.item} onClick={handleNavClick}>
//   <FaUser className={styles.icon} />
//   <span className={styles.label}>Business Profile</span>
// </Link>



//           </nav>

//           {/* bottom actions: settings + copyright */}
//           <div className={styles.bottomActions}>
//             <Link href="/settings" className={styles.settings} onClick={handleNavClick}>
//               <FaCog className={styles.icon} />
//               <span className={styles.label}>Settings</span>
//             </Link>

//             <div className={styles.footer}>© Kravy Billing 2025</div>
//           </div>
//         </div>
//       </aside>

//       {/* Backdrop for mobile overlay */}
//       <div
//         role="button"
//         aria-label="Close sidebar"
//         className={styles.backdrop}
//         onClick={close}
//       />
//     </>
//   );
// }



//last working version ---------------------------------------------------------------------------------



"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import styles from "./Sidebar.module.css";
import {
  FaHome,
  FaUpload,
  FaUtensils,
  FaUsers,
  FaReceipt,
  FaUser,
  FaCog,
  FaBoxes,
} from "react-icons/fa";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();

  /** Close sidebar safely */
  const closeSidebar = () => setCollapsed(true);

  /** Close on any navigation click */
  const handleNavClick = () => {
    setCollapsed(true);
  };

  /**
   * 🔹 Global click listener
   * Fired from ClientLayout (tap anywhere)
   * UI-only, no backend impact
   */
  useEffect(() => {
    const handleGlobalClose = () => setCollapsed(true);
    window.addEventListener("kravy-close-sidebar", handleGlobalClose);
    return () =>
      window.removeEventListener("kravy-close-sidebar", handleGlobalClose);
  }, [setCollapsed]);

  /**
   * 🔐 Admin-only logic placeholder
   * Can be replaced later with real auth
   */
  const isAdmin = true;

  return (
    <>
      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          collapsed ? styles.collapsed : styles.expanded
        }`}
        aria-hidden={collapsed}
      >
        <div className={styles.inner}>
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" className={styles.item} onClick={handleNavClick}>
              <FaHome className={styles.icon} />
              <span className={styles.label}>Home</span>
            </Link>

            <Link
              href="/menu/upload"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaUpload className={styles.icon} />
              <span className={styles.label}>Uploads</span>
            </Link>

            <Link
              href="/menu/view"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaUtensils className={styles.icon} />
              <span className={styles.label}>Menu / Items</span>
            </Link>

            {isAdmin && (
              <Link
                href="/store-item-upload"
                className={styles.item}
                onClick={handleNavClick}
              >
                <FaBoxes className={styles.icon} />
                <span className={styles.label}>Store Item Uploading</span>
              </Link>
            )}

            <Link
              href="/billing"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaReceipt className={styles.icon} />
              <span className={styles.label}>Billing</span>
            </Link>

            <Link
              href="/parties"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaUsers className={styles.icon} />
              <span className={styles.label}>Parties</span>
            </Link>

            <Link
              href="/bills"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaReceipt className={styles.icon} />
              <span className={styles.label}>Bills</span>
            </Link>

            <Link
              href="/profile"
              className={styles.item}
              onClick={handleNavClick}
            >
              <FaUser className={styles.icon} />
              <span className={styles.label}>Business Profile</span>
            </Link>
          </nav>

          {/* BOTTOM */}
          <div className={styles.bottomActions}>
            <Link
              href="/settings"
              className={styles.settings}
              onClick={handleNavClick}
            >
              <FaCog className={styles.icon} />
              <span className={styles.label}>Settings</span>
            </Link>

            <div className={styles.footer}>© Kravy Billing 2025</div>
          </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {!collapsed && (
        <div
          className={styles.backdrop}
          role="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
        />
      )}
    </>
  );
}
