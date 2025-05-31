import { db, auth } from "./config"; // Import Firestore & Auth instances
import type { UserRecord } from "firebase-admin/auth"; // Import UserRecord type
import { firestore } from "firebase-functions/v2";
import {
  FirestoreEvent,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  Change,
} from "firebase-functions/v2/firestore";
import { createTranslator } from "use-intl/core";
import pt from "../messages/pt.json";
import en from "../messages/en.json";
import es from "../messages/es.json";
import fr from "../messages/fr.json";

type Translations = typeof pt | typeof en | typeof es | typeof fr;

const supportedLocales = ["pt", "en", "es", "fr"] as const;

type Locale = (typeof supportedLocales)[number];

const MESSAGES: Record<Locale, Translations> = {
  pt,
  en,
  es,
  fr,
};

function isLocale(lang: any): lang is Locale {
  return supportedLocales.includes(lang);
}

// Function to find user ID by email using Firebase Auth Admin SDK
async function findUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  try {
    const userRecord: UserRecord = await auth.getUserByEmail(email);
    return userRecord.uid;
  } catch (error: any) {
    // 'auth/user-not-found' is expected if the email doesn't exist
    if (error.code === "auth/user-not-found") {
      console.log(`User not found for email: ${email}`);
    } else {
      console.error(`Error fetching user by email (${email}):`, error);
    }
    return null;
  }
}

// Function to create a notification document for a user
const createNotification = async (
  userId: string,
  type: string,
  message: string,
  link?: string
) => {
  if (!userId) {
    console.error(
      "Attempted to create notification for null/undefined userId."
    );
    return;
  }

  // Buscar preferências do usuário
  const userDoc = await db.collection("users").doc(userId).get();
  const prefs = userDoc.data()?.notificationPreferences ?? {};

  // Se a preferência do tipo for false, não envia
  if (prefs[type] === false) {
    console.log(
      `User ${userId} desativou notificações do tipo "${type}". Não será enviada.`
    );
    return;
  }

  const notificationRef = db
    .collection("users")
    .doc(userId)
    .collection("notifications");
  try {
    await notificationRef.add({
      type,
      message,
      link: link || null,
      timestamp: new Date(), // Use server timestamp
      read: false,
    });
    console.log(`Notification created for user ${userId}: ${message}`);
  } catch (error) {
    console.error(`Error creating notification for user ${userId}:`, error);
  }
};

// --- Trigger Functions ---

// 1. Send notification on new invitation
export const sendNotificationOnNewInvite = firestore.onDocumentCreated(
  "invitations/{invitationId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;

    if (!snap) {
      console.error(
        "Snapshot data não encontrado para:",
        event.params.invitationId
      );
      return;
    }

    const invitation = snap.data();

    if (!invitation) {
      console.error("Invitation data não encontrado para:", snap.id);
      return;
    }

    const recipientEmail = invitation.recipientEmail; // Assuming email is stored
    const inviterName = invitation.inviterName || "Someone";

    if (!recipientEmail) {
      console.error("Recipient email not found in invitation:", snap.id);
      return;
    }

    // Find the reo change data available for projectcipient's user ID using their email
    const recipientUserId = await findUserIdByEmail(recipientEmail);

    if (!recipientUserId) {
      console.warn(
        `Could not find user ID for recipient email: ${recipientEmail}. Notification not sent.`
      );
      // Optionally, store the pending notification elsewhere or retry later
      return;
    }

    const userDoc = await db.collection("users").doc(recipientUserId).get();
    const prefLang = userDoc.data()?.preferences?.language;

    const locale: Locale = isLocale(prefLang) ? prefLang : "en";

    const t = createTranslator({
      locale,
      messages: MESSAGES[locale],
    });

    const message = `${inviterName} ${t(
      "cloudFunctionsNotifications.message1"
    )}`;
    // Link to collaborators page where they can accept/decline
    await createNotification(
      recipientUserId,
      "invite",
      message,
      "/collaborators"
    );
  }
);

