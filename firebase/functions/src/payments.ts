import { firestore } from "firebase-functions/v2";
import {
  FirestoreEvent,
  Change,
  DocumentSnapshot,
} from "firebase-functions/v2/firestore";
import { db } from "./config"; // Import Firestore instance

// Prices mapping (should ideally be fetched from config or remote config)
const prices: Record<string, number> = {
  monthly: 3.9,
  annually: 39.9,
  biannually: 69.9,
};

// Currency mapping (could expand later)
const currencies: Record<string, string> = {
  monthly: "BRL",
  annually: "BRL",
  biannually: "BRL",
};

// Triggered when a user document is updated
export const createPaymentHistoryOnPlanChange = firestore.onDocumentUpdated(
  "users/{userId}",
  async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
    const change = event.data;
    const { userId } = event.params;

    if (!change) {
      console.error("No change data found for user update:", userId);
      return null;
    }

    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) {
      console.log("No data found in before/after snapshot for:", userId);
      return null;
    }

    const previousPlan = beforeData.currentPlan || "Free";
    const newPlan = afterData.currentPlan || "Free";
    const previousFrequency = beforeData.billingFrequency;
    const newFrequency = afterData.billingFrequency;

    const isNewSubscription = previousPlan === "Free" && newPlan === "Premium";
    const isFrequencyChange =
      newPlan === "Premium" &&
      previousPlan === "Premium" &&
      previousFrequency !== newFrequency;
    const isDowngradeToFree = previousPlan === "Premium" && newPlan === "Free";

    if (isNewSubscription || isFrequencyChange || isDowngradeToFree) {
      console.log(
        `Plan change detected for user ${userId}: ${previousPlan}(${
          previousFrequency || "N/A"
        }) -> ${newPlan}(${newFrequency || "N/A"})`
      );

      let amount = 0;
      let currency = "BRL";
      let status = "Unknown";
      let paymentId = `ph_${Date.now()}_${userId.substring(0, 5)}`;

      if (isNewSubscription || isFrequencyChange) {
        if (newFrequency && prices[newFrequency]) {
          amount = prices[newFrequency];
          currency = currencies[newFrequency] || "BRL";
          status = "Paid";
        } else {
          console.warn("Invalid frequency or missing price for:", newFrequency);
          status = "Error";
        }
      } else if (isDowngradeToFree) {
        amount = 0;
        currency = currencies[previousFrequency] || "BRL";
        status = "Cancelled/Downgraded";
      }

      const cardLast4 = afterData.primaryCardLast4 || "****";

      try {
        const paymentHistoryRef = db
          .collection("users")
          .doc(userId)
          .collection("paymentHistory");

        await paymentHistoryRef.add({
          date: new Date(),
          amount,
          currency,
          status,
          cardLast4: status === "Paid" || status === "Error" ? cardLast4 : null,
          paymentId,
          plan: newPlan,
          frequency: newPlan === "Premium" ? newFrequency : null,
          changeType: isNewSubscription
            ? "Subscription Start"
            : isFrequencyChange
            ? "Frequency Change"
            : "Downgrade/Cancellation",
        });

        console.log(`Payment history created for user ${userId}: ${status}`);
      } catch (error) {
        console.error(
          "Error creating payment history for user:",
          userId,
          error
        );
      }
    }

    return null;
  }
);
