"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  MessageSquare,
  Inbox,
  Archive,
  Edit,
  CornerDownRight,
  Paperclip,
  Send,
  Circle,
  Loader2,
  MoreHorizontal,
  Clock,
  Filter,
  X,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"; // Added ThumbsUp, ThumbsDown
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AddCommentDialog } from "@/components/comments/add-comment-dialog";
import { EditCommentDialog } from "@/components/comments/edit-comment-dialog";
import { ArchiveConfirmationDialog } from "@/components/comments/archive-confirmation-dialog";
import { ReplyDialog } from "@/components/comments/reply-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Comment, CommentReply, CommentStatus } from "@/services/comment";
import {
  listComments,
  createCommentReply,
  updateComment,
  archiveComment,
  updateCommentReply,
  deleteCommentReply,
  listArchivedComments,
  listAllRepliesForComments,
} from "@/services/comment"; // Import services
import { listCollaboratorProjectsAndOwnerProjects } from "@/services/project"; // Import project service
import { listCollaborators } from "@/services/collaborator"; // Import collaborator service
import { listTags } from "@/services/tag"; // Import tag service
import type { Tag, Project } from "@/services/project"; // Import Tag and Project types
import type { Collaborator } from "@/services/collaborator"; // Import Collaborator type
import { useToast } from "@/hooks/use-toast";
import { updateCommentStatusAction } from "@/actions/comment-actions";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FilterPanel } from "@/components/filters/FilterPanel"; // Import FilterPanel
import type { DateRange } from "react-day-picker"; // Import DateRange type
import { useAuth } from "@/hooks/use-auth";
import { updateCommentStatus } from "@/services/comment";
import { useTranslations } from "next-intl";

// --- Helper Functions ---
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

const formatRelativeDate = (dateString?: string | Date) => {
  if (!dateString) return "-";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "-";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "-";
  }
};

