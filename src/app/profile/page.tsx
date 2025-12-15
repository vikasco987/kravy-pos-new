// src/app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import BusinessProfileCard from "@/components/profile/BusinessProfileCard";
import ProfileForm from "@/components/profile/ProfileForm";

type ProfileType = any;

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      if (res.status === 404) {
        // no profile yet
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to fetch (${res.status})`);
      }
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      console.error("Profile load error:", err);
      setError(err?.message ?? "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleEditToggle = () => {
    setEditing((s) => !s);
  };

  const handleSaved = async () => {
    // called by ProfileForm after successful save
    setNotice("Saved successfully");
    setEditing(false);
    // reload profile and show it
    await loadProfile();
    window.setTimeout(() => setNotice(null), 2500);
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-container">
        <h1 className="profile-page-title">Business Profile</h1>

        {notice && (
          <div className="pp-toast pp-toast--success" role="status">
            {notice}
            <button className="pp-toast-close" onClick={() => setNotice(null)}>✕</button>
          </div>
        )}

        <section className="profile-section">
          {loading ? (
            <div className="card profile-loading">
              Loading profile...
            </div>
          ) : error ? (
            <div className="card">
              <div style={{ color: "#b91c1c", fontWeight: 700 }}>Error</div>
              <div style={{ marginTop: 8 }}>{error}</div>
            </div>
          ) : editing ? (
            // Edit mode: show the form with initialData (profile may be null for create)
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Edit Business Profile</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn ghost small" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>

              <ProfileForm initialData={profile} onSaved={handleSaved} />
            </div>
          ) : (
            // View mode: show the saved card OR a prompt to create
            <>
              {profile ? (
                <div className="card card-body horizontal">
                  <div style={{ flex: 1 }}>
                    <BusinessProfileCard profile={profile} />
                    <div style={{ marginTop: 14 }}>
                      <div className="action-buttons">
                        <button className="btn primary small" onClick={() => setEditing(true)}>Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <p style={{ margin: 0, fontWeight: 700 }}>No business profile found.</p>
                  <p style={{ marginTop: 8, color: "#475569" }}>Click below to create one.</p>
                  <div style={{ marginTop: 14 }}>
                    <button className="btn primary" onClick={() => setEditing(true)}>Create Profile</button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
