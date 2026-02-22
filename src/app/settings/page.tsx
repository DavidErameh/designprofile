"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getUser, user?.id ? { clerkId: user.id } : "skip");

  if (!isLoaded || convexUser === undefined) {
    return (
      <main className="max-w-[600px] mx-auto pt-32 px-6 pb-24 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded" />
          <div className="h-32 w-full bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded-xl" />
        </div>
      </main>
    );
  }

  if (!user || convexUser === null) {
    return null; // Should be caught by middleware mapping or Clerk
  }

  const plan = convexUser.plan || "free";
  const analysesThisMonth = convexUser.analysesThisMonth || 0;
  const isFree = plan === "free";
  const limit = isFree ? 10 : "∞";
  
  const progressPercent = isFree ? Math.min((analysesThisMonth / 10) * 100, 100) : 0;

  return (
    <main className="max-w-[600px] mx-auto pt-32 px-6 pb-24 min-h-screen flex flex-col gap-10">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight mb-2">Settings</h1>
        <p className="text-[#737373] text-[14px]">Manage your account details and subscription.</p>
      </div>

      <section className="flex flex-col gap-6 p-6 md:p-8 rounded-2xl border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-[#0A0A0A]">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-[14px] font-semibold text-[var(--fg)]">Current Plan</h2>
            <p className="text-[13px] text-[#A3A3A3]">You are currently on the <strong className="font-medium text-[var(--fg)] capitalize">{plan}</strong> plan.</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[12px] font-medium capitalize text-[var(--fg)]">
            {plan} Plan
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-[#E5E5E5] dark:border-[#333]">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-[#737373]">Usage</span>
            <span className="font-medium text-[var(--fg)]">{analysesThisMonth} / {limit} analyses this month</span>
          </div>
          
          {isFree && (
            <div className="w-full h-2 bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {isFree && (
          <div className="pt-6 border-t border-[#E5E5E5] dark:border-[#333]">
            <button 
              onClick={async () => {
                const res = await fetch("/api/checkout", { 
                  method: "POST", 
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ variantId: "creator-variant-id" }) 
                });
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = data.url;
                }
              }}
              className="group flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Creator &mdash; $19 one-time &rarr;
            </button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-[12px] font-semibold uppercase tracking-widest text-[#A3A3A3] px-2">
          Danger Zone
        </h3>
        <div className="p-2 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/10">
          <SignOutButton signOutOptions={{ redirectUrl: "/" }}>
            <button className="flex items-center justify-between w-full p-4 rounded-lg bg-white dark:bg-[#0A0A0A] border border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-500 transition-colors text-[14px] font-medium">
              Sign out of your account
              <LogOut className="w-4 h-4" />
            </button>
          </SignOutButton>
        </div>
      </section>
    </main>
  );
}