const getLastReplyInfo = (
  commentId: string,
  replies: CommentReply[]
): { user: string; avatar: string; time: string } | null => {
  const repliesForComment = replies
    .filter((r) => r.commentId === commentId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  if (repliesForComment.length === 0) return null;
  const lastReply = repliesForComment[0];
  return {
    user: lastReply.user,
    avatar:
      lastReply.photoURL ?? "",
    time: formatRelativeDate(lastReply.createdAt),
  };
};

// --- CommentList Component ---
export function CommentList() {
  const { userData } = useAuth();

  const [activeTab, setActiveTab] = React.useState<
    "my-comments" | "received-comments"
  >("my-comments");
  const [comments, setComments] = React.useState<Comment[]>([]); // Use comments instead of allComments
  const [filteredComments, setFilteredComments] = React.useState<Comment[]>([]);
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]); // State for projects
  const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]); // State for collaborators
  const [replies, setReplies] = React.useState<CommentReply[]>([]); // Assuming replies are fetched/managed globally or passed down
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingStatus, setUpdatingStatus] = React.useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();
  const currentUserId = userData?.uid; // Replace with actual auth logic
  const t = useTranslations("comments");

  // Filter States
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Fetch initial data
  React.useEffect(() => {
    if (!userData) return;
    async function fetchInitialData() {
      setIsLoading(true);
      try {
        const [commentsData, tagsData, projectsData, collabsData] =
          await Promise.all([
            listComments(userData!.uid), // Fetch only active comments initially
            listTags(userData!.uid),
            listCollaboratorProjectsAndOwnerProjects(userData!.uid), // Fetch projects
            listCollaborators(userData!.uid), // Fetch collaborator
          ]);

        const repliesData = await listAllRepliesForComments(
          commentsData.map((c) => c.id)
        );

        setComments(commentsData);
        setFilteredComments(commentsData); // Initialize filtered list
        setAllTags(tagsData);
        setProjects(projectsData); // Set projects
        setCollaborators(collabsData); // Set collaborators
        setReplies(repliesData); // Set replies if fetched
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          variant: "destructive",
          title: t("loading.toast.error.title"),
          description: t("loading.toast.error.description"),
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
  }, [userData, toast]);

  console.log(comments);

  // Filtering Logic
  React.useEffect(() => {
    let tempFiltered = [...comments]; // Use comments state

    // Filter by Active Tab (My Comments / Received Comments)
    if (activeTab === "my-comments") {
      tempFiltered = tempFiltered.filter(
        (comment) => comment.creatorId === currentUserId
      );
    } else {
      // received-comments
      tempFiltered = tempFiltered.filter(
        (comment) =>
          comment.assigneeIds?.includes(currentUserId) &&
          comment.creatorId !== currentUserId
      );
    }

    // Filter by Tags (Assuming comments have a tags field similar to projects)
    // if (selectedTags.length > 0) {
    //   tempFiltered = tempFiltered.filter(comment =>
    //     selectedTags.every(tagId => comment.tags?.some(ct => ct.id === tagId)) // Modify based on comment tag structure
    //   );
    // }

    // Filter by Status
    if (selectedStatus) {
      tempFiltered = tempFiltered.filter(
        (comment) => comment.status === selectedStatus
      );
    }

    // Filter by Date Range (using createdAt)
    if (selectedDateRange?.from && selectedDateRange?.to) {
      const fromDate = selectedDateRange.from;
      const toDate = selectedDateRange.to;
      toDate.setHours(23, 59, 59, 999);
      tempFiltered = tempFiltered.filter((comment) => {
        const commentDate = new Date(comment.createdAt);
        return commentDate >= fromDate && commentDate <= toDate;
      });
    } else if (selectedDateRange?.from) {
      const fromDate = selectedDateRange.from;
      tempFiltered = tempFiltered.filter(
        (comment) => new Date(comment.createdAt) >= fromDate
      );
    } else if (selectedDateRange?.to) {
      const toDate = selectedDateRange.to;
      toDate.setHours(23, 59, 59, 999);
      tempFiltered = tempFiltered.filter(
        (comment) => new Date(comment.createdAt) <= toDate
      );
    }

    // Filter by Search Query (Text or Project Name)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(
        (comment) =>
          comment.text.toLowerCase().includes(lowerCaseQuery) ||
          comment.project.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredComments(tempFiltered);
  }, [
    activeTab,
    selectedTags,
    selectedStatus,
    selectedDateRange,
    searchQuery,
    comments,
    currentUserId,
  ]); // Depend on comments

  // --- Event Handlers ---

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prevComments) => [newComment, ...prevComments]); // Update comments state
    // Refiltering will happen automatically due to useEffect dependency on comments
  };

  const handleCommentUpdated = async (
    updatedCommentData: Partial<Comment> & { id: string }
  ) => {
    const originalComment = comments.find(
      (c) => c.id === updatedCommentData.id
    );
    if (!originalComment) return;

    const optimisticComments = comments.map((comment) =>
      comment.id === updatedCommentData.id
        ? ({ ...comment, ...updatedCommentData } as Comment)
        : comment
    );
    setComments(optimisticComments); // Optimistic update on the comments list

    try {
      const fullyUpdatedComment = await updateComment(updatedCommentData);
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === fullyUpdatedComment.id ? fullyUpdatedComment : comment
        )
      );
      toast({ title: t("updated.toast.result") });
    } catch (error) {
      console.error("Error updating comment:", error);
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === updatedCommentData.id ? originalComment : comment
        )
      ); // Revert
      toast({
        variant: "destructive",
        title: t("updated.toast.error.title"),
        description: t("updated.toast.error.description"),
      });
    }
  };

  const handleCommentArchived = (commentId: string, commentText: string) => {
    const originalComments = [...comments]; // Use the main 'comments' state
    const commentIndex = comments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      console.warn(
        `Comment ${commentId} not found in active comments for archiving.`
      );
      toast({
        variant: "destructive",
        title: t("archiving.toast.error.title"),
        description: t("archiving.toast.error.description"),
      });
      return;
    }

    // Get the comment to archive
    const commentToArchive = { ...comments[commentIndex] }; // Create a copy
    commentToArchive.archivedAt = new Date().toISOString(); // Add archived timestamp

    // Remove from active list (update state)
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    // Simulate the backend call (replace with actual API call)
    archiveComment(commentId)
      .then(() => {
        // Note: mockArchivedComments is updated inside archiveComment in the service (for mock)
        toast({
          title: t("archiving.toast.result.title"),
          description: `"${commentText.substring(0, 30)}..." ${t(
            "archiving.toast.result.description"
          )}`,
        });
      })
      .catch((error) => {
        console.error("Error archiving comment:", error);
        setComments(originalComments); // Revert state on error
        toast({
          variant: "destructive",
          title: t("archiving.toast.error.title"),
          description:
            error instanceof Error
              ? error.message
              : t("archiving.toast.error.description2"),
        });
      });
  };

  const handleReplyAdded = (newReply: CommentReply) => {
    setReplies((prev) => [...prev, newReply]); // Add to local replies state
  };

  const handleConfirmUpdateReply = async (
    commentId: string,
    replyId: string,
    newText: string
  ) => {
    const originalReply = replies.find((r) => r.id === replyId);
    if (!originalReply) return;

    const optimisticReplies = replies.map((r) =>
      r.id === replyId ? { ...r, text: newText } : r
    );
    setReplies(optimisticReplies);

    try {
      const updatedReply = await updateCommentReply(
        commentId,
        replyId,
        newText
      );
      // Replace with the actual updated reply from the service
      setReplies((prev) =>
        prev.map((r) => (r.id === updatedReply.id ? updatedReply : r))
      );
      toast({ title: "Reply Updated" });
    } catch (error) {
      console.error("Failed to update reply:", error);
      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? originalReply : r))
      ); // Revert
      toast({
        variant: "destructive",
        title: "Error Updating Reply",
        description:
          error instanceof Error ? error.message : "Could not update reply.",
      });
    }
  };

  const handleConfirmDeleteReply = (commentId: string, replyId: string) => {
    const originalReplies = [...replies];
    // Update state *after* successful API call (or simulation)
    deleteCommentReply(commentId, replyId)
      .then(() => {
        setReplies((prevReplies) =>
          prevReplies.filter((reply) => reply.id !== replyId)
        );
        toast({ title: "Reply Deleted" });
        onReplyDeleted(replyId); // Notify parent if needed
      })
      .catch((error) => {
        console.error("Failed to delete reply:", error);
        // No UI revert needed as state wasn't updated optimistically
        toast({
          variant: "destructive",
          title: "Error Deleting Reply",
          description:
            error instanceof Error
              ? error.message
              : "Could not delete the reply. Please try again.",
        });
      });
  };

  // Required by ReplyDialog prop, even if not used directly in this component
  const onReplyDeleted = (deletedReplyId: string) => {
    console.log("Reply deleted callback called in parent:", deletedReplyId);
    // Parent component might update its own state or trigger refetch here
  };

  const handleStatusChange = async (
    commentId: string,
    newStatus: CommentStatus
  ) => {
    setUpdatingStatus((prev) => ({ ...prev, [commentId]: true }));
    const originalComment = comments.find((c) => c.id === commentId);
    const originalStatus = originalComment?.status;

    const optimisticComments = comments.map((comment) =>
      comment.id === commentId ? { ...comment, status: newStatus } : comment
    );
    setComments(optimisticComments); // Update comments list optimistically

    try {
      const result = await updateCommentStatus(commentId, newStatus);
      if (!result.success) throw new Error(result.message);
      toast({
        title: t("statusChange.toast.result.title"),
        description: `${t(
          "statusChange.toast.result.description"
        )} ${newStatus}.`,
      });
    } catch (error) {
      console.error("Failed to update comment status:", error);
      // Revert optimistic update
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId && originalStatus
            ? { ...comment, status: originalStatus }
            : comment
        )
      );
      toast({
        variant: "destructive",
        title: "Error Updating Status",
        description:
          error instanceof Error ? error.message : "Could not update status.",
      });
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedStatus("");
    setSelectedDateRange(undefined);
    setSearchQuery("");
  };

  // --- Render Comment Card ---
  const renderCommentCard = (comment: Comment) => {
    const commentReplies = replies.filter((r) => r.commentId === comment.id);
    const replyCount = commentReplies.length;
    const lastReply = getLastReplyInfo(comment.id, commentReplies);
    const creator = collaborators.find((c) => c.id === comment.creatorId);
    const creatorAvatar = creator?.photoURL || "";

    return (
      <div
        key={comment.id}
        className="flex items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        {/* Avatar - Responsive size */}
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 mt-1">
          <AvatarImage src={creatorAvatar} alt={comment.creator} />
          <AvatarFallback className="text-xs sm:text-sm">
            {comment.creator.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {/* Content and Actions Container - Responsive layout */}
        <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-2 sm:gap-4">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold text-sm leading-tight">
              {comment.text}
            </p>
            {/* Metadata - Responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {t("commentCard.created")}{" "}
                {formatRelativeDate(comment.createdAt)} {t("commentCard.by")}{" "}
                {comment.creator}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">
                {t("onProject")} "{comment.project}"
              </span>
            </div>
            {/* Assignees - Show avatars on larger screens */}
            {comment.assignees && comment.assignees.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">
                  {t("assignedTo")}
                </span>
                <div className="flex -space-x-1">
                  {comment.assigneeIds?.slice(0, 3).map((id) => {
                    const assignee = collaborators.find((c) => c.id === id);
                    return assignee ? (
                      <Avatar
                        key={id}
                        className="h-4 w-4 border-background border"
                      >
                        <AvatarImage
                          src={assignee.photoURL}
                          alt={assignee.name}
                        />
                        <AvatarFallback className="text-[0.5rem]">
                          {assignee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null;
                  })}
                  {comment.assigneeIds && comment.assigneeIds.length > 3 && (
                    <Avatar className="h-4 w-4 border-background border">
                      <AvatarFallback className="text-[0.5rem] bg-muted text-muted-foreground">
                        +{comment.assigneeIds.length - 3}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                {/* Tooltip or full list for mobile could be added here */}
              </div>
            )}
            {/* Status Select and Indicator - Responsive */}
            <div className="flex items-center gap-2 pt-1">
              <Select
                value={comment.status}
                onValueChange={(value: CommentStatus) =>
                  handleStatusChange(comment.id, value)
                }
                disabled={updatingStatus[comment.id]}
              >
                <SelectTrigger className="w-[120px] sm:w-[130px] h-7 text-xs px-2 py-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">
                    {t("statuses.pending")}
                  </SelectItem>
                  <SelectItem value="In Progress">
                    {t("statuses.inProgress")}
                  </SelectItem>
                  <SelectItem value="Paused">{t("statuses.paused")}</SelectItem>
                  <SelectItem value="Completed">
                    {t("statuses.completed")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span
                className={cn(
                  "hidden sm:flex items-center gap-1 text-xs font-medium",
                  getStatusColorClass(comment.status)
                )}
              >
                {updatingStatus[comment.id] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
                {comment.status}
              </span>
            </div>
          </div>
          {/* Right Actions Area - Responsive */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 text-xs text-muted-foreground self-end sm:self-start sm:pt-1">
            {/* Replies Button - Adjusted styling for mobile */}
            <ReplyDialog
              comment={comment}
              replies={replies.filter((r) => r.commentId === comment.id)}
              onReplyAdded={handleReplyAdded}
              onReplyUpdated={(updatedReply) =>
                // aqui transformo o único CommentReply em 3 args
                handleConfirmUpdateReply(
                  updatedReply.commentId,
                  updatedReply.id,
                  updatedReply.text
                )
              } // Pass update handler
              onReplyDeleted={(replyId) =>
                handleConfirmDeleteReply(comment.id, replyId)
              } // Pass delete handler
              createReplyService={(commentId, replyText, userId) =>
                createCommentReply({ commentId, replyText })
              } // Pass the actual service function
              deleteReplyService={(replyId) =>
                deleteCommentReply(comment.id, replyId)
              } // Pass delete service
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 flex flex-col sm:flex-row items-center gap-1 hover:bg-transparent hover:text-primary"
              >
                <MessageSquare className="h-4 w-4 sm:mr-1" />
                <span className="text-lg font-medium text-foreground sm:text-sm">
                  {replyCount}
                </span>
                <span className="text-[0.6rem] uppercase font-semibold tracking-wider sm:hidden">
                  {t("commentCard.replies")}
                </span>
              </Button>
            </ReplyDialog>
            {/* Last Reply Info - Hidden on smaller screens */}
            {lastReply && (
              <div className="hidden sm:flex flex-col items-center text-center">
                <span className="text-[0.6rem] uppercase font-semibold tracking-wider mb-1">
                  {t("commentCard.lastReply")}
                </span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={lastReply.avatar} alt={lastReply.user} />
                    <AvatarFallback className="text-[0.5rem]">
                      {lastReply.user.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground text-xs">
                    {lastReply.time}
                  </span>
                </div>
              </div>
            )}
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <EditCommentDialog
                  comment={comment}
                  onCommentUpdated={handleCommentUpdated}
                >
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center w-full">
                      <Edit className="mr-2 h-4 w-4 inline-block" />{" "}
                      {t("commentCard.edit")}
                    </span>
                  </DropdownMenuItem>
                </EditCommentDialog> */}
                <ArchiveConfirmationDialog
                  commentId={comment.id}
                  commentText={comment.text}
                  onArchived={() =>
                    handleCommentArchived(comment.id, comment.text)
                  }
                  archiveAction={archiveComment} // Pass the service function directly
                >
                  {/* Ensure the trigger is wrapped correctly */}
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive w-full cursor-pointer"
                  >
                    <span className="flex items-center w-full">
                      <Archive className="mr-2 h-4 w-4 inline-block" />{" "}
                      {t("commentCard.archive")}
                    </span>
                  </DropdownMenuItem>
                </ArchiveConfirmationDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  // --- Component Return ---
  return (
    <>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
        {/* Buttons Group */}
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end w-full sm:w-auto">
          {/* Slot for AddCommentDialog Trigger */}
          <AddCommentDialog
            onCommentAdded={handleCommentAdded}
            projects={projects}
            collaborators={collaborators}
          />
          {/* Archived Button */}
          <Button variant="outline" asChild size="sm">
            <Link href="/comments/archived">
              <Archive className="mr-2 h-4 w-4" /> {t("buttons.archived")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="mb-6">
        {" "}
        {/* Added margin-bottom to separate filters from tabs */}
        <FilterPanel
          // tags={allTags} // Enable if comment tags are implemented
          statusOptions={["Pending", "In Progress", "Paused", "Completed"]}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedDateRange={selectedDateRange}
          onDateChange={setSelectedDateRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Tabs for My Comments / Received Comments */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-comments">
            <MessageSquare className="mr-2 h-4 w-4" /> {t("tabs.myComments")}
          </TabsTrigger>
          <TabsTrigger value="received-comments">
            <Inbox className="mr-2 h-4 w-4" /> {t("tabs.receivedComments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-comments">
          <Card className="shadow-md rounded-lg mt-4">
            <CardHeader>
              <CardTitle>{t("sections.myComments.title")}</CardTitle>
              <CardDescription>
                {t("sections.myComments.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredComments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("sections.myComments.noComments")}
                </p>
              ) : (
                filteredComments.map((comment) => renderCommentCard(comment))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received-comments">
          <Card className="shadow-md rounded-lg mt-4">
            <CardHeader>
              <CardTitle>{t("sections.receivedComments.title")}</CardTitle>
              <CardDescription>
                {t("sections.receivedComments.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredComments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("sections.receivedComments.noComments")}
                </p>
              ) : (
                filteredComments.map((comment) => renderCommentCard(comment))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
