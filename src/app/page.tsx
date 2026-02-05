"use client";

import Link from "next/link";
import "./home.css";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { auth } from "@clerk/nextjs/server";


export default function HomePage() {
  return (
    <main className="dashboard-home">
      {/* TOP HEADER */}
      <section className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <span className="brand-name">KRAVY</span> Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Overview of your billing, sales, and activity
          </p>
        </div>

        <div className="dashboard-actions">
          <Link href="/billing/checkout" className="btn primary">
            Start Billing
          </Link>
          <Link href="/menu/view" className="btn outline">
            View Menu
          </Link>
        </div>
      </section>

      {/* SECTION CARDS (PARALLEL, TOP PRIORITY) */}
      <section className="dashboard-cards">
        <SectionCards />
      </section>

      {/* CHARTS */}
      <section className="dashboard-charts">
        <div className="chart-card">
          <h2 className="section-title">Sales Overview</h2>
          <ChartAreaInteractive />
        </div>
      </section>

      {/* FEATURES */}
      <section className="dashboard-features">
        <h2 className="section-title">Why Kravy Billing?</h2>

        <div className="feature-grid">
          <div className="feature">⚡ Fast Billing</div>
          <div className="feature">📋 Easy Menu Management</div>
          <div className="feature">👥 Party & Customer Records</div>
          <div className="feature">📊 Sales Tracking</div>
          <div className="feature">📱 Mobile Friendly</div>
          <div className="feature">🔒 Secure & Reliable</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="dashboard-steps">
        <h2 className="section-title">How It Works</h2>

        <div className="step-list">
          <div className="step">
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
    </main>
  );
}
