

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./Sidebar.module.css";
import {
  FaHome,
  FaUpload,
  FaUtensils,
  FaReceipt,
  FaUsers,
  FaUser,
  FaCog,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();

  const [billingOpen, setBillingOpen] = useState(false);
  const [uploadsOpen, setUploadsOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const isAdmin = true;

  // Close dropdowns when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setBillingOpen(false);
      setUploadsOpen(false);
    }
  }, [collapsed]);

  // Click outside → collapse
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (!sidebarRef.current) return;

    const target = event.target as HTMLElement;

    const clickedInsideSidebar =
      sidebarRef.current.contains(target);

    const clickedInsideNavbar =
      target.closest("header") !== null;

    if (
      !collapsed &&
      !clickedInsideSidebar &&
      !clickedInsideNavbar
    ) {
      setCollapsed(true);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, [collapsed]);
  const toggleUploads = () => {
    if (collapsed) setCollapsed(false);

    setUploadsOpen((prev) => {
      if (!prev) setBillingOpen(false);
      return !prev;
    });
  };

  const toggleBilling = () => {
    if (collapsed) setCollapsed(false);

    setBillingOpen((prev) => {
      if (!prev) setUploadsOpen(false);
      return !prev;
    });
  };

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.item}>
            <FaHome />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <button
            className={`${styles.item} ${styles.dropdown}`}
            onClick={toggleUploads}
          >
            <div className={styles.dropdownLeft}>
              <FaUpload />
              {!collapsed && <span>Uploads</span>}
            </div>
            {!collapsed &&
              (uploadsOpen ? <FaChevronDown /> : <FaChevronRight />)}
          </button>

          {uploadsOpen && !collapsed && (
            <div className={styles.subMenu}>
              <Link href="/dashboard/menu/upload">Menu Upload</Link>
              {isAdmin && (
                <Link href="/dashboard/store-item-upload">
                  Store Items Uploading
                </Link>
              )}
            </div>
          )}

          <Link href="/dashboard/menu/view" className={styles.item}>
            <FaUtensils />
            {!collapsed && <span>Menu / Items</span>}
          </Link>

          <button
            className={`${styles.item} ${styles.dropdown}`}
            onClick={toggleBilling}
          >
            <div className={styles.dropdownLeft}>
              <FaReceipt />
              {!collapsed && <span>Billing</span>}
            </div>
            {!collapsed &&
              (billingOpen ? <FaChevronDown /> : <FaChevronRight />)}
          </button>

          {billingOpen && !collapsed && (
            <div className={styles.subMenu}>
              <Link href="/dashboard/billing">Bill Manager</Link>
              <Link href="/dashboard/billing/checkout">Checkout Page</Link>
              <Link href="/dashboard/billing/deleted">Deleted Bills</Link>
            </div>
          )}

          <Link href="/dashboard/parties" className={styles.item}>
            <FaUsers />
            {!collapsed && <span>Customers List</span>}
          </Link>

          <Link href="/dashboard/profile" className={styles.item}>
            <FaUser />
            {!collapsed && <span>Business Profile</span>}
          </Link>
        </nav>

        <div className={styles.bottom}>
          <Link href="/dashboard/settings" className={styles.item}>
            <FaCog />
            {!collapsed && <span>Settings</span>}
          </Link>

          {!collapsed && (
            <div className={styles.footer}>
              © Kravy Billing 2026
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}