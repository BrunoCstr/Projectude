"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  type DocumentReference,
} from "firebase/firestore";
import { listCollaborators } from "./collaborator";
import { getInitializedAuth } from "@/lib/firebase";
import { getInitializedFirestore } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

const db = getInitializedFirestore();
const auth = getInitializedAuth();

/**
 * Represents the possible statuses for a comment/task.
 */
export type CommentStatus = "Pending" | "In Progress" | "Paused" | "Completed";

/**
 * Represents a comment or task associated with a project.
 */
export interface Comment {
  /** Unique identifier for the comment. */
  id: string;
  /** ID of the project this comment belongs to. */
  projectId: string;
  /** Name of the project (denormalized for display). */
  project: string;
  /** The text content of the comment. */
  text: string;
  /** IDs of the users assigned to this comment/task (Optional). */
  assigneeIds?: string[];
  /** Names of the users assigned to this comment/task (Optional). */
  assignees?: string[];
  /** Current status of the comment/task. */
  status: CommentStatus; // Use the defined type
  /** Timestamp when the comment was created. */
  createdAt: string; // ISO date string
  /** Name of the user who created the comment. */
  creator: string;
  /** ID of the user who created the comment. */
  creatorId?: string; // Add creatorId
  /** Optional array of replies to this comment. */
  replies?: CommentReply[];
  /** Optional array of attachments. */
  attachments?: any[]; // Define attachment type later if needed
  /** Optional timestamp when the comment was archived. */
  archivedAt?: string;
}

/**
 * Represents a reply to a comment.
 */
export interface CommentReply {
  id: string;
  commentId: string; // ID of the parent comment
  user: string; // Name of the user who replied
  userId?: string; // Optional ID of the user
  photoURL?: string; // Optional avatar
  text: string;
  createdAt: any; // ISO date string
  attachments?: any[]; // Optional attachments for replies
  likeCount?: number;
  dislikeCount?: number;
  votes?: Record<string, "like" | "dislike">;
}

interface CreateCommentParams {
  projectId: string;
  commentText: string;
  assigneeIds?: string[];
  attachments?: any[];
}

interface CreateReplyParams {
  commentId: string;
  replyText: string;
}

interface UpdateCommentParams extends Partial<Comment> {
  id: string;
}

/**
 * Lista todos os comentários ativos (não arquivados) do Firestore.
 *
 * @returns Promise que resolve com um array de Comment.
 */
export async function listComments(userId: string): Promise<Comment[]> {
  const col = collection(db, "comments");

  // Busca todo mundo que é criador
  const q1 = query(col, where("creatorId", "==", userId));

  // Busca todo mundo que é assignee
  const q2 = query(col, where("assigneeIds", "array-contains", userId));

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const docs = [...snap1.docs, ...snap2.docs];

  // Converte em Map pra tirar duplicatas
  const map = new Map<string, Comment>();
  for (const docSnap of docs) {
    const data = docSnap.data() as any;
    // Se quiser ignorar comentários arquivados:
    if (data.archivedAt) continue;

    map.set(docSnap.id, {
      id: docSnap.id,
      ...data,
    } as Comment);
  }

  return Array.from(map.values());
}

/**
 * Lista todos os comentários arquivados, ordenados do mais recente ao mais antigo.
 *
 * @returns Promise que resolve com um array de Comment arquivados.
 */
