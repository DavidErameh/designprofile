import { 
  lemonSqueezySetup, 
  createCheckout 
} from "@lemonsqueezy/lemonsqueezy.js";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
    }

    lemonSqueezySetup({
      apiKey: process.env.LEMONSQUEEZY_API_KEY!,
      onError: (error) => console.error("Lemon Squeezy API error:", error),
    });

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    
    if (!storeId) {
      console.error("Missing LEMONSQUEEZY_STORE_ID");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const { error, data } = await createCheckout(
      storeId,
      variantId,
      {
        checkoutData: {
          custom: { clerkUserId: String(userId) },
        },
      }
    );

    if (error) {
      console.error("Error creating checkout", error);
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
    }

    // @ts-ignore - The types from the SDK might not match the runtime response perfectly
    const checkoutUrl = data?.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: "No URL returned" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
