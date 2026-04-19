import { mutation, internalMutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { checkAndIncrementUsage } from "./lib/rateLimiter";

export const createAnalysis = mutation({
  args: {
    sourceType: v.union(v.literal("url"), v.literal("image")),
    sourceValue: v.string(),
  },
  handler: async (ctx, args) => {
    // Temp: Allow unauthenticated for testing
    const userId = "anonymous";
    
    const insertData: any = {
      userId,
      sourceType: args.sourceType,
      sourceValue: args.sourceValue,
      status: "pending",
      createdAt: Date.now(),
    };
    
    // For images, save the base64 data URL as screenshotUrl
    if (args.sourceType === "image") {
      insertData.screenshotUrl = args.sourceValue;
    }
    
    const id = await ctx.db.insert("analyses", insertData);
    
    // Trigger orchestrator action
    await ctx.scheduler.runAfter(0, internal.actions.runAnalysis.runAnalysis, {
      analysisId: id,
    });
    
    return id;
  },
});

export const setStatus = internalMutation({
  args: {
    id: v.id("analyses"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("complete"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const completeAnalysis = internalMutation({
  args: {
    id: v.id("analyses"),
    profile: v.any(),
    processingMs: v.number(),
    screenshotUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "complete",
      profile: args.profile,
      processingMs: args.processingMs,
      ...(args.screenshotUrl ? { screenshotUrl: args.screenshotUrl } : {}),
    });
  },
});

export const setError = internalMutation({
  args: {
    id: v.id("analyses"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "error",
      errorMessage: args.errorMessage,
    });
  },
});

export const getAnalysis = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.id);
    if (!analysis) return null;
    // Temp: Allow any access for testing
    return analysis;
  },
});

export const listUserAnalyses = query({
  handler: async (ctx) => {
    // Temp: Return all analyses for testing
    return await ctx.db
      .query("analyses")
      .order("desc")
      .take(50);
  },
});