export async function listArchivedComments(userId: string): Promise<Comment[]> {
  // 1) Monta a query: apenas docs com archivedAt definido
  const commentsRef = collection(db, "comments");
  const q1 = query(
    commentsRef,
    where("creatorId", "==", userId),
    where("archivedAt", "!=", null),
    orderBy("archivedAt", "desc")
  );
  const q2 = query(
    commentsRef,
    where("assigneeIds", "array-contains", userId),
    where("archivedAt", "!=", null),
    orderBy("archivedAt", "desc")
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const docs = [...snap1.docs, ...snap2.docs];
  const map = new Map<string, Comment>();
  for (const docSnap of docs) {
    map.set(docSnap.id, {
      id: docSnap.id,
      ...(docSnap.data() as any),
    } as Comment);
  }
  return Array.from(map.values());
}

/**
 * Asynchronously creates a new comment.
 * (Currently a mock function)
 *
 * @param commentData Data for the new comment (projectId, text, optional assigneeIds array).
 * @returns A promise that resolves to the newly created Comment object.
 */
export async function createComment({
  projectId,
  commentText,
  assigneeIds = [],
  attachments = [],
}: CreateCommentParams): Promise<Comment> {
  // 1) Usuário autenticado
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // 2) Busca nome do projeto para denormalizar
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);
  if (!projectSnap.exists()) {
    throw new Error("Projeto não encontrado");
  }
  const projectName = projectSnap.data().name as string;

  // 3) Converte assigneeIds em assignees (nomes)
  const allCollabs = await listCollaborators(user.uid);
  const assignees = assigneeIds
    .map((id) => allCollabs.find((c) => c.id === id)?.name)
    .filter((n): n is string => !!n);

  // 4) Monta o payload
  const payload = {
    projectId,
    project: projectName,
    text: commentText,
    assigneeIds,
    assignees,
    status: "Pending" as const,
    createdAt: new Date().toISOString(),
    creator: user.displayName || "",
    creatorId: user.uid,
    attachments,
  };

  // 5) Persiste no Firestore
  const commentRef = await addDoc(collection(db, "comments"), payload);

  // 6) Retorna o Comment completo
  return {
    id: commentRef.id,
    ...payload,
  };
}

/**
 * Atualiza apenas o campo de status de um comentário no Firestore.
 *
 * @param commentId ID do comentário a ser atualizado.
 * @param newStatus Novo status (e.g., 'Pending', 'In Progress', 'Paused', 'Completed').
 * @throws Erro se o comentário não existir.
 */
export async function updateCommentStatus(
  commentId: string,
  newStatus: CommentStatus
): Promise<any> {
  // 1) Referência ao documento de comentário
  const commentRef = doc(db, "comments", commentId);

  // 2) Verifica existência
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Atualiza somente o campo `status`
  await updateDoc(commentRef, {
    status: newStatus,
  });

  return { success: true };
}

/**
 * Asynchronously adds a reply to a comment.
 * (Currently a mock function that modifies the global mock array)
 *
 * @param commentId The ID of the comment to reply to.
 * @param replyText The text content of the reply.
 * @param userId The ID or name of the user posting the reply.
 * @returns A promise that resolves to the newly created CommentReply object.
 */
export async function createCommentReply({
  commentId,
  replyText,
}: CreateReplyParams): Promise<CommentReply> {
  // 1) Usuário autenticado
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // 2) Verifica se o comentário existe
  const commentRef = doc(db, "comments", commentId);
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Busca nome e avatar do usuário (via seu service de colaboradores)
  const allCollabs = await listCollaborators(user.uid);
  const me = allCollabs.find((c) => c.id === user.uid);
  const photoURL = me?.photoURL || user.photoURL || "";
  const displayName = me?.name || user.displayName || "";

  // 4) Monta payload da reply
  const payload = {
    commentId,
    user: displayName,
    userId: user.uid,
    photoURL: photoURL || "",
    text: replyText,
    createdAt: new Date().toISOString(),
  };

  // 5) Persiste no Firestore na subcoleção "replies"
  const repliesCol = collection(db, "comments", commentId, "replies");
  const replyRef = await addDoc(repliesCol, payload);

  // 6) Retorna o CommentReply completo
  return {
    id: replyRef.id,
    ...payload,
  };
}

/**
 * Asynchronously updates an existing comment.
 * (Currently a mock function)
 *
 *  * Atualiza um comentário existente no Firestore.
 * @param updatedData Objeto com ao menos o campo `id` e quaisquer outros campos de Comment a atualizar.
 * @returns O objeto Comment completo e atualizado.
 */

export async function updateComment({
  id,
  assigneeIds,
  ...rest
}: UpdateCommentParams): Promise<Comment> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  // 1) Referência ao documento
  const commentRef = doc(db, "comments", id);

  // 2) Verifica existência
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Se vier assigneeIds, monta também o array assignees (nomes)
  let assignees: string[] | undefined = undefined;
  if (assigneeIds) {
    const allCollabs = await listCollaborators(user.uid);
    assignees = assigneeIds
      .map((aid) => allCollabs.find((c) => c.id === aid)?.name)
      .filter((n): n is string => !!n);
  }

  // 4) Prepara o payload de atualização
  const payload: Partial<Comment> = {
    ...rest,
    ...(assigneeIds !== undefined ? { assigneeIds, assignees } : {}),
  };

  // 5) Persiste no Firestore com merge
  await setDoc(commentRef, payload, { merge: true });

  // 6) Recarrega e retorna o objeto completo
  const updatedSnap = await getDoc(commentRef);
  return {
    id: updatedSnap.id,
    ...(updatedSnap.data() as Omit<Comment, "id">),
  };
}

