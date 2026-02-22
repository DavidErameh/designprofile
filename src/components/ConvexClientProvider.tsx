"use client";

import { useEffect } from "react";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://example.convex.cloud"
);

function SyncUserWithConvex() {
  const { userId } = useAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (userId) {
      upsertUser({ clerkId: userId });
    }
  }, [userId, upsertUser]);

  return null;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <SyncUserWithConvex />
      {children}
    </ConvexProviderWithClerk>
  );
}
