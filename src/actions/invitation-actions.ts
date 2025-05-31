
'use client';

import { acceptInvitation, declineInvitation } from '@/services/invitation';

/**
 * Server action to accept a collaboration invitation.
 * @param invitationId The ID of the invitation to accept.
 * @returns An object indicating success or failure.
 */
export async function acceptInvitationAction(invitationId: string): Promise<{ success: boolean; message: string }> {
  if (!invitationId) {
    return { success: false, message: 'Invitation ID is required.' };
  }

  try {
    await acceptInvitation(invitationId);
 // Revalidate the collaborators page cache

    return { success: true, message: 'Invitation accepted successfully.' };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Ensure the specific error message is passed through
    if (errorMessage.includes("already accepted") || errorMessage.includes("already declined")) {
      return { success: false, message: `Invitation is already ${errorMessage.includes("accepted") ? 'accepted' : 'declined'}.` };
    }
    return { success: false, message: `Failed to accept invitation: ${errorMessage}` };
  }
}

/**
 * Server action to decline a collaboration invitation.
 * @param invitationId The ID of the invitation to decline.
 * @returns An object indicating success or failure.
 */
export async function declineInvitationAction(invitationId: string): Promise<{ success: boolean; message: string }> {
  if (!invitationId) {
    return { success: false, message: 'Invitation ID is required.' };
  }

  try {
    await declineInvitation(invitationId); // Revalidate the collaborators page cache
    return { success: true, message: 'Invitation declined successfully.' };
  } catch (error) {
    console.error('Error declining invitation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
     // Ensure the specific error message is passed through
    if (errorMessage.includes("already accepted") || errorMessage.includes("already declined")) {
       return { success: false, message: `Invitation is already ${errorMessage.includes("accepted") ? 'accepted' : 'declined'}.` };
    }
    return { success: false, message: `Failed to decline invitation: ${errorMessage}` };
  }
}

