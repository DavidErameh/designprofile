import { MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Doc } from "../_generated/dataModel";

export async function checkAndIncrementUsage(
  ctx: MutationCtx,
  user: Doc<"users">
) {
  if (user.plan === "free" && user.analysesThisMonth >= 10) {
    throw new ConvexError("RATE_LIMIT_EXCEEDED");
  }
  await ctx.db.patch(user._id, {
    analysesThisMonth: user.analysesThisMonth + 1,
  });
}
