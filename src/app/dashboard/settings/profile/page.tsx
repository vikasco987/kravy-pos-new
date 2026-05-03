"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useAuthContext } from "@/components/AuthContext";
import Link from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { user: customUser, loading: customLoading, refresh: refreshAuth } = useAuthContext();

  const [copied, setCopied] = useState(false);
  const [dbRole, setDbRole] = useState<string>("");

  // Determine effective user
  const user = customUser || clerkUser;
  const isLoaded = !clerkLoaded ? false : !customLoading;

  /* --------------------------------
     SYNC USER + ACTIVITY LOGGING
  ---------------------------------*/
 useEffect(() => {
  if (!user) return;

  const profileKey = "profile_view_logged";

  // 🔹 Only sync if it's a Clerk user (Legacy)
  if (clerkUser) {
    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: clerkUser.fullName || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress,
      }),
    }).catch(() => {});
  }

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
}, [user, clerkUser]);

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
  const copyId = async () => {
    const idToCopy = (user as any).id;
    await navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
        await fetch("/api/activity/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "LOGOUT",
            meta: "User logged out",
          }),
        }).catch(() => {});

        // 1. Clear Custom Token (if exists) via an API or manual cookie clear
        document.cookie = "kravy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        
        // 2. Clear Clerk Session (if exists)
        if (clerkUser) {
           await clerkSignOut();
        }

        sessionStorage.clear();
        toast.success("Logged out successfully");
        router.push("/");
        router.refresh();
    } catch (err) {
        toast.error("Logout failed");
    }
  };

  const deleteAccount = async () => {
    if (customUser) {
        toast.error("Custom accounts cannot be deleted from here yet. Contact support.");
        return;
    }
    const ok = confirm(
      "This will permanently delete your account. Continue?"
    );
    if (!ok) return;

    if (clerkUser) await clerkUser.delete();
  };

  /* --------------------------------
     UI
  ---------------------------------*/
  const name = (user as any).name || (user as any).fullName || "User";
  const email = (user as any).email || (clerkUser?.primaryEmailAddress?.emailAddress) || "No email";
  const avatar = (clerkUser as any)?.imageUrl || "https://avatar.iran.liara.run/public/38";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-center sm:text-left">
          Profile Settings
        </h1>

        <div className="flex justify-center sm:justify-end">
          <button
            onClick={() => toast.info("Profile editing coming soon to custom dashboard")}
            className="border rounded-md px-5 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="border rounded-xl p-6 bg-[var(--kravy-surface)]">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src={avatar}
            alt="profile"
            className="h-24 w-24 rounded-full border shadow-sm"
          />

          <div className="text-center sm:text-left">
            <p className="text-xl font-bold">{name}</p>
            <p className="text-sm text-gray-500 break-all font-medium">
              {email}
            </p>
            {customUser && <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded-md tracking-wider">Custom Auth</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-sm">
          <div>
            <p className="text-gray-500 font-medium mb-0.5">Name</p>
            <p className="font-bold">{(user as any).name || (user as any).firstName || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500 font-medium mb-0.5">Role</p>
            <p className="font-bold text-indigo-600">
              {dbRole || "—"}
            </p>
          </div>

          <div>
            <p className="text-gray-500 font-medium mb-0.5">Business ID</p>
            <p className="font-mono text-xs opacity-70">{(user as any).businessId || "—"}</p>
          </div>

          <div>
            <p className="text-gray-500 font-medium mb-0.5">Account Status</p>
            <p className="font-bold text-emerald-600 flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified
            </p>
          </div>
        </div>
      </div>

      {/* SECURITY CARD */}
      <div className="border rounded-xl p-6 space-y-4 bg-[var(--kravy-surface)]">
        <h2 className="font-bold text-lg flex items-center gap-2">
          Security & Identifiers
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">Unique Identifier (UID)</p>
            <p className="font-mono text-[11px] break-all opacity-60">{(user as any).id}</p>
          </div>

          <button
            onClick={copyId}
            className="border px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
          >
            {copied ? "Copied" : "Copy UID"}
          </button>
        </div>
      </div>

      {/* ACTIONS CARD */}
      <div className="border rounded-xl p-6 space-y-4 bg-[var(--kravy-surface)]">
        <h2 className="font-bold text-lg text-rose-600 flex items-center gap-2">
          Account Actions
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 border px-4 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            Logout Securely
          </button>

          <button
            onClick={deleteAccount}
            className="flex-1 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
