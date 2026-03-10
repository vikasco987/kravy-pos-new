"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function TopProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timeout);
    }, [pathname, searchParams]);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ width: "0%", opacity: 1 }}
                    animate={{ width: "100%", opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        height: "3px",
                        background: "linear-gradient(90deg, #FF6B35, #F59E0B, #8B5CF6)",
                        zIndex: 9999,
                        boxShadow: "0 0 10px rgba(255, 107, 53, 0.5)",
                    }}
                />
            )}
        </AnimatePresence>
    );
}
