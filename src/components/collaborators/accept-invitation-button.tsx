
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { acceptInvitationAction } from '@/actions/invitation-actions'; // Import the server action

interface AcceptInvitationButtonProps {
  invitationId: string;
  inviterName: string;
}

export function AcceptInvitationButton({ invitationId, inviterName }: AcceptInvitationButtonProps) {
  const [isAccepting, startTransition] = React.useTransition();
  const { toast } = useToast();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        const result = await acceptInvitationAction(invitationId);
        if (result.success) {
          toast({
            title: 'Invitation Accepted',
            description: `You are now collaborating with ${inviterName}.`,
          });
          // Revalidation is handled by the server action, the UI should update
        } else {
           // Throw the error message from the action to be caught below
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Failed to accept invitation:', error);
         const errorMessage = error instanceof Error ? error.message : 'Could not accept the invitation. Please try again.';

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
              title: 'Error Accepting Invitation',
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
      className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-700 dark:text-green-500 dark:hover:bg-green-900/30 dark:hover:text-green-400" // Added dark mode styles
      onClick={handleAccept}
      disabled={isAccepting}
    >
      <Check className="mr-1 h-4 w-4" />
      {isAccepting ? 'Accepting...' : 'Accept'}
    </Button>
  );
}
