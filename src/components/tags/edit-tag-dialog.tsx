
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditTagForm } from "./edit-tag-form";
import type { Tag } from '@/services/project';
import { Edit } from 'lucide-react';

interface EditTagDialogProps {
    tag: Tag; // The tag data to edit
    onTagUpdated: (updatedTag: Tag) => void; // Callback after tag update
    children: React.ReactNode; // The trigger element (e.g., button)
}

export function EditTagDialog({ tag, onTagUpdated, children }: EditTagDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClose = (updatedTag?: Tag) => {
    setIsOpen(false);
    if (updatedTag) {
      onTagUpdated(updatedTag);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Update the details for the tag "{tag.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
           <EditTagForm tag={tag} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
