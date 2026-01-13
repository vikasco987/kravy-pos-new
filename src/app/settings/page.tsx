"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => setRole(data.role))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl p-26 space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* PROFILE */}
        <Link
          href="/settings/profile"
          className="border rounded-lg p-4 hover:bg-gray-50"
        >
          <p className="font-medium">Profile</p>
          <p className="text-sm text-gray-500">
            View your account details
          </p>
        </Link>

        {/* ACTIVITY */}
        <Link
          href="/settings/activity"
          className="border rounded-lg p-4 hover:bg-gray-50"
        >
          <p className="font-medium">Activity Log</p>
          <p className="text-sm text-gray-500">
            View recent actions
          </p>
        </Link>

        {/* 🔐 ADMIN ONLY */}
        {role === "ADMIN" && (
          <>
            <Link
              href="/admin/users"
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <p className="font-medium">User Management</p>
              <p className="text-sm text-gray-500">
                Manage users and roles
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <p className="font-medium">Reports</p>
              <p className="text-sm text-gray-500">
                Sales and system reports
              </p>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
