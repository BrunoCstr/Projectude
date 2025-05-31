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
import { useTranslations } from "next-intl";

interface DeleteReplyConfirmationDialogProps {
  replyId: string;
  onConfirmDelete: (replyId: string) => void;
  children: React.ReactNode; // The trigger button (e.g., Trash icon button)
}

export function DeleteReplyConfirmationDialog({
  replyId,
  onConfirmDelete,
  children,
}: DeleteReplyConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const t = useTranslations();

  const handleDelete = () => {
    onConfirmDelete(replyId); // Call the passed callback
    setIsOpen(false); // Close the dialog
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete-reply-dialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete-reply-dialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("delete-reply-dialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {t("delete-reply-dialog.delete-reply")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
