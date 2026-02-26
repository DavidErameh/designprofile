import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analyses: defineTable({
    userId: v.string(),
    sourceType: v.union(v.literal("url"), v.literal("image")),
    sourceValue: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("complete"),
      v.literal("error"),
    ),
    stage: v.optional(v.string()),
    screenshotUrl: v.optional(v.string()),
    profile: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
    processingMs: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  urlCache: defineTable({
    urlHash: v.string(),
    profile: v.any(),
    expiresAt: v.number(),
  }).index("by_url", ["urlHash"]),

  users: defineTable({
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("creator"), v.literal("team")),
    analysesThisMonth: v.number(),
    lemonsqueezyCustomerId: v.optional(v.string()),
    lemonsqueezyOrderId: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),
});
