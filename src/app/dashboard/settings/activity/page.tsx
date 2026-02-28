"use client";

import { useEffect, useState } from "react";

type Activity = {
  id: string;
  action: string;
  meta?: string;
  createdAt: string;
};

export default function ActivityPage() {
  const [data, setData] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity/list")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const getLabel = (action: string) => {
    switch (action) {
      case "LOGIN":
        return "Logged in";
      case "LOGOUT":
        return "Logged out";
      case "PROFILE_VIEW":
        return "Viewed profile";
      default:
        return action;
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return "🟢";
      case "LOGOUT":
        return "🔴";
      case "PROFILE_VIEW":
        return "👤";
      default:
        return "📌";
    }
  };

  return (
    <div className="p-20 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">
        Activity Log
      </h1>

      <div className="border rounded-xl overflow-hidden">
        {data.length === 0 && (
          <p className="p-6 text-gray-500 text-center">
            No activity recorded yet
          </p>
        )}

        {data.map((a) => (
          <div
            key={a.id}
            className="flex gap-4 p-4 border-b last:border-b-0"
          >
            {/* ICON */}
            <div className="text-xl">
              {getIcon(a.action)}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <p className="font-medium">
                {getLabel(a.action)}
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
