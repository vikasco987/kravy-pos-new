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
      <div className="max-w-5xl mx-auto p-8 space-y-8 animate-pulse">
        <div className="h-64 rounded-[40px] bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)]" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-48 rounded-3xl bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)]" />
          <div className="h-48 rounded-3xl bg-[var(--kravy-bg-2)] border border-[var(--kravy-border)]" />
        </div>
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
