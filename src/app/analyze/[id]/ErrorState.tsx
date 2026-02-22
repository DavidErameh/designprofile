"use client";

import Link from "next/link";

export default function ErrorState({ 
  errorMessage 
}: { 
  errorMessage?: string 
}) {
  const isRateLimit = errorMessage?.includes("RATE_LIMIT");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h2 className="text-xl font-semibold mb-2">
        {isRateLimit ? "Usage limit reached" : "We couldn't analyze that URL"}
      </h2>
      
      <p className="text-[#737373] text-sm max-w-[400px] mb-6">
        {isRateLimit ? (
          <>
            You've used your 10 free analyses this month.{" "}
            <Link href="/pricing" className="text-[var(--accent)] hover:underline">
              Upgrade to Creator &rarr;
            </Link>
          </>
        ) : (
          <>
            It may be behind a login or block automated access.{" "}
            <Link href="/" className="text-[var(--accent)] hover:underline">
              Try uploading a screenshot instead &rarr;
            </Link>
          </>
        )}
      </p>

      {!isRateLimit && (
        <Link 
          href="/"
          className="px-4 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#333] text-sm hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-colors"
        >
          Back to home
        </Link>
      )}
    </div>
  );
}
