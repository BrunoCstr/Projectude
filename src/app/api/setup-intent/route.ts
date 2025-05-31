import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { uid } = await request.json();

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  // 1) Carrega ou cria o Stripe Customer para esse usuário
  const userDoc = await adminDb.collection("users").doc(uid).get();
  let customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { uid } });
    customerId = customer.id;

    await adminDb
      .collection("users")
      .doc(uid)
      .set({ stripeCustomerId: customerId }, { merge: true });
  }

  console.log("🧪 Criando SetupIntent para customerId:", customerId);
  console.log("🔑 Stripe key ativa:", process.env.STRIPE_SECRET_KEY);

  try {
    // 2) Cria o SetupIntent
    const intent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
    });

    // 3) Retorna client_secret
    return NextResponse.json({ clientSecret: intent.client_secret! });
  } catch (error) {
    console.error("❌ Erro ao criar SetupIntent:", error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
