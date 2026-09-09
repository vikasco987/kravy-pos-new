with open("src/app/dashboard/billing/BillHistoryTable.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# The incorrect injection starts at:
#       {reasonModal?.isOpen && (
# and ends right before:
#     );
#   }
# 
#   let icon = <Banknote size={10} />;

reason_modal_ui = """
      {reasonModal?.isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "20px", width: "90%", maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 900, marginBottom: "16px", color: "#1E293B" }}>
              {reasonModal.type === "CANCELLED" ? "Cancel Bill" : "Delete Bill"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "12px" }}>Select a reason:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {["Guest refused to pay", "Wrong Item Billed", "Test Order", "Duplicate Bill"].map(rs => (
                <button key={rs} onClick={() => {
                  setReasonModal(null);
                  if (reasonModal.type === "CANCELLED") handleStatusUpdate("CANCELLED", rs);
                  else handleDelete(rs);
                }} style={{ padding: "10px", background: "#F1F5F9", borderRadius: "10px", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  {rs}
                </button>
              ))}
            </div>
            <p style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "8px" }}>Or enter custom reason:</p>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              const val = e.target.elements.customReason.value;
              if(!val) return;
              setReasonModal(null);
              if (reasonModal.type === "CANCELLED") handleStatusUpdate("CANCELLED", val);
              else handleDelete(val);
            }}>
              <input name="customReason" autoFocus placeholder="Type reason here..." style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "12px", fontSize: "0.85rem", outline: "none" }} />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setReasonModal(null)} style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, color: "#64748B" }}>Close</button>
                <button type="submit" style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 800, background: "#EF4444", color: "white" }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}"""

# First remove the modal from PaymentBadge
content = content.replace(reason_modal_ui + "\n    );\n  }\n\n  let icon = <Banknote size={10} />;", "\n    );\n  }\n\n  let icon = <Banknote size={10} />;")

# Now inject it into BillActions return statement
# BillActions ends with:
#         )}
#       </div>
#     </div>
#   );
# };
# 
# // --- Main Table Component ---

content = content.replace("""        )}
      </div>
    </div>
  );
};

// --- Main Table Component ---""", f"""        )}}
      </div>
      {reason_modal_ui}
    </div>
  );
}};

// --- Main Table Component ---""")


with open("src/app/dashboard/billing/BillHistoryTable.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed syntax")
