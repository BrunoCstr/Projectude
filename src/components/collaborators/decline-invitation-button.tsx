
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { declineInvitationAction } from '@/actions/invitation-actions'; // Import the server action

interface DeclineInvitationButtonProps {
  invitationId: string;
  inviterName: string;
}

export function DeclineInvitationButton({ invitationId, inviterName }: DeclineInvitationButtonProps) {
  const [isDeclining, startTransition] = React.useTransition();
  const { toast } = useToast();

  const handleDecline = () => {
    startTransition(async () => {
      try {
        const result = await declineInvitationAction(invitationId);
        if (result.success) {
          toast({
            title: 'Invitation Declined',
            description: `You have declined the invitation from ${inviterName}.`,
          });
          // Revalidation is handled by the server action, the UI should update
        } else {
          // Throw the error message from the action to be caught below
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Failed to decline invitation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Could not decline the invitation. Please try again.';

        // Check for the specific error message from the action
        if (errorMessage.includes("already accepted") || errorMessage.includes("already declined")) {
             toast({
               variant: 'default', // Use default or warning variant
               title: 'Invitation Already Responded',
               description: `This invitation from ${inviterName} has already been responded to.`,
             });
        } else {
             toast({
               variant: 'destructive',
               title: 'Error Declining Invitation',
               description: errorMessage,
             });
        }
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400" // Added dark mode styles
      onClick={handleDecline}
      disabled={isDeclining}
    >
      <X className="mr-1 h-4 w-4" />
      {isDeclining ? 'Declining...' : 'Decline'}
    </Button>
  );
}
