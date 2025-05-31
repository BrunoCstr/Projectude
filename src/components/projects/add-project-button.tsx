
'use client';

import * as React from 'react';
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "./create-project-form";
import { PlusCircle } from "lucide-react";
import type { Project } from '@/services/project'; // Import Project type
import { useTranslations } from 'next-intl';

// Extend ButtonProps to allow passing button-specific props like variant, className etc.
interface AddProjectButtonProps extends ButtonProps {
    children?: React.ReactNode; // Allow custom children for the button
    projectToEdit?: Project; // Optional project data for editing
    onProjectCreated?: (newProject: Project) => void; // Callback after project creation
    onSaved?: (project: Project) => void;
}

export function AddProjectButton({ children, projectToEdit, onProjectCreated, ...buttonProps }: AddProjectButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isEditing = !!projectToEdit;

  const t = useTranslations('projects');

  // Function to handle closing the dialog and potentially calling the callback
  const handleClose = (project?: Project) => {
    setIsOpen(false);
    if (project && onProjectCreated && !isEditing) { // Only call on create, not edit
        onProjectCreated(project);
    }
    // TODO: Handle updates for editing if needed (e.g., refetching list)
  };


   // Close dialog when projectToEdit changes (e.g., after update)
  // This is a simple way to handle closing after edit, might need refinement
   React.useEffect(() => {
     // Avoid closing if it was just opened for editing
     // setIsOpen(false); // Close if project data changes externally (e.g., list updates)
   }, [projectToEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         {/* Use Slot if children is provided, otherwise render default button */}
         {/* We need a button here, Slot causes hydration issues if children isn't a direct button */}
          <Button {...buttonProps}>
            {children || (
              <>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('add-project-button.projectDialog.button')}
              </>
            )}
          </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold">
             {isEditing ? t('add-project-button.projectDialog.editTitle') : t('add-project-button.projectDialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
             {isEditing
                ? t('add-project-button.projectDialog.editDescription')
                : t('add-project-button.projectDialog.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
           {/* Pass the handleClose function and onProjectCreated down */}
           <CreateProjectForm
              onClose={handleClose}
              projectToEdit={projectToEdit}
              onProjectCreated={onProjectCreated} // Pass the callback
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
