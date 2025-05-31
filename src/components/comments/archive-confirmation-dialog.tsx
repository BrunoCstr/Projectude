"use client";

import * as React from "react";
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
import { Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface ArchiveConfirmationDialogProps {
  commentId: string;
  commentText: string;
  children: React.ReactNode; // The trigger button
  onArchived: () => void; // Callback function when archived successfully
  archiveAction: (commentId: string) => Promise<void>; // Receive the archive function as a prop
}

export function ArchiveConfirmationDialog({
  commentId,
  commentText,
  children,
  onArchived,
  archiveAction, // Use the passed prop
}: ArchiveConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("comments");

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      // Call the passed archive function prop
      await archiveAction(commentId);

      toast({
        title: t("archive-confirmation-dialog.toast.response.title"),
        description: `${t(
          "archive-confirmation-dialog.toast.response.description"
        )} "${commentText.substring(0, 30)}..." ${t(
          "archive-confirmation-dialog.toast.response.description2"
        )}`, // Show truncated text
      });
      setIsOpen(false); // Close the dialog on success
      onArchived(); // Call the callback function
    } catch (error) {
      console.error("Failed to archive comment:", error);
      toast({
        variant: "destructive",
        title: t("archive-confirmation-dialog.toast.error.title"),
        description:
          error instanceof Error
            ? error.message
            : t("archive-confirmation-dialog.toast.error.description"),
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("archive-confirmation-dialog.dialog-content.title")}
          </AlertDialogTitle>
          {/* Keep the main description text inside the description component */}
          <AlertDialogDescription>
            {t("archive-confirmation-dialog.dialog-content.description")}
          </AlertDialogDescription>
          {/* Move the div outside/after the description, but still visually grouped */}
          <div className="mt-2 pl-4 border-l-2 italic text-muted-foreground text-sm bg-muted/50 p-2 rounded">
            "
            {commentText.length > 100
              ? commentText.substring(0, 100) + "..."
              : commentText}
            "
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>
            {t("archive-confirmation-dialog.dialog-content.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isArchiving}>
            {isArchiving
              ? t("archive-confirmation-dialog.dialog-content.archiving")
              : t("archive-confirmation-dialog.dialog-content.archive")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
