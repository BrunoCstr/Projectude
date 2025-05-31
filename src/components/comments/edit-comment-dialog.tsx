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
import { EditCommentForm } from "./edit-comment-form";
import type { Comment } from "@/services/comment";
import type { Project } from "@/services/project"; // Import Project type
import type { Collaborator } from "@/services/collaborator"; // Import Collaborator type
import { listProjects } from "@/services/project"; // Import service
import { listCollaborators } from "@/services/collaborator"; // Import service
import { Loader2 } from "lucide-react"; // For loading state
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

interface EditCommentDialogProps {
  children: React.ReactNode;
  comment: Comment;
  onCommentUpdated?: (updatedComment: Comment) => void;
}

export function EditCommentDialog({
  children,
  comment,
  onCommentUpdated,
}: EditCommentDialogProps) {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const t = useTranslations('comments');

  // Fetch projects and collaborators when the dialog is about to open
  React.useEffect(() => {
    if (isOpen && projects.length === 0 && collaborators.length === 0) {
      setIsLoadingData(true);

      if (!userData) return;

      Promise.all([
        listProjects(userData?.uid),
        listCollaborators(userData?.uid),
      ])
        .then(([projectsData, collabsData]) => {
          setProjects(projectsData);
          setCollaborators(collabsData);
        })
        .catch((error) => {
          console.error("Failed to load data for edit dialog:", error);
          // Optionally show a toast error
        })
        .finally(() => setIsLoadingData(false));
    }

    console.log("UserData ",userData)
  }, [userData, isOpen, projects.length, collaborators.length]); // Re-fetch if opened and data is missing

  
  console.log("Projetos ",projects)
  console.log("Colaboradores ",collaborators)
  

  const handleClose = (updatedComment?: Comment) => {
    setIsOpen(false);
    if (updatedComment && onCommentUpdated) {
      onCommentUpdated(updatedComment);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('edit-comment-dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('edit-comment-dialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          {isLoadingData ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <EditCommentForm
              comment={comment}
              onClose={handleClose}
              projects={projects}
              collaborators={collaborators}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
