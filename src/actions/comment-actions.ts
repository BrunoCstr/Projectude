'use server';

import { revalidatePath } from 'next/cache';
import { updateCommentStatus } from '@/services/comment'; // Assuming this service function exists
import type { CommentStatus } from '@/services/comment'; // Import CommentStatus type

/**
 * Server action to update the status of a comment.
 * @param commentId The ID of the comment to update.
 * @param newStatus The new status for the comment.
 * @returns An object indicating success or failure.
 */
export async function updateCommentStatusAction(
  commentId: string,
  newStatus: CommentStatus
): Promise<{ success: boolean; message: string }> {
  if (!commentId || !newStatus) {
    return { success: false, message: 'Comment ID and new status are required.' };
  }

  // Basic validation for status
  const validStatuses: CommentStatus[] = ['Pending', 'In Progress', 'Paused', 'Completed'];
  if (!validStatuses.includes(newStatus)) {
     return { success: false, message: 'Invalid comment status provided.' };
  }

  try {
    await updateCommentStatus(commentId, newStatus);
    revalidatePath('/comments'); // Revalidate the comments page cache
    return { success: true, message: 'Comment status updated successfully.' };
  } catch (error) {
    console.error('Error updating comment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update comment status: ${errorMessage}` };
  }
}
