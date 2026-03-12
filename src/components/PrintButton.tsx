"use client";

import React from "react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        marginBottom: "20px",
        padding: "10px 15px",
        backgroundColor: "#4f46e5",
        color: "white",
        borderRadius: "5px",
      }}
    >
      🖨️ Print Bill
    </button>
  );
}
