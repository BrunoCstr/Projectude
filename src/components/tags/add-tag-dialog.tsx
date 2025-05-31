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
import { AddTagForm } from "./add-tag-form";
import type { Tag } from "@/services/project"; // Use Tag type from project service
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface AddTagDialogProps {
  onTagAdded: (newTag: Tag) => void; // Callback to update parent state
}

export function AddTagDialog({ onTagAdded }: AddTagDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations("tags");

  const handleClose = (newTag?: Tag) => {
    setIsOpen(false);
    if (newTag) {
      onTagAdded(newTag);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />{" "}
          {t("add-tag-dialog.triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add-tag-dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("add-tag-dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <AddTagForm onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
