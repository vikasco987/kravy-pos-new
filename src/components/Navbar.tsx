"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Navbar.module.css";
import { useSidebar } from "./SidebarContext";  
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/nextjs";
import { useSearch } from "@/components/SearchContext";


export default function Navbar() {
  const [role, setRole] = useState("");
  const [adminOpen, setAdminOpen] = useState(false);
  const { query, setQuery } = useSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { collapsed, toggle } = useSidebar();  
  const toggleBtnRef = useRef<HTMLButtonElement>(null);


  /* Fetch role */
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.role && setRole(d.role))
      .catch(() => {});
  }, []);

  /* Close admin dropdown */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Search handler (REAL, usable) */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    window.dispatchEvent(
      new CustomEvent("kravy-search", {
        detail: query.trim(),
      })
    );

    setQuery("");
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* LEFT */}
        <div className={styles.left}>
        <button
          ref={toggleBtnRef}
          className={styles.collapseBtn}
          onClick={toggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "☰" : "⟨"}
        </button>

        <span className={styles.brand}>Kravy Billing</span>
      </div>

        {/* CENTER */}
        <nav className={styles.center}>
          <a href="/billing">Billing</a>
          <a href="/invoices">Invoices</a>

          {role === "ADMIN" && (
            <div className={styles.admin} ref={dropdownRef}>
              <button
                className={styles.adminBtn}
                onClick={() => setAdminOpen((p) => !p)}
              >
                Admin ▾
              </button>

              {adminOpen && (
                <div className={styles.adminDropdown}>
                  <a href="/admin/users">Users</a>
                  <a href="/admin/reports">Reports</a>
                  <a href="/admin/activity">Activity Logs</a>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* RIGHT */}
        <div className={styles.right}>
          <form onSubmit={handleSearch}>
            <input
              className={styles.search}
              placeholder="Search bills, invoices, parties…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

          </form>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <button className={styles.signin}>Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
