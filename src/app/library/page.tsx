"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";

function formatRelativeTime(ms: number) {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins <= 1 ? "Just now" : `${mins} mins ago`;
    }
    return `${hours} hours ago`;
  }
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function AnalysisRow({ analysis }: { analysis: any }) {
  // Use profile meta if complete, else show status
  const style = analysis.status === "complete" 
    ? (analysis.profile?.meta?.design_style ?? "—") 
    : analysis.status;

  return (
    <Link 
      href={`/analyze/${analysis._id}`}
      className="flex items-center justify-between h-[48px] border-b border-[#394739]/10 group"
    >
      <span className="text-[14px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors truncate pr-4">
        {analysis.sourceValue}
      </span>
      <span className="text-[12px] text-[#394739]/50 font-mono whitespace-nowrap capitalize">
        {style} &middot; {formatRelativeTime(analysis.createdAt)}
      </span>
    </Link>
  );
}

function LibraryContent() {
  const analyses = useQuery(api.analyses.listUserAnalyses);

  if (analyses === undefined) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between h-[48px] border-b border-[#394739]/10">
            <div className="h-4 w-48 bg-[#394739]/5 rounded animate-pulse" />
            <div className="h-3 w-32 bg-[#394739]/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#394739]/40">
        <p className="mb-4">No analyses yet.</p>
        <Link href="/" className="text-[var(--accent)] hover:underline text-sm font-medium">
          Analyze your first URL &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {analyses.map((analysis) => (
        <AnalysisRow key={analysis._id} analysis={analysis} />
      ))}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <main className="max-w-[800px] mx-auto pt-32 px-6 pb-24 min-h-screen">
      <SignedIn>
        <h1 className="text-[18px] font-semibold mb-8">Library</h1>
        <LibraryContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </main>
  );
}
