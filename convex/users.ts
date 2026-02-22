import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
      
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      plan: "free",
      analysesThisMonth: 0,
    });
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const updatePlan = internalMutation({
  args: {
    clerkId: v.string(),
    plan: v.union(v.literal("free"), v.literal("creator"), v.literal("team")),
    lemonsqueezyCustomerId: v.optional(v.string()),
    lemonsqueezyOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
      
    if (!user) {
      throw new Error(`User not found for clerkId: ${args.clerkId}`);
    }
    
    await ctx.db.patch(user._id, {
      plan: args.plan,
      ...(args.lemonsqueezyCustomerId ? { lemonsqueezyCustomerId: args.lemonsqueezyCustomerId } : {}),
      ...(args.lemonsqueezyOrderId ? { lemonsqueezyOrderId: args.lemonsqueezyOrderId } : {}),
    });
  }
});

