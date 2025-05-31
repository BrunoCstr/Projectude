// // firebase/functions/src/user-management.ts
// import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
// import { db, authAdmin } from "./config"; // Use db and authAdmin from config

// /**
//  * Creates or updates a user document in Firestore after successful authentication or profile update.
//  * Triggered by HTTPS call from the client-side application.
//  */
// export const dbCreateOrUpdateFirestoreUser = functions.https.onCall(async (data, context) => {
//     console.log("[Function:dbCreateOrUpdateFirestoreUser] Function triggered.");

//     // 1. Authentication Check
//     if (!context.auth) {
//         console.error("[Function:dbCreateOrUpdateFirestoreUser] Error: Unauthenticated call.");
//         throw new functions.https.HttpsError(
//             'unauthenticated',
//             'The function must be called while authenticated.'
//         );
//     }
//     const uid = context.auth.uid;
//     console.log(`[Function:dbCreateOrUpdateFirestoreUser] Authenticated user UID: ${uid}`);

//     // 2. Fetch User Data from Firebase Auth (Admin SDK)
//     let authUser;
//     try {
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Fetching user data from Auth for UID: ${uid}`);
//         authUser = await authAdmin.getUser(uid);
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Auth user data fetched successfully. Email: ${authUser.email}, DisplayName: ${authUser.displayName}, PhotoURL: ${authUser.photoURL}`);
//     } catch (error) {
//         console.error(`[Function:dbCreateOrUpdateFirestoreUser] Error fetching user data from Auth for UID ${uid}:`, error);
//         throw new functions.https.HttpsError('internal', `Failed to fetch user data: ${(error as Error).message}`);
//     }

//     const userEmail = authUser.email; // Use email fetched from Auth Admin
//     const nameFromSignup = data?.name; // Get name from function call data if provided
//     const userRef = db.collection('users').doc(uid);
//     console.log(`[Function:dbCreateOrUpdateFirestoreUser] Firestore document reference: ${userRef.path}`);

//     try {
//         // 3. Check if Firestore document exists
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Checking Firestore document existence for UID: ${uid}`);
//         const docSnap = await userRef.get();
//         const isNewUser = !docSnap.exists;
//         const existingData = docSnap.data();
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Document exists? ${!isNewUser}.`);

//         // 4. Determine profile data with priority
//         const name = nameFromSignup?.trim() || authUser.displayName?.trim() || existingData?.name || userEmail?.split('@')[0] || `User_${uid.substring(0, 5)}`;
//         const displayName = authUser.displayName?.trim() || nameFromSignup?.trim() || existingData?.displayName || name;
//         let photoURLToSave: string | null = existingData?.photoURL ?? null; // Default to existing or null

//         // Only update photoURL if the Auth user has one AND it's different OR if it's a new user with a photo
//         if (authUser.photoURL && authUser.photoURL !== existingData?.photoURL) {
//             photoURLToSave = authUser.photoURL;
//              console.log(`[Function:dbCreateOrUpdateFirestoreUser] Updating photoURL from Auth provider: ${photoURLToSave}`);
//         } else if (isNewUser && authUser.photoURL) {
//             photoURLToSave = authUser.photoURL;
//              console.log(`[Function:dbCreateOrUpdateFirestoreUser] Setting initial photoURL for new user from Auth: ${photoURLToSave}`);
//         }

//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Determined profile info: name='${name}', displayName='${displayName}', photoURL='${photoURLToSave}'`);

//         // 5. Prepare user data for Firestore operation
//         const userData: Record<string, any> = {
//             uid: uid,
//             email: userEmail, // Always update email from Auth
//             name: name,
//             displayName: displayName,
//             photoURL: photoURLToSave,
//             lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
//         };

//         // 6. Add data specific to new users or ensure defaults if missing on update
//         if (isNewUser) {
//             console.log('[Function:dbCreateOrUpdateFirestoreUser] Preparing additional data for NEW user...');
//             userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
//             userData.currentPlan = 'Free';
//             userData.billingFrequency = null;
//             userData.onboardingComplete = false;
//             // Add other default fields for new users here
//         } else {
//             // Ensure certain fields have defaults if missing in existing data (optional but good practice)
//             userData.currentPlan = existingData?.currentPlan ?? 'Free';
//             userData.billingFrequency = existingData?.billingFrequency ?? null;
//             userData.onboardingComplete = existingData?.onboardingComplete ?? false;
//             console.log('[Function:dbCreateOrUpdateFirestoreUser] Preparing data for EXISTING user (merging).');
//         }

//         // 7. Perform Firestore operation (Create or Update with merge)
//         const operationType = isNewUser ? 'CREATE (set)' : 'UPDATE (set with merge)';
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Calling setDoc (${operationType}) on ${userRef.path}.`);
//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Data being sent (timestamps are server-side):`, JSON.stringify({
//             ...userData,
//              createdAt: isNewUser ? '<serverTimestamp>' : undefined, // Log placeholder only if new
//              lastLoginAt: '<serverTimestamp>',
//         }, null, 2));


//         // Use set with merge: true for both create and update scenarios
//         await userRef.set(userData, { merge: true });

//         console.log(`[Function:dbCreateOrUpdateFirestoreUser] Firestore user document ${operationType} successful for UID: ${uid}`);
//         return { success: true, message: 'User profile created/updated successfully.' };

//     } catch (error) {
//         console.error(`[Function:dbCreateOrUpdateFirestoreUser] Error creating/updating Firestore document for UID ${uid}:`, error);
//         throw new functions.https.HttpsError(
//             'internal',
//             `Could not create or update user document: ${(error as Error).message}`,
//             error
//         );
//     }
// });