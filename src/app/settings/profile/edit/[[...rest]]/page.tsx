"use client";

import { UserProfile } from "@clerk/nextjs";

export default function EditProfilePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center sm:text-left">
        Edit Profile
      </h1>

      <UserProfile
        routing="path"
        path="/settings/profile/edit"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border rounded-lg",
          },
        }}
      />
    </div>
  );
}
