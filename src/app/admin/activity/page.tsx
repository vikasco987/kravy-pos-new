"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type Log = {
  id: string;
  action: string;
  meta?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const lastTimeRef = useRef<string | null>(null);

  const fetchLogs = async () => {
    const url = lastTimeRef.current
      ? `/api/admin/activity?since=${lastTimeRef.current}`
      : "/api/admin/activity";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Forbidden");

    const data: Log[] = await res.json();

    if (data.length > 0) {
      lastTimeRef.current = data[0].createdAt;
      setLogs((prev) => [...data, ...prev]);
    }
  };

  /* initial load */
  useEffect(() => {
    fetchLogs()
      .catch(() => toast.error("Access denied"))
      .finally(() => setLoading(false));
  }, []);

  /* 🔁 realtime polling */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs().catch(() => {});
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="p-6">Loading activity logs...</div>;
  }

  return (
    <div className="max-w-6xl p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Activity Logs (Live)
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        Auto-refreshes every 5 seconds
      </p>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Details</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((l, i) => (
              <tr
                key={l.id}
                className={`border-t ${
                  i < 3 ? "bg-green-50" : ""
                }`}
              >
                <td className="p-3">
                  <div className="font-medium">{l.user.name}</div>
                  <div className="text-xs text-gray-500">
                    {l.user.email} ({l.user.role})
                  </div>
                </td>

                <td className="p-3 font-medium">{l.action}</td>

                <td className="p-3 text-gray-600">
                  {l.meta || "—"}
                </td>

                <td className="p-3">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <p className="p-4 text-gray-500">
            No activity found
          </p>
        )}
      </div>
    </div>
  );
}
