"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/services/project";
import type { Collaborator } from "@/services/collaborator";
import type { Comment } from "@/services/comment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createComment } from "@/services/comment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";

const commentSchema = z.object({
  projectId: z.string().min(1, "Please select a project."),
  commentText: z.string().min(1, "Comment cannot be empty."),
  assigneeIds: z.array(z.string()).optional(),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface AddCommentFormProps {
  onClose: (comment?: Comment) => void;
  projects: Project[]; // Receive projects as props
  collaborators: Collaborator[]; // Receive collaborators as props
}

export function AddCommentForm({
  onClose,
  projects,
  collaborators,
}: AddCommentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("comments");

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      projectId: "",
      commentText: "",
      assigneeIds: [],
    },
  });

  const selectedAssigneeIds = form.watch("assigneeIds") || [];

  // No need for useEffect to fetch data here anymore

  const onSubmit = async (data: CommentFormData) => {
    setIsLoading(true);
    console.log("Submitting comment data:", data);

    try {
      const newComment = await createComment({
        projectId: data.projectId,
        commentText: data.commentText,
        assigneeIds: data.assigneeIds,
      });

      toast({
        title: t("addCommentForm.toast.success.title"),
        description: t("addCommentForm.toast.success.description"),
      });
      form.reset();
      onClose(newComment);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        variant: "destructive",
        title: t("addCommentForm.toast.error.title"),
        description: t("addCommentForm.toast.error.description"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssigneeSelect = (collaboratorId: string) => {
    const currentAssigneeIds = form.getValues("assigneeIds") || [];
    const isSelected = currentAssigneeIds.includes(collaboratorId);
    const newAssigneeIds = isSelected
      ? currentAssigneeIds.filter((id) => id !== collaboratorId)
      : [...currentAssigneeIds, collaboratorId];
    form.setValue("assigneeIds", newAssigneeIds, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Project Selection */}
      <div>
        <Label htmlFor="projectId">{t("addCommentForm.projectLabel")}</Label>
        <Controller
          control={form.control}
          name="projectId"
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isLoading || projects.length === 0}
            >
              <SelectTrigger id="projectId">
                <SelectValue
                  placeholder={
                    projects.length === 0
                      ? t("addCommentForm.projectNoProjects")
                      : t("addCommentForm.projectPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-row gap-2">
                      <img className="h-5 w-5" src={project.logoUrl} />
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.projectId && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.projectId.message}
          </p>
        )}
      </div>

      {/* Comment Text */}
      <div>
        <Label htmlFor="commentText">{t("addCommentForm.commentLabel")}</Label>
        <Textarea
          id="commentText"
          {...form.register("commentText")}
          placeholder={t("addCommentForm.commentPlaceholder")}
          rows={4}
          disabled={isLoading}
        />
        {form.formState.errors.commentText && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.commentText.message}
          </p>
        )}
      </div>

      {/* Assignee Selection (Multi-select Popover) */}
      <div>
        <Label htmlFor="assigneeIds">{t("addCommentForm.assigneeLabel")}</Label>
        {/* Display selected collaborators above the button */}
        {selectedAssigneeIds.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1 border p-2 rounded-md bg-muted/20">
            {selectedAssigneeIds.map((id) => {
              const collaborator = collaborators.find((c) => c.id === id);
              if (!collaborator) return null;
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={collaborator.photoURL}
                      alt={collaborator.name}
                    />
                    <AvatarFallback className="text-[0.6rem]">
                      {collaborator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {collaborator.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => handleAssigneeSelect(id)}
                    aria-label={`Remove ${collaborator.name}`}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
        <Popover
          open={assigneePopoverOpen}
          onOpenChange={setAssigneePopoverOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={assigneePopoverOpen}
              className="w-full justify-between"
              disabled={isLoading || collaborators.length === 0}
            >
              {collaborators.length === 0
                ? t("addCommentForm.assigneePopoverTrigger.noCollaborators")
                : t("addCommentForm.assigneePopoverTrigger.placeholder")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder={t("addCommentForm.assigneeSearchPlaceholder")}
              />
              <CommandList>
                <CommandEmpty>
                  {t("addCommentForm.assigneeNoResults")}
                </CommandEmpty>
                <CommandGroup>
                  {collaborators.map((collaborator) => {
                    const isSelected = selectedAssigneeIds.includes(
                      collaborator.id
                    );
                    return (
                      <CommandItem
                        key={collaborator.id}
                        value={collaborator.email} // Search by email or name
                        onSelect={() => handleAssigneeSelect(collaborator.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2 pointer-events-auto">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={collaborator.photoURL}
                              alt={collaborator.name}
                            />
                            <AvatarFallback className="text-xs">
                              {collaborator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {collaborator.name} ({collaborator.email})
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose()}
          disabled={isLoading}
        >
          {t("addCommentForm.formButtons.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("addCommentForm.formButtons.submitting")
            : t("addCommentForm.formButtons.submit")}
        </Button>
      </div>
    </form>
  );
}
