import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: NextRequest) {
  const { paymentMethodId } = await request.json();
  if (!paymentMethodId) {
    return NextResponse.json({ error: "Missing paymentMethodId" }, { status: 400 });
  }
  try {
    const pm = await stripe.paymentMethods.detach(paymentMethodId);
    return NextResponse.json({ success: true, paymentMethod: pm });
  } catch (err: any) {
    console.error("Erro detaching PM:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