// 2. Send notification on comment changes (new, status change)
//    Does NOT handle replies here, see sendNotificationOnReply below.
export const sendNotificationOnCommentUpdate = firestore.onDocumentWritten(
  "comments/{commentId}",
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    const beforeSnap = event.data?.before;
    const afterSnap = event.data?.after;

    const beforeData = beforeSnap?.data();
    const afterData = afterSnap?.data();

    if (!afterSnap || !afterData) {
      console.log(
        `Comment ${beforeSnap?.id} deleted. Handling potential notifications (optional).`
      );
      return;
    }

    const commentId = afterSnap.id;
    const authorName = afterData.creator || "Someone";
    const authorId = afterData.creatorId;
    const projectName = afterData.project || "a project";
    const assigneeIds: string[] = afterData.assigneeIds || [];
    const commentTextSnippet = afterData.text?.substring(0, 30) + "...";
    const link = `/comments?commentId=${commentId}`;

    const userDoc = await db.collection("users").doc(authorId).get();
    const prefLang = userDoc.data()?.preferences?.language;

    const locale: Locale = isLocale(prefLang) ? prefLang : "en";

    const t = createTranslator({
      locale,
      messages: MESSAGES[locale],
    });

    // Case 1: New Comment Created and Assigned
    if (!beforeSnap?.exists && assigneeIds.length > 0) {
      const message = `${authorName} ${t(
        "cloudFunctionsNotifications.message4.assigned"
      )} \"${projectName}\": \"${commentTextSnippet}\"`;

      for (const userId of assigneeIds) {
        if (userId !== authorId) {
          await createNotification(userId, "comment_new", message, link);
        }
      }
    }

    // Case 2: Comment Status Changed
    if (beforeSnap?.exists && beforeData?.status !== afterData.status) {
      const message = `${t(
        "cloudFunctionsNotifications.message5.statusChanged"
      )} \"${commentTextSnippet}\" ${t(
        "cloudFunctionsNotifications.message5.inProject"
      )} \"${projectName}\" ${t(
        "cloudFunctionsNotifications.message5.changedTo"
      )} \"${afterData.status}\".`;

      for (const userId of assigneeIds) {
        await createNotification(userId, "comment_status", message, link);
      }

      if (!assigneeIds.includes(authorId)) {
        await createNotification(authorId, "comment_status", message, link);
      }
    }

    // Case 3: Comment Text Edited
    if (beforeSnap?.exists && beforeData?.text !== afterData.text) {
      const message = `${authorName} ${t(
        "cloudFunctionsNotifications.message6.edited"
      )} \"${projectName}\": \"${commentTextSnippet}\"`;

      for (const userId of assigneeIds) {
        await createNotification(userId, "comment_update", message, link);
      }
    }

    // Case 4: Assignees Changed
    if (beforeSnap?.exists) {
      const oldAssignees = new Set(beforeData?.assigneeIds || []);
      const newAssignees = new Set(afterData.assigneeIds || []);

      for (const userId of newAssignees) {
        if (!oldAssignees.has(userId) && userId !== authorId) {
          const message = `${authorName} ${t(
            "cloudFunctionsNotifications.message7.assignedYou"
          )} \"${projectName}\": \"${commentTextSnippet}\"`;

          for (const userId of assigneeIds) {
            if (typeof userId === "string" && userId !== authorId) {
              await createNotification(userId, "comment_new", message, link);
            }
          }
        }
      }
    }
  }
);

