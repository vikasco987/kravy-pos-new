"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";


type Role = "USER" | "SELLER" | "ADMIN";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isDisabled: boolean;
  clerkId: string;
  createdAt: string;
};

const roleBadge: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-700",
  SELLER: "bg-blue-100 text-blue-700",
  USER: "bg-gray-100 text-gray-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // invite
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [inviting, setInviting] = useState(false);

  /* -------------------------
     FETCH USERS
  --------------------------*/
  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(setUsers)
      .catch(() => toast.error("Access denied"))
      .finally(() => setLoading(false));
  }, []);

  /* -------------------------
     INVITE USER
  --------------------------*/
  const inviteUser = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      setInviting(true);
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Invitation sent");
        setEmail("");
        setNewRole("USER");
      } else {
        toast.error(data?.error || "Invite failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setInviting(false);
    }
  };

  /* -------------------------
     ROLE CHANGE
  --------------------------*/
  const changeRole = async (userId: string, role: Role) => {
    try {
      setActionUserId(userId);

      const res = await fetch("/api/admin/users/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, role }),
      });

      if (res.ok) {
        toast.success("Role updated");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role } : u
          )
        );
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  /* -------------------------
     ENABLE / DISABLE
  --------------------------*/
  const toggleUser = async (u: User) => {
    try {
      setActionUserId(u.id);

      const res = await fetch("/api/admin/users/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: u.id,
          disable: !u.isDisabled,
        }),
      });

      if (res.ok) {
        toast.success(
          u.isDisabled ? "User enabled" : "User disabled"
        );

        setUsers((prev) =>
          prev.map((x) =>
            x.id === u.id
              ? { ...x, isDisabled: !x.isDisabled }
              : x
          )
        );
      } else {
        toast.error("Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading users…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-16 space-y-10">
      {/* HEADER */}
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold">User Management</h1>
    <p className="text-sm text-gray-500">
      Invite users, manage roles, enable or disable access
    </p>
  </div>

  {/* CREATE USER BUTTON */}
  <Link
    href="/admin/users/create"
    className="px-4 py-2 rounded-md bg-black text-white text-sm hover:opacity-90"
  >
    + Create New User
  </Link>
</div>


      {/* INVITE CARD */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="font-medium">Invite new user</h2>

        <div className="flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="user@email.com"
            className="border rounded-md px-3 py-2 w-64"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            className="border rounded-md px-3 py-2"
            value={newRole}
            onChange={(e) =>
              setNewRole(e.target.value as Role)
            }
          >
            <option value="USER">USER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button
            onClick={inviteUser}
            disabled={inviting}
            className="px-5 py-2 rounded-md bg-black text-white disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* USER */}
                <td className="p-4">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {u.name}
                  </button>
                  <div className="text-xs text-gray-500">
                    {u.email}
                  </div>
                </td>

                {/* ROLE */}
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${roleBadge[u.role]}`}
                    >
                      {u.role}
                    </span>

                    <select
                      disabled={u.isDisabled || actionUserId === u.id}
                      className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                      value={u.role}
                      onChange={(e) =>
                        changeRole(
                          u.id,
                          e.target.value as Role
                        )
                      }
                    >
                      <option value="USER">USER</option>
                      <option value="SELLER">SELLER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </td>

                {/* STATUS */}
                <td className="p-4 text-center">
                  {u.isDisabled ? (
                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                      Disabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                      Active
                    </span>
                  )}
                </td>

                {/* ACTION */}
                <td className="p-4 text-right">
                  <button
                    disabled={actionUserId === u.id}
                    onClick={() => toggleUser(u)}
                    className={`px-4 py-1.5 rounded-md text-sm text-white disabled:opacity-50 ${
                      u.isDisabled
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {actionUserId === u.id
                      ? "Please wait…"
                      : u.isDisabled
                      ? "Enable"
                      : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-6 text-gray-500 text-center">
            No users found
          </div>
        )}
      </div>

      {/* USER DETAIL POPUP – unchanged logic */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                User Details
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selectedUser.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="break-all">{selectedUser.email}</p>
              </div>

              <div className="rounded-md border bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">
                  Clerk User ID
                </p>

                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono break-all text-gray-800">
                    {selectedUser.clerkId}
                  </code>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedUser.clerkId
                      );
                      toast.success("Clerk ID copied");
                    }}
                    className="ml-auto text-xs px-2 py-1 border rounded hover:bg-white"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex gap-6">
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium">
                    {selectedUser.role}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium">
                    {selectedUser.isDisabled
                      ? "Disabled"
                      : "Active"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-500">Created At</p>
                <p>
                  {new Date(
                    selectedUser.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
