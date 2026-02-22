import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 border-b border-[#E5E5E5] dark:border-[#333] flex items-center justify-between px-6 z-50 bg-[var(--bg)]">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight text-[var(--fg)]">
          DesignProfiler
        </Link>
        <SignedIn>
          <Link href="/library" className="text-sm font-medium text-[#737373] hover:text-[var(--fg)] transition-colors">
            Library
          </Link>
          <Link href="/settings" className="text-sm font-medium text-[#737373] hover:text-[var(--fg)] transition-colors">
            Settings
          </Link>
        </SignedIn>
      </div>
      <div className="flex items-center gap-4 text-sm font-medium">
        <SignedOut>
          <SignInButton forceRedirectUrl="/">
            <button className="text-[var(--fg)] opacity-80 hover:opacity-100 transition-opacity">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/">
            <button className="text-[var(--accent)] hover:opacity-80 transition-opacity">
              Get started &rarr;
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
