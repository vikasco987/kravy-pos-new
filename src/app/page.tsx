

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import Image from "next/image";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 overflow-hidden">

      {/* Background Image Layer */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/landing-gradient.svg"
          alt="Background"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
      </div>

      {/* Container */}
      <div className="mx-auto max-w-7xl px-6 lg:px-20 py-16 lg:py-24">

        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">

          {/* LEFT CONTENT */}
          <div className="text-center md:text-left space-y-6">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Smart Billing <br />
              <span className="text-blue-600">Made Simple</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
              Powerful invoicing, real-time analytics, and revenue tracking
              built for modern businesses. Manage bills, track payments,
              and grow faster with intelligent insights.
            </p>

            <SignedOut>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">

                <SignUpButton
                  mode="modal"
                  afterSignUpUrl="/dashboard"
                >
                  <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium px-8 py-3 rounded-xl shadow-md">
                    Get Started Free
                  </button>
                </SignUpButton>

                <SignInButton
                  mode="modal"
                  afterSignInUrl="/dashboard"
                >
                  <button className="w-full sm:w-auto border border-gray-300 hover:bg-gray-100 transition-all duration-300 text-gray-800 font-medium px-8 py-3 rounded-xl">
                    Login
                  </button>
                </SignInButton>

              </div>
            </SignedOut>

            <div className="pt-6 text-sm text-gray-500">
              No credit card required • Secure authentication • Cloud ready
            </div>

          </div>

          {/* RIGHT SIDE IMAGE */}
          {/* Visible on medium and above */}
          <div className="relative hidden md:flex justify-center">
            <Image
              src="/dashboard-mockup.png"
              alt="Dashboard Preview"
              width={750}
              height={500}
              priority
              className="rounded-2xl shadow-2xl border bg-white"
            />
          </div>

        </div>

      </div>
    </main>
  );
}