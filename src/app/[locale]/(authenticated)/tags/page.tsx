"use client"; // Make this a client component to handle state and interactions

import * as React from "react"; // Import React and useState
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tag as TagIcon,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react"; // Added Loader2
import { listTags, createTag, updateTag, deleteTag } from "@/services/tag"; // Import service functions
import type { Tag } from "@/services/project"; // Use Tag type from project service
import { AddTagDialog } from "@/components/tags/add-tag-dialog"; // Import AddTagDialog
import { EditTagDialog } from "@/components/tags/edit-tag-dialog"; // Import EditTagDialog
import { DeleteConfirmationDialog } from "@/components/tags/delete-confirmation-dialog"; // Import DeleteConfirmationDialog
import { useToast } from "@/hooks/use-toast"; // Import toast
import { useAuth } from "@/hooks/use-auth";
import { defaultTags } from "@/services/tag";
import { useTranslations } from "next-intl";

export default function TagsPage() {
  const { userData } = useAuth();
  const t = useTranslations("tags");

  const [tags, setTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  // Fetch initial tags
  React.useEffect(() => {
    async function fetchTags() {
      if (!userData) return;

      setIsLoading(true);
      try {
        const fetchedTags = await listTags(userData?.uid);

        setTags(fetchedTags);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
        toast({
          variant: "destructive",
          title: t("page.toast.error.title"),
          description: t("page.toast.error.description"),
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchTags();
  }, [userData, toast]); // Add toast as dependency

  // Handler for when a new tag is added via the dialog
  const handleTagAdded = (newTag: Tag) => {
    setTags((prevTags) => [newTag, ...prevTags]); // Add new tag to the beginning
  };

  // Handler for when a tag is updated via the dialog
  const handleTagUpdated = (updatedTag: Tag) => {
    setTags((prevTags) =>
      prevTags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag))
    );
  };

  // Handler for when a tag is deleted via the confirmation dialog
  const handleTagDeleted = (deletedTagId: string) => {
    setTags((prevTags) => prevTags.filter((tag) => tag.id !== deletedTagId));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Adjusted layout for responsiveness */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("page.title")}</h1>
        {/* Use the AddTagDialog component */}
        <AddTagDialog onTagAdded={handleTagAdded} />
      </div>

      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>{t("page.card.title")}</CardTitle>
          <CardDescription>{t("page.card.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tags.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("page.card.emptyState")}
            </p>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                // Adjusted layout for responsiveness within each tag item
                <div
                  key={tag.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors gap-3"
                >
                  {/* Tag Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-1 mr-4 min-w-0">
                    <Badge
                      style={{
                        backgroundColor: tag.color,
                        // Basic contrast check (light vs dark background)
                        color:
                          tag.color &&
                          parseInt(
                            tag.color.split(" ")[2].replace("%", ""),
                            10
                          ) < 50
                            ? "hsl(var(--primary-foreground))"
                            : "hsl(var(--foreground))",
                      }}
                      className="px-2 py-0.5 flex-shrink-0 self-start" // Align badge start on mobile
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                    <p
                      className="text-sm text-muted-foreground truncate sm:flex-1"
                      title={tag.description}
                    >
                      {" "}
                      {/* Allow description to take space */}
                      {tag.description || <i>{t("page.card.noDescription")}</i>}
                    </p>
                  </div>
                  {/* Action Buttons */}
                  {/* Align buttons end on mobile */}
                  <div className="flex gap-1 flex-shrink-0 self-end sm:self-center">
                    {/* Edit Button triggering EditTagDialog */}
                    <EditTagDialog tag={tag} onTagUpdated={handleTagUpdated}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">
                          {t("page.buttons.edit")}
                        </span>
                      </Button>
                    </EditTagDialog>
                    {/* Delete Button triggering DeleteConfirmationDialog */}
                    <DeleteConfirmationDialog
                      tag={tag}
                      onTagDeleted={handleTagDeleted}
                      deleteAction={deleteTag} // Pass the service function
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">
                          {t("page.buttons.delete")}
                        </span>
                      </Button>
                    </DeleteConfirmationDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
