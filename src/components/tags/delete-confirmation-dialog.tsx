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
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tag } from "@/services/project";
import { useTranslations } from "next-intl";

interface DeleteConfirmationDialogProps {
  tag: Tag;
  onTagDeleted: (tagId: string) => void; // Callback function when deleted successfully
  deleteAction: (tagId: string) => Promise<void>; // The actual delete service function
  children: React.ReactNode; // The trigger element (e.g., button)
}

export function DeleteConfirmationDialog({
  tag,
  onTagDeleted,
  deleteAction,
  children,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("tags");

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAction(tag.id);
      toast({
        title: t("delete-confirmation-dialog.dialog.toast.success.title"),
        description: `${t(
          "delete-confirmation-dialog.dialog.toast.success.description"
        )} "${tag.name}".`,
      });
      setIsOpen(false); // Close the dialog on success
      onTagDeleted(tag.id); // Call the callback function
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast({
        variant: "destructive",
        title: t("delete-confirmation-dialog.dialog.toast.error.title"),
        description:
          error instanceof Error
            ? error.message
            : t("delete-confirmation-dialog.dialog.toast.error.description"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("delete-confirmation-dialog.dialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("delete-confirmation-dialog.dialog.description")}{" "}
            <span className="font-medium" style={{ color: tag.color }}>
              {tag.name}
            </span>
            .{t("delete-confirmation-dialog.dialog.description2")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("delete-confirmation-dialog.dialog.buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting
              ? t("delete-confirmation-dialog.dialog.buttons.confirm.loading")
              : t("delete-confirmation-dialog.dialog.buttons.confirm.default")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
