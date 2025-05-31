import { loadStripe, StripeCardElement, Stripe } from "@stripe/stripe-js";
import {
  addCardToFirestore,
  deleteCardFromFirestore,
  setPrimaryCardInFirestore,
  SavedCard,
} from "@/services/payment-method-firestore";
import { getAuth } from "firebase/auth";
// Import your UI handlers (adjust paths accordingly)

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUB_KEY;

export const stripePromise = loadStripe(publishableKey!);

export async function addPaymentMethodFlow(
  stripe: Stripe,
  cardElement: StripeCardElement,
  cardholderName: string
): Promise<SavedCard | null> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  try {
    // 1. Obter o clientSecret do SetupIntent
    const siRes = await fetch("/api/setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid }),
    });

    if (!siRes.ok) throw new Error("Falha ao criar SetupIntent");

    const { clientSecret } = await siRes.json();

    // 2. Confirmar setup com o CardElement
    const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      },
    });

    if (error) throw error;

    // 3. Buscar os detalhes do payment method
    const pmRes = await fetch(
      `/api/payment-method?paymentMethodId=${setupIntent.payment_method}`
    );

    if (!pmRes.ok) {
      const text = await pmRes.text();
      throw new Error(`Erro ao buscar payment method: ${text}`);
    }

    const pmData: any = await pmRes.json();

    const newCard: SavedCard = {
      id: pmData.id,
      last4: pmData.card.last4,
      brand: pmData.card.brand,
      expMonth: pmData.card.exp_month,
      expYear: pmData.card.exp_year,
      isPrimary: false,
    };

    // 4. Salvar no Firestore
    await addCardToFirestore(newCard);

    return newCard;
  } catch (err: any) {
    console.error(
      "Erro ao adicionar cartão:",
      JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    return null;
  }
}

/**
 * 1) Desanexa do Stripe via servidor
 * 2) Remove do Firestore
 * 3) Atualiza UI
 */
export async function deletePaymentMethodFlow(cardId: string) {
  try {
    // 1) Desanexa no Stripe
    await fetch("/api/detach-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId: cardId }),
    });

    // 2) Deleta do Firestore
    await deleteCardFromFirestore(cardId);

    // 3) Atualiza UI
  } catch (err: any) {
    console.error("Erro ao deletar cartão:", err);
  }
}

export async function setPrimaryPaymentMethodFlow(cardId: string) {
  const user = getAuth().currentUser;

  if (!user?.uid) {
    console.error("User not authenticated");
  }

  try {
    // 1) Seta default no Stripe
    await fetch("/api/set-default-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId: cardId, uid: user?.uid }),
    });

    // 2) Atualiza no Firestore
    await setPrimaryCardInFirestore(cardId);
  } catch (err: any) {
    console.error("Erro ao definir principal:", err);
  }
}
