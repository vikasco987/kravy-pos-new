// src/components/profile/ProfileAvatar.tsx
"use client";
import React from "react";

export default function ProfileAvatar({ src, alt = "Profile", size = 96 }: { src?: string; alt?: string; size?: number; }) {
  return (
    <div style={{ width: size, height: size }}>
      <div className="pp-avatar-wrap" style={{ width: size, height: size }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="pp-avatar" />
        ) : (
          <div className="pp-avatar pp-avatar--placeholder">{alt?.slice(0,1) ?? "B"}</div>
        )}
        <span className="pp-avatar-ring" />
      </div>
    </div>
  );
}
