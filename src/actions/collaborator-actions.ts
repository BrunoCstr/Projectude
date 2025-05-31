
'use server';

import { revalidatePath } from 'next/cache';
import { deleteCollaborator } from '@/services/collaborator';

/**
 * Server action to delete a collaborator.
 * @param collaboratorId The ID of the collaborator to delete.
 * @returns An object indicating success or failure.
 */
export async function deleteCollaboratorAction(collaboratorId: string): Promise<{ success: boolean; message: string }> {
  if (!collaboratorId) {
    return { success: false, message: 'Collaborator ID is required.' };
  }

  try {
    await deleteCollaborator(collaboratorId);
    revalidatePath('/collaborators'); // Revalidate the collaborators page cache
    return { success: true, message: 'Collaborator deleted successfully.' };
  } catch (error) {
    console.error('Error deleting collaborator:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to delete collaborator: ${errorMessage}` };
  }
}
