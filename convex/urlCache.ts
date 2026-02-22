import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCache = query({
  args: { urlHash: v.string() },
  handler: async (ctx, args) => {
    const cache = await ctx.db
      .query("urlCache")
      .withIndex("by_url", (q) => q.eq("urlHash", args.urlHash))
      .unique();
      
    if (!cache) return null;
    if (cache.expiresAt < Date.now()) return null;
    return cache.profile;
  },
});

export const setCache = mutation({
  args: {
    urlHash: v.string(),
    profile: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("urlCache")
      .withIndex("by_url", (q) => q.eq("urlHash", args.urlHash))
      .unique();
      
    const expiresAt = Date.now() + 86400000;
      
    if (existing) {
      await ctx.db.patch(existing._id, {
        profile: args.profile,
        expiresAt,
      });
    } else {
      await ctx.db.insert("urlCache", {
        urlHash: args.urlHash,
        profile: args.profile,
        expiresAt,
      });
    }
  },
});
