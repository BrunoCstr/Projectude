/**
 * Import function triggers from their respective submodules:
 */
import {
  sendNotificationOnNewInvite,
  sendNotificationOnCommentUpdate,
  sendNotificationOnProjectUpdate,
  sendNotificationOnReply,
} from "./notifications";

import { createPaymentHistoryOnPlanChange } from "./payments";

// Remove unused import to fix TypeScript warning
import { dbCreateOrUpdateFirestoreUser } from "./user-management";

// Export notification functions
export {
  sendNotificationOnNewInvite,
  sendNotificationOnCommentUpdate,
  sendNotificationOnProjectUpdate,
  sendNotificationOnReply,
};

// Export payment history function
export { createPaymentHistoryOnPlanChange };

// Export payment history function
export { dbCreateOrUpdateFirestoreUser };