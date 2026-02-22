import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { api, internal } from "../../../../convex/_generated/api";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("X-Signature") || "";
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(body).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const eventName = payload.meta.event_name;
    const obj = payload.data.attributes;

    if (eventName === "order_created") {
      const clerkUserId = payload.meta.custom_data?.clerkUserId;
      if (!clerkUserId) {
        return NextResponse.json({ error: "No user ID attached to order" }, { status: 400 });
      }

      const variantId = obj.first_order_item.variant_id.toString();
      let plan: "free" | "creator" | "team" = "free";

      if (variantId === process.env.LEMONSQUEEZY_CREATOR_VARIANT_ID) {
        plan = "creator";
      } else if (variantId === process.env.LEMONSQUEEZY_TEAM_VARIANT_ID) {
        plan = "team";
      }

      const customerId = obj.customer_id.toString();
      const orderId = payload.data.id.toString();

      await fetchMutation(internal.users.updatePlan, {
        clerkId: clerkUserId,
        plan,
        lemonsqueezyCustomerId: customerId,
        lemonsqueezyOrderId: orderId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