// 3. Send notification on new Reply
export const sendNotificationOnReply = firestore.onDocumentCreated(
  "comments/{commentId}/replies/{replyId}",
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined>) => {
    const snap = event.data;
    const { commentId, replyId } = event.params;

    if (!snap || !snap.exists) {
      console.error(`Reply snapshot not found for comment ${commentId}`);
      return;
    }

    const reply = snap.data();

    if (!reply) {
      console.error(
        `Reply data is missing for: ${snap.id} in comment ${commentId}`
      );
      return;
    }

    const replierName = reply.user || "Someone";
    const replierId = reply.userId;

    // Buscar o comentário pai
    const commentRef = db.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      console.error(
        `Parent comment ${commentId} not found for reply ${snap.id}`
      );
      return;
    }

    const commentData = commentSnap.data();

    if (!commentData) {
      console.error(`Parent comment data missing for ${commentId}`);
      return;
    }

    const commentCreatorId = commentData.creatorId;
    const commentAssigneeIds = (commentData.assigneeIds || []) as string[];
    const projectName = commentData.project || "a project";
    const link = `/comments?commentId=${commentId}&replyId=${replyId}`;

    const userDoc = await db.collection("users").doc(commentCreatorId).get();
    const prefLang = userDoc.data()?.preferences?.language;

    const locale: Locale = isLocale(prefLang) ? prefLang : "en";

    const t = createTranslator({
      locale,
      messages: MESSAGES[locale],
    });

    const replyTextSnippet = reply.text?.substring(0, 30) + "...";
    const message = `${replierName} ${t(
      "cloudFunctionsNotifications.message12.replied"
    )} \"${projectName}\": \"${replyTextSnippet}\"`;

    const usersToNotify = new Set<string>();

    if (
      typeof commentCreatorId === "string" &&
      commentCreatorId !== replierId
    ) {
      usersToNotify.add(commentCreatorId);
    }

    for (const assigneeId of commentAssigneeIds) {
      if (typeof assigneeId === "string" && assigneeId !== replierId) {
        usersToNotify.add(assigneeId);
      }
    }

    // Envia as notificações
    for (const userId of usersToNotify) {
      if (typeof userId === "string") {
        await createNotification(userId, "comment_reply", message, link);
      }
    }
  }
);

// 4. Send notification on project status change or other updates
export const sendNotificationOnProjectUpdate = firestore.onDocumentUpdated(
  "projects/{projectId}",
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    const change = event.data;
    const { projectId } = event.params;

    if (!change) {
      console.error("No change data available for project", projectId);
      return;
    }

    const beforeSnap = change.before;
    const afterSnap = change.after;

    const beforeData = beforeSnap.data();
    const afterData = afterSnap.data();

    if (!beforeData || !afterData) {
      return; // Deveria sempre ter dados em onUpdate
    }

    const projectName = afterData.name || "A project";
    const ownerId = afterData.ownerId;
    const collaboratorIds = (afterData.collaboratorIds || []) as string[];
    const link = `/my-projects?projectId=${projectId}`;

    const userDoc = await db.collection("users").doc(ownerId).get();
    const prefLang = userDoc.data()?.preferences?.language;

    const locale: Locale = isLocale(prefLang) ? prefLang : "en";

    const t = createTranslator({
      locale,
      messages: MESSAGES[locale],
    });

    // Caso 1: Mudança de status
    if (beforeData.status !== afterData.status) {
      const newStatus = afterData.status || "an unknown status";
      const message = `${t(
        "cloudFunctionsNotifications.message13.statusUpdated"
      )} \"${projectName}\" ${t(
        "cloudFunctionsNotifications.message13.updatedTo"
      )} \"${newStatus}\".`;

      if (typeof ownerId === "string") {
        await createNotification(ownerId, "project_update", message, link);
      }

      for (const userId of collaboratorIds) {
        if (userId !== ownerId && typeof userId === "string") {
          await createNotification(userId, "project_update", message, link);
        }
      }
    }

    // Caso 2: Novos colaboradores adicionados
    const oldCollaborators = new Set(beforeData.collaboratorIds || []);
    const newCollaborators = new Set(afterData.collaboratorIds || []);

    for (const userId of newCollaborators) {
      if (!oldCollaborators.has(userId) && typeof userId === "string") {
        const message = `${t(
          "cloudFunctionsNotifications.message14.addedAsCollaborator"
        )} \"${projectName}\".`;
        await createNotification(
          userId,
          "project_invite_accepted",
          message,
          link
        );
      }
    }
  }
);
