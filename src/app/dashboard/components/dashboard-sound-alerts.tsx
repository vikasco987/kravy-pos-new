"use client";

import { useEffect, useRef } from "react";
import { kravy } from "@/lib/sounds";

interface Props {
  activeOrders: number;
}

export default function DashboardSoundAlerts({ activeOrders }: Props) {
  const prevOrdersRef = useRef(activeOrders);

  useEffect(() => {
    // 1. Alert if new orders arrive (number increases)
    if (activeOrders > prevOrdersRef.current) {
      kravy.orderBell();
    }
    
    // 2. Gentle ping if there are pending orders when dashboard is opened
    // only if it's the first load
    if (activeOrders > 0 && prevOrdersRef.current === activeOrders) {
      // Small delay to ensure user gesture context is captured if needed, 
      // though kravy logic handles it.
      const timer = setTimeout(() => {
        kravy.ping();
      }, 1000);
      return () => clearTimeout(timer);
    }

    prevOrdersRef.current = activeOrders;
  }, [activeOrders]);

  return null; // Side-effect only component
}
