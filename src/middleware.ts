import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher([
  "/library(.*)",
  "/settings(.*)",
  "/api/analyze(.*)",
]);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default clerkMiddleware(async (auth, req) => {
  // 1. Protection Check
  if (isProtected(req)) {
    await auth.protect();
  }

  // 2. Rate Limiting for Analysis APIs
  if (req.nextUrl.pathname.startsWith('/api/analyze')) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 5;       // 5 requests per minute per IP

    const current = rateLimitMap.get(ip);

    if (!current || current.resetAt < now) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    } else {
      if (current.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again in a minute.' },
          { status: 429 }
        );
      }
      current.count++;
    }
  }

  return NextResponse.next();
});

export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
