// app/api/stripe/set-default-payment-method/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: NextRequest) {
  const { paymentMethodId, uid } = await request.json();
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "Missing paymentMethodId" },
      { status: 400 }
    );
  }

  // 2) Busque o customerId no Firestore
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const customerId = userDoc.data()?.customerId;
  if (!customerId) {
    return NextResponse.json(
      { error: "Customer ID not found for user" },
      { status: 400 }
    );
  }

  try {
    // 3) Atualize o default_payment_method do customer no Stripe
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    // 4) (Opcional) atualize no Firestore se quiser
    await adminDb.collection("users").doc(uid).update({
      defaultPaymentMethod: paymentMethodId,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro setting default PM:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
