"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

export default function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] = useState<"quick" | "single" | "range">("quick");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();
  const [label, setLabel] = useState("Last 30 Days");

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);

    // Initial sync from URL
    const rangeVal = searchParams.get("range");
    if (rangeVal) {
      const r = Number(rangeVal);
      const items = [
        { label: "Today", value: 1 },
        { label: "Yesterday", value: 2 },
        { label: "Last 7 Days", value: 7 },
        { label: "Last 30 Days", value: 30 },
      ];
      const match = items.find(i => i.value === r);
      if (match) setLabel(match.label);
      else if (r > 30) setLabel(`Last ${r} Days`);
    }

    return () => window.removeEventListener("resize", checkScreen);
  }, [searchParams]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const updateURL = (paramsToSet: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToSet).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyQuick = (text: string, days: number, type?: string) => {
    setLabel(text);
    if (type) {
      updateURL({ range: days.toString(), type: type, from: null, to: null });
    } else {
      updateURL({ range: days.toString(), type: null, from: null, to: null });
    }
    setOpen(false);
  };

  const applySingle = () => {
    if (!selectedDate) return;
    setLabel(formatDate(selectedDate));
    // Pass from and to so it selects exact single day bounds
    updateURL({ 
      range: "1", 
      type: null, 
      from: selectedDate.toISOString(), 
      to: new Date(selectedDate.setHours(23, 59, 59, 999)).toISOString() 
    });
    setOpen(false);
  };

  const applyRange = () => {
    if (!range?.from || !range?.to) return;
    const diff = (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24) + 1;
    setLabel(`${formatDate(range.from)} - ${formatDate(range.to)}`);
    updateURL({
      range: Math.floor(diff).toString(),
      type: null,
      from: range.from.toISOString(),
      to: new Date(range.to.setHours(23, 59, 59, 999)).toISOString()
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 18px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px",
          color: "#F1F0EC",
          fontSize: "0.85rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
      >
        <CalendarIcon size={16} color="#FF6B35" />
        {label}
        <ChevronDown size={14} color="#4A5568" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                position: isMobile ? "fixed" : "absolute",
                bottom: isMobile ? "0" : "auto",
                top: isMobile ? "auto" : "calc(100% + 12px)",
                right: isMobile ? "0" : "0",
                width: isMobile ? "100%" : "320px",
                background: "#0D0F1A",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: isMobile ? "24px 24px 0 0" : "20px",
                padding: "24px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                zIndex: 110,
                color: "#F1F0EC"
              }}
            >
              {isMobile && <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", margin: "0 auto 20px" }} />}

              <Content />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  function Content() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {mode === "quick" && (
          <>
            <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Quick Selection</h4>
            {[
              { label: "Today", value: 1, type: undefined },
              { label: "Yesterday", value: 2, type: undefined },
              { label: "Last 7 Days", value: 7, type: undefined },
              { label: "Last 30 Days", value: 30, type: undefined },
              { label: "This Month", value: new Date().getDate(), type: "this_month" },
              { label: "Last Month", value: 30, type: "last_month" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => applyQuick(item.label, item.value, item.type)}
                style={{
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "10px",
                  color: "#F1F0EC",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </button>
            ))}

            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "8px 0" }} />

            <button
              onClick={() => setMode("single")}
              style={{
                textAlign: "left", padding: "10px 14px", background: "transparent", border: "none",
                borderRadius: "10px", color: "#FF6B35", fontSize: "0.9rem", cursor: "pointer", fontWeight: 700
              }}
            >
              Custom Date
            </button>
            <button
              onClick={() => setMode("range")}
              style={{
                textAlign: "left", padding: "10px 14px", background: "transparent", border: "none",
                borderRadius: "10px", color: "#FF6B35", fontSize: "0.9rem", cursor: "pointer", fontWeight: 700
              }}
            >
              Custom Range
            </button>
          </>
        )}

        {(mode === "single" || mode === "range") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "single" ? (
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d as Date)}
                styles={{
                  head_cell: { color: "#4A5568", fontSize: "0.75rem" },
                  cell: { color: "#F1F0EC" },
                  nav_button: { color: "#F1F0EC" }
                }}
              />
            ) : mode === "range" ? (
              <DayPicker
                mode="range"
                selected={range}
                onSelect={(r) => setRange(r as DateRange)}
                styles={{
                  head_cell: { color: "#4A5568", fontSize: "0.75rem" },
                  cell: { color: "#F1F0EC" },
                  nav_button: { color: "#F1F0EC" }
                }}
              />
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              <button
                onClick={() => setMode("quick")}
                style={{ background: "none", border: "none", color: "#4A5568", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
              >
                Back
              </button>
              <button
                onClick={mode === "single" ? applySingle : applyRange}
                style={{
                  background: "#FF6B35", border: "none", color: "white",
                  padding: "8px 20px", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}