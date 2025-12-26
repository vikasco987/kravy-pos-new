"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";


export default function SettingsPage() {
  const [role, setRole] = useState("");

useEffect(() => {
  fetch("/api/user/me")
    .then((r) => r.json())
    .then((d) => setRole(d?.role || ""));
}, []);

const isAdmin = role === "ADMIN";


  return (
    <div className="max-w-4xl p-6 mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Settings
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">

        {/* Profile */}
        <Link
          href="/settings/profile"
          className="block rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          <p className="font-medium">Profile</p>
          <p className="text-sm text-gray-500">
            View your account details
          </p>
        </Link>

        {/* Activity */}
        <Link
          href="/settings/activity"
          className="block rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          <p className="font-medium">Activity Log</p>
          <p className="text-sm text-gray-500">
            View your recent actions
          </p>
        </Link>

        {/* ADMIN: Staff Activity */}
        {isAdmin && (
          <Link
            href="/settings/activity/admin"
            className="block rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            <p className="font-medium">Staff Activity</p>
            <p className="text-sm text-gray-500">
              View staff login & actions
            </p>
          </Link>
        )}

        {/* Coming Soon */}
        <div className="rounded-lg border p-4 opacity-60">
          <p className="font-medium">Billing</p>
          <p className="text-sm text-gray-500">
            Coming soon
          </p>
        </div>

        <div className="rounded-lg border p-4 opacity-60">
          <p className="font-medium">Security</p>
          <p className="text-sm text-gray-500">
            Coming soon
          </p>
        </div>

      </div>
    </div>
  );
}
