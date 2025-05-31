// app/api/stripe/webhook/route.ts
import { buffer } from "stream/consumers"; // só para os tipos de Node.js, não usado de fato
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// Inicializa Firebase Admin (se ainda não inicializou)
const db = adminDb;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Este handler roda no Node.js (não é edge), pois precisamos do raw body
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 1) lê o corpo como texto cru
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2) Só tratamos o evento de sessão de checkout concluída
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const uid = session.metadata?.uid as string | undefined;
    const billingFrequency = session.metadata?.billingFrequency as string | undefined;
    const paid = session.payment_status === "paid";

    if (uid) {
      try {
        const txRef = db
          .collection("users")
          .doc(uid)
          .collection("transactions")
          .doc(sessionId);
        await txRef.set(
          {
            status: paid ? "completed" : "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentIntent: session.payment_intent,
          },
          { merge: true }
        );

        if (paid) {
          // 2) Atualiza o plano do usuário para Premium
          await db.collection("users").doc(uid).set(
            {
              currentPlan: "Premium",
              subscriptionId: session.subscription,
              planChangedAt: admin.firestore.FieldValue.serverTimestamp(),
              billingFrequency
            },
            { merge: true }
          );
        }
      } catch (error: any) {
        console.error("❌ Erro ao gravar no Firestore:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  // 3) responde ao Stripe
  return NextResponse.json({ received: true });
}