/**
 * Asynchronously archives a comment, moving it from the active list to the archived list.
 * (Currently a mock function that mutates the global arrays)
 *
 * Arquiva um comentário existente, gravando a timestamp em `archivedAt`.
 * @param commentId ID do comentário a ser arquivado.
 * @throws Se o comentário não existir.
 */
export async function archiveComment(commentId: string): Promise<void> {
  // 1) Referência ao documento
  const commentRef = doc(db, "comments", commentId);

  // 2) Verifica existência
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Marca com a data de arquivamento
  await updateDoc(commentRef, {
    archivedAt: serverTimestamp(),
  });
}

/**
 * Asynchronously unarchives a comment, moving it from the archived list back to the active list.
 * (Currently a mock function)
 *
 *  * @param commentId ID do comentário a ser desarquivado.
 * @throws Erro se o comentário não existir.
 */
export async function unarchiveComment(commentId: string): Promise<void> {
  // 1) Referência ao documento
  const commentRef = doc(db, "comments", commentId);

  // 2) Verifica existência
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Remove o campo archivedAt
  await updateDoc(commentRef, {
    archivedAt: deleteField(),
  });
}

/**
 * Asynchronously updates a comment reply.
 * (Currently a mock function)
 *
 * * @param commentId ID do comentário-pai onde a reply está.
 * @param replyId   ID da reply que será atualizada.
 * @param newText   Novo conteúdo de texto da reply.
 * @returns Promise que resolve com o objeto CommentReply atualizado.
 * @throws Erro se o documento da reply não for encontrado.
 */
export async function updateCommentReply(
  commentId: string,
  replyId: string,
  newText: string
): Promise<CommentReply> {
  // 1) Referência ao documento de reply
  const replyRef = doc(db, "comments", commentId, "replies", replyId);

  // 2) Verifica existência
  const snap = await getDoc(replyRef);
  if (!snap.exists()) {
    throw new Error("Reply not found");
  }

  // 3) Executa o update (e atualiza campo updatedAt)
  await updateDoc(replyRef, {
    text: newText,
    updatedAt: serverTimestamp(),
  });

  // 4) Recarrega e retorna o objeto completo
  const updatedSnap = await getDoc(replyRef);
  return {
    id: updatedSnap.id,
    ...(updatedSnap.data() as Omit<CommentReply, "id">),
  };
}

/**
 * Asynchronously deletes a comment reply.
 * (Currently a mock function that mutates the global array)
 * @param commentId ID do comentário a ser removido.
 * @throws Erro se o comentário não existir.
 */
export async function deleteComment(commentId: string): Promise<void> {
  // 1) Referência ao documento
  const commentRef = doc(db, "comments", commentId);

  // 2) Verifica existência
  const snap = await getDoc(commentRef);
  if (!snap.exists()) {
    throw new Error("Comentário não encontrado");
  }

  // 3) Remove o documento
  await deleteDoc(commentRef);
}

/**
 * Deleta uma reply de comentário no Firestore.
 *
 * @param commentId ID do comentário-pai onde a reply está.
 * @param replyId   ID da reply que será deletada.
 * @throws Erro se o documento da reply não for encontrado.
 */
export async function deleteCommentReply(
  commentId: string,
  replyId: string
): Promise<void> {
  // 1) Referência ao documento de reply
  const replyRef = doc(db, "comments", commentId, "replies", replyId);

  // 2) Verifica existência
  const snap = await getDoc(replyRef);
  if (!snap.exists()) {
    throw new Error("Reply not found");
  }

  // 3) Deleta o documento
  await deleteDoc(replyRef);
}

export async function listAllRepliesForComments(
  commentIds: string[]
): Promise<CommentReply[]> {
  const allReplies: CommentReply[] = [];

  for (const commentId of commentIds) {
    const repliesRef = collection(db, "comments", commentId, "replies");
    const snapshot = await getDocs(repliesRef);

    const replies = snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt ?? Date.now());

      return {
        id: doc.id,
        commentId,
        text: data.text,
        user: data.user,
        photoURL: data.photoURL || null,
        createdAt,
        likeCount: data.likeCount,
        dislikeCount: data.dislikeCount,
        votes: data.votes || {},
      } as CommentReply;
    });

    allReplies.push(...replies);
  }

  return allReplies;
}

