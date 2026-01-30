"use client";

import { useEffect, useState, useCallback } from "react";
import BusinessProfile from "./BusinessProfile";
import ProfileEmpty from "./empty";

export default function Page() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/profile", {
        cache: "no-store",
      });

      if (!res.ok) {
        setProfile(null);
        return;
      }

      const data = await res.json();

      // ensure real profile
      if (!data || !data.userId) {
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

 if (loading) {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 rounded-lg bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

  if (!profile) {
    return <ProfileEmpty />;
  }

  return (
    <BusinessProfile
      data={profile}
      onProfileUpdated={fetchProfile}
    />
  );
}
