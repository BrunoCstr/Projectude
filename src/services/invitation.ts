"use client";

import type {
  Invitation,
  Collaborator,
  CollaboratorProfile,
} from "./collaborator"; // Import related types
import { mockCollaborators, mockProfiles } from "./collaborator"; // Import mock data arrays
import { getInitializedAuth } from "@/lib/firebase";
import { getInitializedFirestore } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

const auth = getInitializedAuth();
const db = getInitializedFirestore();

/**
 * Asynchronously retrieves a list of pending invitations for the current user.
 * (Currently a mock function returning only pending invitations)
 *
 * @returns A promise that resolves to an array of pending Invitation objects.
 */
export async function listInvitations(): Promise<Invitation[]> {
  const me = auth.currentUser;
  if (!me) throw new Error("Usuário não autenticado.");

  // Referência à subcoleção de convites do usuário logado
  const invitesRef = collection(db, "users", me.uid, "invitations");

  // Query: só convites com status 'pending', ordenados do mais recente
  const q = query(
    invitesRef,
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  // Mapeia cada doc para a interface Invitation
  return snap.docs.map((docSnap) => {
    const data = docSnap.data() as {
      inviterId: string;
      inviterName: string;
      inviterEmail: string;
      inviterAvatarUrl?: string;
      status: "pending" | "accepted" | "declined";
      createdAt: Timestamp;
    };

    return {
      id: docSnap.id,
      inviterId: data.inviterId,
      inviterName: data.inviterName,
      inviterEmail: data.inviterEmail,
      inviterAvatarUrl: data.inviterAvatarUrl,
      status: data.status,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

/**
 * Accepts a collaboration invitation.
 * (Currently a mock function that updates the in-memory array)
 *
 * @param invitationId The ID of the invitation to accept.
 * @returns A promise that resolves when the invitation is accepted (or simulated).
 * @throws An error if the invitation is not found or cannot be accepted.
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error("Usuário não autenticado.");

  // 1) Recupera o documento de convite do usuário atual
  const inviteRef = doc(db, "users", me.uid, "invitations", invitationId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) {
    throw new Error("Convite não encontrado.");
  }
  const inviteData = inviteSnap.data() as {
    inviterId: string;
    status: "pending" | "accepted" | "declined";
  };

  if (inviteData.status !== "pending") {
    throw new Error(`Convite já está com status '${inviteData.status}'.`);
  }

  // 2) Atualiza o status do convite para 'accepted'
  await updateDoc(inviteRef, {
    status: "accepted",
    respondedAt: serverTimestamp(),
  });

  // 3) Adiciona o usuário atual (me.uid) como colaborador na conta de quem convidou
  const collaboratorsRef = collection(
    db,
    "users",
    inviteData.inviterId,
    "collaborators"
  );
  // Usa setDoc com chave me.uid para evitar duplicidade
  await setDoc(doc(collaboratorsRef, me.uid), {
    id: me.uid,
    canViewCredentials: false,
    addedAt: serverTimestamp(),
  });

  toast({
    title: "Convite aceito!",
    description: `Agora você é um colaborador de ${inviteData.inviterId}.`,
  });
}

/**
 * Declines a collaboration invitation.
 * (Currently a mock function that updates the in-memory array)
 *
 * @param invitationId The ID of the invitation to decline.
 * @returns A promise that resolves when the invitation is declined (or simulated).
 * @throws An error if the invitation is not found or cannot be declined.
 */
export async function declineInvitation(invitationId: string): Promise<void> {
  const me = auth.currentUser;
  if (!me) throw new Error("Usuário não autenticado.");

  // 1) Recupera o documento do convite
  const inviteRef = doc(db, "users", me.uid, "invitations", invitationId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) {
    throw new Error("Convite não encontrado.");
  }

  const data = inviteSnap.data() as { status: string };
  if (data.status !== "pending") {
    throw new Error(`Convite já está com status '${data.status}'.`);
  }

  // 2) Atualiza o status para 'declined' e marca a hora da resposta
  await updateDoc(inviteRef, {
    status: "declined",
    respondedAt: serverTimestamp(),
  });

  toast({
    title: "Feito!",
    description: `Convite recusado.`,
  });
}
