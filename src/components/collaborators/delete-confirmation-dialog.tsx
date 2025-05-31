
'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface DeleteConfirmationDialogProps {
  collaboratorId: string;
  collaboratorName: string;
  deleteAction: (id: string) => Promise<{ success: boolean; message: string }>;
}

export function DeleteConfirmationDialog({
  collaboratorId,
  collaboratorName,
  deleteAction,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAction(collaboratorId);
      if (result.success) {
        toast({
          title: "Collaborator Deleted",
          description: `Successfully removed ${collaboratorName}.`,
        });
        setIsOpen(false); // Close the dialog on success
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Failed to delete collaborator:", error);
      toast({
        variant: "destructive",
        title: "Error Deleting Collaborator",
        description: error instanceof Error ? error.message : "Could not remove the collaborator. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Collaborator</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove{' '}
            <span className="font-medium">{collaboratorName}</span> from your collaborators list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
