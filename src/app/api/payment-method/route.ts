import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function GET(request: NextRequest) {
  const pmId = request.nextUrl.searchParams.get("paymentMethodId");
  if (!pmId) {
    return NextResponse.json({ error: "Missing paymentMethodId" }, { status: 400 });
  }
  try {
    const pm = await stripe.paymentMethods.retrieve(pmId);
    return NextResponse.json(pm);
  } catch (err: any) {
    console.error("Erro fetching PM:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
