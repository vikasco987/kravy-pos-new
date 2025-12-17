// // app/page.tsx
// "use client";
// import Image from "next/image";
// import { FaCashRegister, FaChartLine, FaMobileAlt } from "react-icons/fa";

// export default function LandingPage() {
//   return (
//     <main className="min-h-screen bg-gray-50">
//       {/* Hero Section */}
//       <section className="text-center py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
//         <h1 className="text-5xl font-bold mb-6">BillG Software</h1>
//         <p className="text-xl mb-6">
//           Smart Billing & Restaurant POS — Fast, Simple & Reliable
//         </p>
//         <button className="bg-white text-blue-600 px-6 py-3 rounded-full shadow-md hover:bg-gray-200">
//           Get Started
//         </button>
//       </section>

//       {/* Features */}
//       <section className="py-16 max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
//         <div className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition">
//           <FaCashRegister className="text-5xl text-blue-600 mx-auto mb-4" />
//           <h3 className="text-xl font-bold mb-2">Easy Billing</h3>
//           <p className="text-gray-600">
//             Generate invoices & manage payments in seconds.
//           </p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition">
//           <FaChartLine className="text-5xl text-green-600 mx-auto mb-4" />
//           <h3 className="text-xl font-bold mb-2">Smart Analytics</h3>
//           <p className="text-gray-600">
//             Track sales, revenue, and inventory in real-time.
//           </p>
//         </div>
//         <div className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition">
//           <FaMobileAlt className="text-5xl text-purple-600 mx-auto mb-4" />
//           <h3 className="text-xl font-bold mb-2">Mobile Ready</h3>
//           <p className="text-gray-600">
//             Works on Android, iOS, and Web seamlessly.
//           </p>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="text-center py-16 bg-blue-50">
//         <h2 className="text-3xl font-bold mb-4">Ready to grow your business?</h2>
//         <p className="text-gray-700 mb-6">
//           Start your free trial today and experience smarter billing.
//         </p>
//         <button className="bg-blue-600 text-white px-8 py-3 rounded-full shadow hover:bg-blue-700">
//           Start Free Trial
//         </button>
//       </section>

//       {/* Footer */}
//       <footer className="text-center py-6 bg-gray-100 text-gray-600">
//         © {new Date().getFullYear()} BillG Software. All rights reserved.
//       </footer>
//     </main>
//   );
// }







"use client";
import React, { useEffect, useState } from "react";
import { useSidebar } from "@/components/SidebarContext";
import { FaCashRegister, FaChartLine, FaMobileAlt } from "react-icons/fa";
import styles from "./Page.module.css";

export default function Page() {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // matchMedia to detect small screens
    const mq = window.matchMedia("(max-width: 880px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // on mobile we never push content (sidebar overlays instead)
  const sidebarWidth = isMobile ? 0 : collapsed ? 0 : 240;

  return (
    <div style={{ marginLeft: sidebarWidth, transition: "margin-left 180ms ease" }}>
      <main className={styles.content}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <h1>Kravy Billing Software</h1>
            <p>Smart Billing & Restaurant POS — Fast, Simple & Reliable</p>
            <button className={styles.primary}>Get Started</button>
          </section>

          <section className={styles.features}>
            <div className={styles.card}>
              <FaCashRegister style={{ fontSize: 40, color: "#0ea5e9" }} />
              <h3>Easy Billing</h3>
              <p>Generate invoices & manage payments in seconds.</p>
            </div>

            <div className={styles.card}>
              <FaChartLine style={{ fontSize: 40, color: "#10b981" }} />
              <h3>Smart Analytics</h3>
              <p>Track sales, revenue, and inventory in real-time.</p>
            </div>

            <div className={styles.card}>
              <FaMobileAlt style={{ fontSize: 40, color: "#7c3aed" }} />
              <h3>Mobile Ready</h3>
              <p>Works on Android, iOS, and Web seamlessly.</p>
            </div>
          </section>

          <section className={styles.cta}>
            <h2>Ready to grow your business?</h2>
            <p>Start your free trial today and experience smarter billing.</p>
            <button className={styles.primaryAlt}>Start Free Trial</button>
          </section>

          <footer className={styles.footer}>© {new Date().getFullYear()} Kravy Billing Software. All rights reserved.</footer>
        </div>
      </main>
    </div>
  );
}
