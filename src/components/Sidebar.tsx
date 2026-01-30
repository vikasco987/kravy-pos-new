"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Sidebar.module.css";
import {
  FaHome,
  FaUpload,
  FaUtensils,
  FaBoxes,
  FaReceipt,
  FaUsers,
  FaUser,
  FaCog,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { useSidebar } from "./SidebarContext";

export default function Sidebar() {
  const { collapsed } = useSidebar();
  const [billingOpen, setBillingOpen] = useState(false);

  const isAdmin = true;

  return (
    <aside
      className={`${styles.sidebar} ${
        collapsed ? styles.collapsed : ""
      }`}
    >
      <div className={styles.inner}>

        <nav className={styles.nav}>
          <Link
            href="/"
            className={styles.item}
            data-label="Dashboard"
          >
            <FaHome />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/menu/upload"
            className={styles.item}
            data-label="Uploads"
          >
            <FaUpload />
            <span>Uploads</span>
          </Link>

          <Link
            href="/menu/view"
            className={styles.item}
            data-label="Menu / Items"
          >
            <FaUtensils />
            <span>Menu / Items</span>
          </Link>



          {/* BILLING */}
          <button
            className={`${styles.item} ${styles.dropdown}`}
            data-label="Billing"
            onClick={() => setBillingOpen((p) => !p)}
          >
            <div className={styles.dropdownLeft}>
              <FaReceipt />
              <span>Billing</span>
            </div>
          </button>

          {billingOpen && (
            <div className={styles.subMenu}>
              <Link href="/billing">Bill Manager</Link>
              <Link href="/billing/checkout">Checkout Page</Link>
              <Link href="/billing/deleted">Deleted Bills</Link>
            </div>
          )}
        {isAdmin && (
          <Link href="/store-item-upload" className={styles.item}> 
          <FaBoxes /> <span>Store Items Uploading</span> </Link> )}
          
          <Link href="/parties" className={styles.item}>
            <FaUsers />
            <span>Parties</span>
          </Link>

          <Link href="/profile" className={styles.item}>
            <FaUser />
            <span>Business Profile</span>
          </Link>
        </nav>

        <div className={styles.bottom}>
          <Link href="/settings" className={styles.item}>
            <FaCog />
            <span>Settings</span>
          </Link>

          <div className={styles.footer}>© Kravy Billing 2025</div>
        </div>
      </div>
    </aside>
  );
}
