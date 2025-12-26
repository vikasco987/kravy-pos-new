"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  action: string;
  meta?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

export default function AdminActivityPage() {
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity/admin")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">
        Staff Activity
      </h1>

      <div className="border rounded-xl overflow-hidden">
        {data.length === 0 && (
          <p className="p-6 text-gray-500 text-center">
            No activity found
          </p>
        )}

        {data.map((a) => (
          <div
            key={a.id}
            className="flex gap-4 p-4 border-b last:border-b-0"
          >
            <div className="text-xl">
              {a.action === "LOGIN" && "🟢"}
              {a.action === "LOGOUT" && "🔴"}
              {a.action === "PROFILE_VIEW" && "👤"}
              {!["LOGIN","LOGOUT","PROFILE_VIEW"].includes(a.action) && "📌"}
            </div>

            <div className="flex-1">
              <p className="font-medium">
                {a.action}
              </p>

              <p className="text-sm text-gray-600">
                {a.user.name} — {a.user.email}
              </p>

              {a.meta && (
                <p className="text-sm text-gray-500">
                  {a.meta}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
