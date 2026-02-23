"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Nav from "@/components/Nav";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import ResultPage from "./ResultPage";

export default function AnalyzePage() {
  const params = useParams();
  const id = params.id as Id<"analyses">;

  const analysis = useQuery(api.analyses.getAnalysis, { id });

  if (analysis === undefined) {
    // Initial loading from Convex
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Nav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (analysis === null) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Nav />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Analysis not found</h2>
          <p className="text-[#737373] text-sm mb-6">It might have been deleted or you don't have access.</p>
          <a href="/" className="text-[var(--accent)] hover:underline">Go back home</a>
        </div>
      </div>
    );
  }

  const { status, sourceValue, errorMessage } = analysis;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      
      <main className="pt-14">
        {(status === "pending" || status === "processing") && (
          <LoadingState sourceValue={sourceValue} />
        )}

        {status === "error" && (
          <ErrorState errorMessage={errorMessage} />
        )}

        {status === "complete" && (
          <ResultPage profile={analysis.profile as any} />
        )}
      </main>
    </div>
  );
}
