// services/payment-history.ts
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";

export interface PaymentHistoryItem {
  id: string;
  date: Date;
  amount: number;
  currency?: string;
  status: string;
  cardLast4?: string | null;
  paymentId?: string;
  plan?: string;
  frequency?: string | null;
}

const db = getInitializedFirestore();

/**
 * Busca todos os registros de paymentHistory para o usuário logado
 */
export async function fetchPaymentHistory(): Promise<PaymentHistoryItem[]> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const col = collection(db, "users", user.uid, "paymentHistory");
  const snap = await getDocs(col);

  return snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    return {
      id:         doc.id,
      date:       (data.date as any)?.toDate ? (data.date as any).toDate() : new Date(data.date),
      amount:     data.amount,
      currency:   data.currency,
      status:     data.status,
      cardLast4:  data.cardLast4 ?? null,
      paymentId:  data.paymentId,
      plan:       data.plan,
      frequency:  data.frequency ?? null,
    };
  });
}
