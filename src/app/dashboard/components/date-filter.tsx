"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";

export default function DateFilter() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mode, setMode] =
    useState<"quick" | "single" | "range">("quick");

  const [selectedDate, setSelectedDate] =
    useState<Date | undefined>();

  const [range, setRange] =
    useState<DateRange | undefined>();

  const [label, setLabel] = useState("Today");

  useEffect(() => {
    const checkScreen = () =>
      setIsMobile(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () =>
      window.removeEventListener("resize", checkScreen);
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const applyQuick = (text: string, days: number) => {
    setLabel(text);
    router.push(`/dashboard?range=${days}`);
    setOpen(false);
  };

  const applySingle = () => {
    if (!selectedDate) return;
    setLabel(formatDate(selectedDate));
    router.push(`/dashboard?range=1`);
    setOpen(false);
  };

  const applyRange = () => {
    if (!range?.from || !range?.to) return;

    const diff =
      (range.to.getTime() - range.from.getTime()) /
        (1000 * 60 * 60 * 24) +
      1;

    setLabel(
      `${formatDate(range.from)} - ${formatDate(range.to)}`
    );

    router.push(`/dashboard?range=${Math.floor(diff)}`);
    setOpen(false);
  };

  return (
    <div className="relative">

      {/* BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-white border rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center gap-2"
      >
        {label}
        <span className="text-xs">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setOpen(false)}
            />

            {/* DESKTOP DROPDOWN */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`
absolute right-0 mt-2
bg-white border rounded-xl shadow-xl z-50
overflow-hidden
max-w-[95vw]
transition-all duration-300
${mode === "quick"
  ? "min-w-max w-auto"
  : "w-[320px] sm:w-[360px]"}
`}
              >
                <Content />
              </motion.div>
            )}

            {/* MOBILE DRAWER */}
            {isMobile && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 p-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
                <Content />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );

  function Content() {
    return (
      <>
        {mode === "quick" && (
          <div className="text-sm space-y-1">
            {[
              { label: "Today", value: 1 },
              { label: "Yesterday", value: 2 },
              { label: "Last 7 Days", value: 7 },
              { label: "Last 30 Days", value: 30 },
              {
                label: "This Month",
                value: new Date().getDate(),
              },
              { label: "Last Month", value: 30 },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() =>
                  applyQuick(item.label, item.value)
                }
                className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100"
              >
                {item.label}
              </button>
            ))}

            <div className="border-t my-2" />

            <button
              onClick={() => setMode("single")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Custom Date
            </button>

            <button
              onClick={() => setMode("range")}
              className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100"
            >
              Custom Range
            </button>
          </div>
        )}

        {mode === "single" && (
          <>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              numberOfMonths={1}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setMode("quick")}
                className="text-sm text-gray-500"
              >
                Back
              </button>
              <button
                onClick={applySingle}
                className="bg-black text-white px-3 py-1 rounded-md text-sm"
              >
                Apply
              </button>
            </div>
          </>
        )}

        {mode === "range" && (
          <>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={1}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setMode("quick")}
                className="text-sm text-gray-500"
              >
                Back
              </button>
              <button
                onClick={applyRange}
                className="bg-black text-white px-3 py-1 rounded-md text-sm"
              >
                Apply
              </button>
            </div>
          </>
        )}
      </>
    );
  }
}