// app/api/cancel-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: NextRequest) {
  const { subscriptionId } = (await request.json()) as { subscriptionId?: string };

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId in request body" },
      { status: 400 }
    );
  }

  try {
    const canceled = await stripe.subscriptions.cancel(subscriptionId);
    return NextResponse.json({ success: true, subscription: canceled });
  } catch (err: any) {
    console.error("Stripe cancellation error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
