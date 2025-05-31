// lib/firestore.ts
import { getAuth } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";

const db = getInitializedFirestore();

export interface SavedCard {
  id: string; // é o payment_method.id do Stripe
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isPrimary: boolean;
}

/**
 * Persiste um cartão no sub-collection `paymentMethods` do usuário.
 */
export async function addCardToFirestore(card: SavedCard) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const ref = doc(db, "users", user.uid, "paymentMethods", card.id);
  await setDoc(ref, {
    last4: card.last4,
    brand: card.brand,
    expMonth: card.expMonth,
    expYear: card.expYear,
    isPrimary: card.isPrimary,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCardFromFirestore(cardId: string) {
  const user = getAuth().currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const ref = doc(db, "users", user.uid, "paymentMethods", cardId);
  await deleteDoc(ref);
}

export async function setPrimaryCardInFirestore(cardId: string) {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const pmCollection = collection(db, "users", user.uid, "paymentMethods");
  const snapshot = await getDocs(pmCollection);

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const ref = doc(db, "users", user.uid, "paymentMethods", docSnap.id);
    const isPrimary = docSnap.id === cardId;
    batch.update(ref, { isPrimary });
  });

  await batch.commit();
}

export async function fetchPaymentMethods(): Promise<SavedCard[]> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const colRef = collection(db, "users", user.uid, "paymentMethods");
  const snap = await getDocs(colRef);

  return snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    return {
      id: doc.id,
      last4: data.last4,
      brand: data.brand,
      expMonth: data.expMonth,
      expYear: data.expYear,
      isPrimary: data.isPrimary,
    };
  });
}

