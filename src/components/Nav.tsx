import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 border-b border-[#394739]/10 flex items-center justify-between px-6 z-50 bg-[var(--bg)]">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold tracking-tight text-[var(--fg)] text-lg">
          DesignProfiler
        </Link>
        <SignedIn>
          <Link href="/library" className="text-sm font-medium text-[var(--fg)] opacity-70 hover:opacity-100 transition-opacity">
            Library
          </Link>
          <Link href="/settings" className="text-sm font-medium text-[var(--fg)] opacity-70 hover:opacity-100 transition-opacity">
            Settings
          </Link>
        </SignedIn>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium">
        <SignedOut>
          <SignInButton forceRedirectUrl="/">
            <button className="text-[var(--fg)] font-semibold px-4 py-1.5 hover:opacity-70 transition-opacity">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/">
            <button className="bg-[var(--fg)] text-[var(--bg)] px-5 py-2 rounded-full font-bold hover:opacity-90 transition-opacity">
              Get started
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
