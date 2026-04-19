import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 min-w-[1024px] border-b border-[#000]/5 flex items-center justify-between px-6 z-50 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold tracking-wide text-[var(--fg)] text-xl flex items-center gap-2">
          <img src="/LOGO/DP_ICON.svg" alt="DesignProfiler Logo" className="w-8 h-8 flex-shrink-0" />
          <span className="whitespace-nowrap">DesignProfiler</span>
        </Link>
        <SignedIn>
          <Link href="/library" className="text-sm font-medium text-[var(--fg)] opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap">
            Library
          </Link>
          <Link href="/settings" className="text-sm font-medium text-[var(--fg)] opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap">
            Settings
          </Link>
        </SignedIn>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium flex-shrink-0">
        <SignedOut>
          <SignInButton forceRedirectUrl="/">
            <button className="text-[var(--fg)] font-semibold px-4 py-1.5 hover:bg-[#394739]/5 rounded-lg transition-colors whitespace-nowrap">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/">
            <button className="bg-[#aff6b0] text-[#394739] px-6 py-2 rounded-lg font-bold text-[15px] hover:opacity-90 transition-opacity whitespace-nowrap">
              Join
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  );
}
