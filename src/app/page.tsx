import Nav from "@/components/Nav";
import AnalysisInput from "@/components/AnalysisInput";
import FeatureRow from "@/components/FeatureRow";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col pt-14 bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <div className="w-full max-w-[640px] text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Decode any design.
          </h1>
          <p className="text-lg text-[#A3A3A3]">
            Instantly extract colors, fonts, spacing, and CSS variables from any website.
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
