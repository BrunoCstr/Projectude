'use client'

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getInitializedFirestore } from "@/lib/firebase"; // seu arquivo de inicialização do Firebase
import { collection, getDocs, query, orderBy, limit, where, writeBatch } from "firebase/firestore";

/**
 * Represents a notification type.
 */
export type NotificationType =
  | "invite"
  | "project_update"
  | "comment_new"
  | "comment_reply"
  | "comment_status"
  | "system_alert"
  | "other";

/**
 * Represents a notification object.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

function convertDocToNotification(doc: any): Notification {
  const data = doc.data();
  return {
    id: doc.id,
    type: data.type,
    message: data.message,
    timestamp: data.timestamp.toDate(),
    read: data.read,
    link: data.link,
  };
}

/**
 * Retorna as 10 notificações mais recentes de um usuário.
 * @param userId ID do usuário no Firestore.
 */
export async function getNotifications(
  userId: string
): Promise<Notification[]> {
  const db = getInitializedFirestore();
  const userNotificationsRef = collection(db, "users", userId, "notifications");

  const q = query(
    userNotificationsRef,
    orderBy("timestamp", "desc"),
    limit(10)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(convertDocToNotification);
}

/**
 * Asynchronously retrieves all notifications, sorted by timestamp descending.
 *
 * @returns A promise that resolves to an array of all Notification objects.
 */
export async function getAllNotifications(
  userId: string
): Promise<Notification[]> {
  const db = getInitializedFirestore();
  const userNotificationsRef = collection(db, "users", userId, "notifications");

  const q = query(userNotificationsRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(convertDocToNotification);
}

/**
 * Groups notifications by month and year (e.g., "July 2024").
 *
 * @param notifications An array of Notification objects.
 * @returns An object where keys are month-year strings and values are arrays of notifications for that month.
 */
export function groupNotificationsByMonth(
  notifications: Notification[]
): Record<string, Notification[]> {
  const grouped: Record<string, Notification[]> = {};
  notifications.forEach((notification) => {
    const monthYear = format(notification.timestamp, "MMMM yyyy", {
      locale: ptBR,
    });
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(notification);
  });
  return grouped;
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Marca todas as notificações não lidas como lidas para um determinado usuário.
 * @param userId ID do usuário autenticado.
 */
export async function markAllNotificationsAsRead(userId: string) {
  const db = getInitializedFirestore();
  const notificationsRef = collection(db, "users", userId, "notifications");
  const q = query(notificationsRef, where("read", "==", false));

  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.forEach((docRef) => {
    batch.update(docRef.ref, { read: true });
  });

  await batch.commit();
}
