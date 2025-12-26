"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [copied, setCopied] = useState(false);
  const [dbRole, setDbRole] = useState<string>("");

  /* --------------------------------
     SYNC USER + ACTIVITY LOGGING
  ---------------------------------*/
 useEffect(() => {
  if (!user) return;

  const profileKey = "profile_view_logged";

  // 🔹 ALWAYS sync user & role from Clerk → DB
  fetch("/api/user/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: user.fullName || "User",
      email: user.primaryEmailAddress?.emailAddress,
    }),
  }).catch(() => {});

  // 🔹 PROFILE VIEW (once per session)
  if (!sessionStorage.getItem(profileKey)) {
    fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "PROFILE_VIEW",
        meta: "User opened profile page",
      }),
    }).then(() => {
      sessionStorage.setItem(profileKey, "true");
    });
  }

  // 🔹 REFRESH ROLE FROM DB
  fetch("/api/user/me")
    .then((res) => res.json())
    .then((data) => setDbRole(data?.role || ""))
    .catch(() => {});
}, [user]);

  /* --------------------------------
     STATES
  ---------------------------------*/
  if (!isLoaded) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-500">Not logged in</div>;
  }

  /* --------------------------------
     HELPERS
  ---------------------------------*/
  const copyClerkId = async () => {
    await navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/activity/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "LOGOUT",
        meta: "User logged out",
      }),
    }).catch(() => {});

    sessionStorage.clear();
    signOut();
  };

  const deleteAccount = async () => {
    const ok = confirm(
      "This will permanently delete your account. Continue?"
    );
    if (!ok) return;

    await user.delete();
  };

  /* --------------------------------
     UI
  ---------------------------------*/
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-center sm:text-left">
          Profile
        </h1>

        <div className="flex justify-center sm:justify-end">
          <Link
            href="/settings/profile/edit"
            className="border rounded-md px-5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={user.imageUrl}
            alt="profile"
            className="h-24 w-24 rounded-full border"
          />

          <div className="text-center sm:text-left">
            <p className="text-xl font-medium">{user.fullName}</p>
            <p className="text-sm text-gray-500 break-all">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p className="text-gray-500">First Name</p>
            <p className="font-medium">{user.firstName || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500">Last Name</p>
            <p className="font-medium">{user.lastName || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500">Role</p>
            <p className="font-medium">
              {dbRole || "—"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Account Created</p>
            <p className="font-medium">
              {new Date(user.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* SECURITY CARD */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">
          Security & Identifiers
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Clerk User ID</p>
            <p className="font-mono text-sm break-all">{user.id}</p>
          </div>

          <button
            onClick={copyClerkId}
            className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            {copied ? "Copied" : "Copy ID"}
          </button>
        </div>
      </div>

      {/* ACTIONS CARD */}
      <div className="border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg text-red-600">
          Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleLogout}
            className="border px-4 py-2 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Logout
          </button>

          <button
            onClick={deleteAccount}
            className="border border-red-500 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-50"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
