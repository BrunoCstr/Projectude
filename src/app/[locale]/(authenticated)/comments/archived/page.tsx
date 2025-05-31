"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Archive,
  CornerUpLeft,
  MessageSquare,
  Loader2,
  Circle,
  Trash2,
  User,
  CalendarDays,
  CornerDownRight,
  Edit,
  Paperclip,
  Send,
  ThumbsDown,
  ThumbsUp,
  MoreHorizontal,
  Clock,
} from "lucide-react"; // Added necessary icons
import { listArchivedComments, unarchiveComment } from "@/services/comment"; // Import service functions
import type { Comment, CommentReply, CommentStatus } from "@/services/comment";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ReplyDialog } from "@/components/comments/reply-dialog"; // Need ReplyDialog if showing replies
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import mock data or services needed for replies/avatars if displaying them
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

// Function to get the Tailwind color class based on status (reuse from page)
const getStatusColorClass = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "text-green-600 dark:text-green-500";
    case "in progress":
      return "text-yellow-500 dark:text-yellow-400";
    case "paused":
      return "text-destructive";
    case "pending":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
};

// Helper to format relative date (reuse from page)
const formatRelativeDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "-";
  }
};

export default function ArchivedCommentsPage() {
  const [archivedComments, setArchivedComments] = React.useState<Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [unarchivingId, setUnarchivingId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { userData } = useAuth();
  const t = useTranslations("comments");

  React.useEffect(() => {
    const currentUserId = userData?.uid;

    if (!userData) return;

    async function fetchArchived() {
      setIsLoading(true);
      try {
        const comments = await listArchivedComments(currentUserId);
        setArchivedComments(comments);
      } catch (error) {
        console.error("Failed to fetch archived comments:", error);
        toast({
          variant: "destructive",
          title: t("archivedPage.loading.toast.title"),
          description: t("archivedPage.loading.toast.description"),
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchArchived();
  }, [userData, toast]);

  const handleUnarchive = async (commentId: string) => {
    setUnarchivingId(commentId);
    try {
      await unarchiveComment(commentId);
      setArchivedComments((prev) => prev.filter((c) => c.id !== commentId));
      toast({
        title: t("archivedPage.unarchive.toast.success.title"),
        description: t("archivedPage.unarchive.toast.success.description"),
      });
    } catch (error) {
      console.error("Failed to unarchive comment:", error);
      toast({
        variant: "destructive",
        title: t("archivedPage.unarchive.toast.error.title"),
        description:
          error instanceof Error
            ? error.message
            : t("archivedPage.unarchive.toast.error.description"),
      });
    } finally {
      setUnarchivingId(null);
    }
  };

  // Dummy handlers for ReplyDialog - These won't actually be used for archived comments
  const handleReplyAdded = () => {};
  const handleReplyUpdated = () => {};
  const handleReplyDeleted = () => {};

  // Simplified render function for archived comments with responsiveness
  const renderArchivedCommentCard = (comment: Comment) => {
    const creatorAvatar = userData?.photoURL ?? ""; // Placeholder

    return (
      // Change flex direction on small screens
      <div
        key={comment.id}
        className="flex flex-col sm:flex-row items-start gap-4 px-4 py-3 border rounded-lg bg-muted/30 opacity-70"
      >
        {/* Avatar */}
        <Avatar className="w-10 h-10 flex-shrink-0 mt-1">
          <AvatarImage src={creatorAvatar} alt={comment.creator} />
          <AvatarFallback>{comment.creator.charAt(0)}</AvatarFallback>
        </Avatar>

        {/* Inner Container for Content & Actions */}
        <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {" "}
            {/* Reduced space-y */}
            <p className="font-semibold text-sm mb-0.5 line-clamp-3 sm:line-clamp-2">
              {comment.text}
            </p>{" "}
            {/* Allow more lines on mobile */}
            {/* Metadata */}
            <p className="text-xs text-muted-foreground">
              {t("archivedPage.meta.created")}{" "}
              {formatRelativeDate(comment.createdAt)}{" "}
              {t("archivedPage.meta.by")} {comment.creator}{" "}
              {t("archivedPage.meta.onProject")} "{comment.project}"
            </p>
            <p className="text-xs text-muted-foreground">
              {t("archivedPage.meta.archivedAt")}{" "}
              {formatRelativeDate(comment.archivedAt)}
            </p>
            {/* Status Indicator */}
            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  getStatusColorClass(comment.status)
                )}
              >
                <Circle className="h-2.5 w-2.5 fill-current" />
                {comment.status} {t("archivedPage.status.archivedSuffix")}
              </span>
            </div>
          </div>

          {/* Right-side Actions (Align end on mobile) */}
          <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-center text-xs text-muted-foreground ml-auto pl-4">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs" // Ensure consistent height and text size
              onClick={() => handleUnarchive(comment.id)}
              disabled={unarchivingId === comment.id}
            >
              {unarchivingId === comment.id ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : (
                <CornerUpLeft className="mr-1.5 h-3 w-3" />
              )}
              {unarchivingId === comment.id
                ? t("archivedPage.unarchive.loading")
                : t("archivedPage.unarchive.button")}
            </Button>
            {/* Optional: Permanent Delete Button */}
            {/* <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive"><Trash2 className="mr-1.5 h-3 w-3" /> Delete Permanently</Button> */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {" "}
        {/* Adjust for mobile */}
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Archive className="h-7 w-7 text-primary" /> {t("archivedPage.title")}
        </h1>
        <Button variant="outline" asChild>
          <Link href="/comments">
            <CornerUpLeft className="mr-2 h-4 w-4" />{" "}
            {t("archivedPage.backButton")}
          </Link>
        </Button>
      </div>

      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>{t("archivedPage.card.title")}</CardTitle>
          <CardDescription>
            {t("archivedPage.card.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3 sm:p-6">
          {" "}
          {/* Adjust padding for mobile */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : archivedComments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("archivedPage.noComments")}
            </p>
          ) : (
            archivedComments.map((comment) =>
              renderArchivedCommentCard(comment)
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
