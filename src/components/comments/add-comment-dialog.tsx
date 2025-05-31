"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddCommentForm } from "./add-comment-form";
import type { Comment } from "@/services/comment";
import type { Project } from "@/services/project"; // Import Project type
import type { Collaborator } from "@/services/collaborator";
import { useTranslations } from "next-intl";

interface AddCommentDialogProps {
  onCommentAdded?: (newComment: Comment) => void;
  // Pass projects and collaborators down to avoid re-fetching in the form
  projects: Project[];
  collaborators: Collaborator[];
}

export function AddCommentDialog({
  onCommentAdded,
  projects,
  collaborators,
}: AddCommentDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations("comments");

  const handleClose = (comment?: Comment) => {
    setIsOpen(false);
    if (comment && onCommentAdded) {
      onCommentAdded(comment);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> {t("addCommentDialog.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addCommentDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("addCommentDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          {/* Pass fetched data and the close handler */}
          <AddCommentForm
            onClose={handleClose}
            projects={projects}
            collaborators={collaborators}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