// services/reply.ts

import {
  runTransaction,
} from "firebase/firestore";

type VoteType = "like" | "dislike";

/**
 * Atualiza o voto do usuário autenticado numa reply.  
 *
 * Se o user já tinha votado do mesmo tipo, isso remove o voto (unvote).  
 * Se o user estava em "like" e agora clica "dislike", ajusta ambos contadores.  
 *
 * @param commentId  Id do comentário pai
 * @param replyId    Id da reply
 * @param userId     Id do usuário que está votando
 * @param newVote    "like" ou "dislike"
 *
 * @returns Promise que resolve quando a transação terminar.  
 *          Se der erro por concorrência, ele faz retry automático.
 */
export async function toggleReplyVote(
  commentId: string,
  replyId: string,
  userId: string,
  newVote: VoteType
): Promise<{
  likeCount: number;
  dislikeCount: number;
  currentUserVote: "like" | "dislike" | null;
}> {
  // Referência ao documento da reply
  const replyRef: DocumentReference = doc(
    db,
    "comments",
    commentId,
    "replies",
    replyId
  );

  return runTransaction(db, async (transaction) => {
    // 1) Lê o documento com dados atuais
    const replySnapshot = await transaction.get(replyRef);
    if (!replySnapshot.exists()) {
      throw new Error("Reply não encontrada");
    }

    const data = replySnapshot.data() as any;

    // 2) Extrai contadores atuais e o mapa de votos
    const prevLikeCount: number = data.likeCount ?? 0;
    const prevDislikeCount: number = data.dislikeCount ?? 0;
    const prevVotes: Record<string, VoteType> = data.votes ?? {};

    // 3) Descobre como este usuário votou antes (se votou)
    const prevVote: VoteType | null =
      prevVotes[userId] !== undefined ? (prevVotes[userId] as VoteType) : null;

    let newLikeCount = prevLikeCount;
    let newDislikeCount = prevDislikeCount;
    const newVotes: Record<string, VoteType> = { ...prevVotes };

    if (prevVote === newVote) {
      // o usuário clicou novamente no mesmo botão => “unvote”
      // ex.: se prevVote === "like" e user clica em "like" outra vez, significa remover o like
      if (newVote === "like") {
        newLikeCount = Math.max(0, prevLikeCount - 1);
      } else {
        newDislikeCount = Math.max(0, prevDislikeCount - 1);
      }
      // Remove a chave do mapa
      delete newVotes[userId];
    } else {
      // Se o usuário tinha votado antes do outro tipo, ajusta ambos
      if (prevVote === "like") {
        // estava curtindo, agora ele quer dar dislike (ou apenas trocar)
        newLikeCount = Math.max(0, prevLikeCount - 1);
      } else if (prevVote === "dislike") {
        newDislikeCount = Math.max(0, prevDislikeCount - 1);
      }

      // Agora aplica o novo voto
      if (newVote === "like") {
        newLikeCount = prevLikeCount + 1 - (prevVote === "like" ? 1 : 0);
        // Mas se prevVote era "dislike", decrementamos dislike acima e incrementamos like agora
        // O Math.max já cuidou de não ir negativo
        // Então basta:
        if (prevVote !== "like") {
          newLikeCount = prevLikeCount + 1;
        }
      } else {
        newDislikeCount = prevDislikeCount + 1 - (prevVote === "dislike" ? 1 : 0);
        if (prevVote !== "dislike") {
          newDislikeCount = prevDislikeCount + 1;
        }
      }

      // Ajusta o mapa para refletir o novo voto
      newVotes[userId] = newVote;
    }

    // 4) Prepara objeto de atualização
    const updateData: any = {
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount,
      // Use **FieldValue.delete()** para chaves removidas, mas aqui já deletamos em newVotes
      // portanto basta reatribuir o mapa inteiro:
      votes: newVotes,
    };

    // 5) Executa a atualização atômica
    transaction.update(replyRef, updateData);

    return {
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount,
      currentUserVote:
        newVotes[userId] !== undefined ? newVotes[userId] : null,
    };
  });
}
