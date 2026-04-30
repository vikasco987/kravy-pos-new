import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import Image from "next/image";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();
  const staffToken = (await cookies()).get("staff_token");

  if (userId || staffToken) {
    redirect("/dashboard");
  }

  return (
    <div
      className="fixed inset-0 flex overflow-hidden bg-white select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Premium Brand Showcase
      ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col w-[54%] xl:w-[52%] relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #1a1060 0%, #0e1040 30%, #080c28 65%, #06080F 100%)' }}>

        {/* ── Vivid ambient glows (more visible on lighter base) ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_10%_0%,rgba(129,140,248,0.45)_0%,transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_90%_100%,rgba(59,130,246,0.30)_0%,transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_50%_45%,rgba(167,139,250,0.12)_0%,transparent_65%)] pointer-events-none" />
        {/* Fine dot grid — slightly more visible */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#06080F] to-transparent pointer-events-none z-10" />

        {/* Smooth entry animation */}
        <style>{`
          @keyframes lp-fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes lp-float {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
          }
          @keyframes lp-glow-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50%       { opacity: 0.85; transform: scale(1.08); }
          }
          @keyframes lp-shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .lp-fade-up   { animation: lp-fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
          .lp-float     { animation: lp-float 6s ease-in-out infinite; }
          .lp-glow      { animation: lp-glow-pulse 3s ease-in-out infinite; }
          .lp-delay-1   { animation-delay: 0.15s; }
          .lp-delay-2   { animation-delay: 0.28s; }
          .lp-delay-3   { animation-delay: 0.42s; }
          .lp-delay-4   { animation-delay: 0.55s; }
          .lp-delay-5   { animation-delay: 0.68s; }
          .stat-shimmer {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
            background-size: 400px 100%;
            animation: lp-shimmer 2.5s ease-in-out infinite;
          }
        `}</style>

        {/* ── Full-height layout ── */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Top bar — logo + status */}
          <div className="flex items-center justify-between px-12 xl:px-16 pt-10 flex-shrink-0 lp-fade-up">
            <div className="flex items-center gap-3">
              <Image
                src="/kravylogo.png"
                alt="Kravy"
                width={36}
                height={36}
                className="rounded-xl shadow-lg shadow-indigo-500/25"
              />
              <span className="text-white font-bold text-[1.15rem] tracking-tight">Kravy</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-[10.5px] font-bold text-white/40 uppercase tracking-[0.18em]">v3.0 Live</span>
            </div>
          </div>

          {/* ── Centered Hero ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-10 xl:px-14 text-center">

            {/* Logo with glow */}
            <div className="relative mb-7 lp-fade-up lp-delay-1">
              <div className="lp-float">
                <Image
                  src="/kravylogo.png"
                  alt="Kravy Logo"
                  width={96}
                  height={96}
                  className="rounded-[28px] shadow-[0_24px_64px_rgba(79,70,229,0.55)] ring-1 ring-white/10"
                />
              </div>
              {/* Glow orb */}
              <div className="lp-glow absolute inset-0 rounded-[28px] bg-indigo-500/40 blur-3xl scale-[1.8] -z-10" />
            </div>

            {/* Tagline label */}
            <p className="text-[10.5px] font-bold tracking-[0.32em] text-indigo-400/70 uppercase mb-3 lp-fade-up lp-delay-2">
              Smart Billing System
            </p>

            {/* Main headline */}
            <h1 className="text-[2.6rem] xl:text-[3rem] font-extrabold text-white tracking-[-0.02em] leading-[1.08] lp-fade-up lp-delay-2">
              Billing that works<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #818cf8 50%, #c084fc 100%)" }}>
                as fast as you do.
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-4 text-[14px] text-white/38 leading-relaxed max-w-[300px] font-normal lp-fade-up lp-delay-3">
              A beautifully crafted POS platform designed for modern businesses — invoice fast, track smart, grow confidently.
            </p>

            {/* Stat pills */}
            <div className="mt-8 flex items-center gap-3 lp-fade-up lp-delay-4">
              {[
                { value: "500+", label: "Businesses" },
                { value: "₹2Cr+", label: "Billed Daily" },
                { value: "99.9%", label: "Uptime" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="relative px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center overflow-hidden"
                >
                  <div className="stat-shimmer absolute inset-0 pointer-events-none rounded-2xl" style={{ animationDelay: `${i * 0.4}s` }} />
                  <div className="text-[1.15rem] font-extrabold text-white tracking-tight">{s.value}</div>
                  <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Dashboard Mockup — clipped at bottom ── */}
          <div className="px-10 xl:px-14 pb-0 flex-shrink-0 lp-fade-up lp-delay-5">
            <div className="relative rounded-t-2xl overflow-hidden border border-white/10 border-b-0 shadow-[0_-16px_48px_-8px_rgba(79,70,229,0.3)]">
              {/* macOS window bar */}
              <div className="h-8 bg-[#0a0c14] border-b border-white/[0.07] flex items-center gap-1.5 px-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
                <div className="ml-3 flex items-center gap-1.5">
                  <div className="h-2.5 w-24 rounded-full bg-white/[0.05]" />
                </div>
              </div>
              {/* Fixed height image */}
              <div className="relative h-[190px] xl:h-[220px] overflow-hidden">
                <Image
                  src="/dashboard-mockup.png"
                  alt="Kravy Smart Billing Dashboard"
                  fill
                  priority
                  className="object-cover object-top opacity-90"
                />
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#06080F] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Clean Login Form
      ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden bg-white relative px-6 sm:px-12 lg:px-10 xl:px-16">

        {/* Ambient glows */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-50/70 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-50/50 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[380px] relative z-10 kravy-page-fade">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg style={{ width: 16, height: 16 }} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Kravy</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-[1.75rem] font-bold text-slate-900 tracking-tight leading-snug">
              Welcome back
            </h2>
            <p className="mt-1.5 text-[14px] text-slate-400 leading-relaxed font-normal">
              Sign in to your Kravy account to manage your business.
            </p>
          </div>

          <SignedOut>
            <div className="flex flex-col gap-2.5">

              {/* Owner Sign In */}
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900 text-white text-[14.5px] font-semibold transition-all duration-200 hover:bg-slate-800 hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.4)] hover:-translate-y-px active:translate-y-0 focus:outline-none group">
                  <svg style={{ width: 17, height: 17 }} className="text-white/50 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign in as Owner
                </button>
              </SignInButton>

              {/* Staff Login */}
              <Link href="/staff/login" className="w-full">
                <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-[14.5px] font-semibold transition-all duration-200 hover:bg-white hover:border-indigo-200 hover:text-indigo-700 hover:shadow-[0_6px_18px_-8px_rgba(79,70,229,0.3)] hover:-translate-y-px active:translate-y-0 focus:outline-none group">
                  <svg style={{ width: 17, height: 17 }} className="text-slate-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Staff Member Access
                </button>
              </Link>

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-[0.18em]">New here?</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Sign Up */}
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-white text-[14.5px] font-semibold transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_28px_-8px_rgba(79,70,229,0.5)] active:translate-y-0 focus:outline-none group"
                  style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
                >
                  <svg style={{ width: 17, height: 17 }} className="text-white/60 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Create Free Account
                </button>
              </SignUpButton>

            </div>
          </SignedOut>

          {/* Terms */}
          <p className="mt-6 text-center text-[11.5px] text-slate-400 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors">Terms</a>
            {" & "}
            <a href="#" className="text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors">Privacy Policy</a>.
          </p>

          {/* Security strip */}
          <div className="mt-5 pt-5 border-t border-slate-50/80 flex items-center justify-center gap-4 text-[11px] font-medium text-slate-300">
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL Secure
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Trusted
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              500+ Businesses
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}