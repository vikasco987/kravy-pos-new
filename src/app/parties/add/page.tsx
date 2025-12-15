// src/app/parties/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPartyPage() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", dob: "" });
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Party added successfully!");
      router.push("/parties");
    } else {
      alert(data.error || "Failed to add party.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-36 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">➕ Add Party</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2 rounded"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save
        </button>
      </form>
    </div>
  );
}
