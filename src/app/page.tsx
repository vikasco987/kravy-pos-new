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

import Link from "next/link";
import "./home.css";

export default function HomePage() {
  return (
    <main className="home">
      {/* HERO */}
      <section className="hero">
      <div className="hero-content scroll-fade">
          <h1 className="brand-title scroll-fade">
  <span className="brand-name">KRAVY</span>
  <span className="brand-sub">Billing Software</span>
</h1>

          <p>
            Kravy Billing helps restaurants and shops manage billing, menu,
            customers and sales with ease.
          </p>

          <div className="hero-actions">
            <Link href="/billing" className="btn primary">
              Start Billing
            </Link>
            <Link href="/menu/view" className="btn outline">
              View Menu
            </Link>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="mock-card" />
          <div className="mock-card delay" />
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Why Kravy Billing?</h2>

        <div className="feature-grid">
        <div className="feature scroll-rise">⚡ Fast Billing</div>
        <div className="feature scroll-rise">📋 Menu Management</div>
        <div className="feature scroll-rise">👥 Party Records</div>
        <div className="feature scroll-rise">📊 Sales Tracking</div>
        <div className="feature scroll-rise">📱 Mobile Friendly</div>
        <div className="feature scroll-rise">🔒 Secure System</div>
        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="steps">
        <h2>How It Works</h2>

        <div className="step-list">
          <div className="step scroll-slide">
            <span>1</span>
            <p>Add Menu Items</p>
          </div>
          <div className="step">
            <span>2</span>
            <p>Create Bill</p>
          </div>
          <div className="step">
            <span>3</span>
            <p>Track Sales</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta scroll-zoom">
        <h2>Ready to Upgrade Your Billing?</h2>
        <p>Clean. Fast. Reliable.</p>
        <Link href="/billing" className="btn primary big">
          Go to Billing
        </Link>
      </section>
    </main>
  );
}
