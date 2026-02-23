import Nav from "@/components/Nav";
import AnalysisInput from "@/components/AnalysisInput";
import FeatureRow from "@/components/FeatureRow";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-14 bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <div className="w-full max-w-[640px] text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Breakdown Any Design.
          </h1>
          <p className="text-xl sm:text-2xl text-[var(--fg)]/80 font-medium mb-1 leading-snug">
            Good artist copy, Great artist steal.
          </p>
          <p className="text-base sm:text-lg text-[var(--fg)]/60 font-medium leading-snug">
            Extract colors, fonts, spacing, and CSS variables from any website or screenshot.
          </p>
        </div>

        <AnalysisInput />
      </main>

      <footer className="w-full">
        <FeatureRow />
      </footer>
    </div>
  );
}
