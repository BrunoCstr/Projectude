// app/api/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

type BillingFrequency = "monthly" | "annually" | "biannually";

// seu mapeamento de Price IDs por frequência e moeda
const PRICE_IDS: Record<
  BillingFrequency,
  Record<"BRL" | "EUR" | "USD", string>
> = {
  monthly: {
    BRL: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID_SAM!,
    EUR: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID_EU!,
    USD: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID_USA!,
  },
  annually: {
    BRL: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID_SAM!,
    EUR: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID_EU!,
    USD: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID_USA!,
  },
  biannually: {
    BRL: process.env.NEXT_PUBLIC_STRIPE_BIANNUALLY_PRICE_ID_SAM!,
    EUR: process.env.NEXT_PUBLIC_STRIPE_BIANNUALLY_PRICE_ID_EU!,
    USD: process.env.NEXT_PUBLIC_STRIPE_BIANNUALLY_PRICE_ID_USA!,
  },
};

const SOUTH_AMERICA = new Set([
  "AR",
  "BR",
  "CL",
  "CO",
  "PE",
  "UY",
  "VE",
  "EC",
  "BO",
  "PY",
  "GY",
  "SR",
]);
const EUROPE = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "GB",
]);

function currencyForCountry(country: string): "BRL" | "EUR" | "USD" {
  if (SOUTH_AMERICA.has(country)) return "BRL";
  if (EUROPE.has(country)) return "EUR";
  return "USD";
}

export async function POST(request: NextRequest) {
  try {
    const { uid, billingFrequency } = (await request.json()) as {
      uid: string;
      billingFrequency: BillingFrequency;
    };

    // Aqui estou pegando a localização do usuário de três maneiras diferentes...
    // 1) Geo nativo (apenas no vero Edge)
    const geoCountry = (request as any).geo?.country;

    // 2) Header que o Vercel injeta
    const vercelCountry = request.headers
      .get("x-vercel-ip-country")
      ?.toUpperCase();

    // 3) Fallback no Accept-Language (pt-BR → BR, en-US → US, etc)
    const acceptLang = request.headers
      .get("accept-language")
      ?.split(",")[0] // pega primeiro valor
      .split(";")[0] // remove qualquer weight
      .split("-")[1] // ex: "pt-BR" → "BR"
      ?.toUpperCase();

    const country = geoCountry || vercelCountry || acceptLang || "US"; // último recurso

    console.log("País detectado:", country);

    // 2) Decide a moeda
    const currency = currencyForCountry(country);

    // 3) Busca o Price ID correto
    const priceId = PRICE_IDS[billingFrequency][currency];
    if (!priceId) {
      return NextResponse.json(
        { error: "Configuração de preço inválida" },
        { status: 500 }
      );
    }

    // 4) Cria sessão de Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get("origin")}/settings`,
      cancel_url: `${request.headers.get("origin")}/settings`,
      metadata: { uid, billingFrequency },
    });

    return NextResponse.json({ url: session.url!, sessionId: session.id });
  } catch (err: any) {
    console.error("Erro criando sessão Stripe:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
