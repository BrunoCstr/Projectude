"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Paperclip,
  Send,
  ThumbsDown,
  ThumbsUp,
  Edit2,
  Trash2,
  MessageSquare,
  Info,
} from "lucide-react"; // Removed Edit2
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Comment, CommentReply } from "@/services/comment";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { DeleteReplyConfirmationDialog } from "./delete-reply-confirmation-dialog";
// Removed EditReplyDialog import
import { updateCommentReply, deleteCommentReply } from "@/services/comment"; // Keep service functions for now
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { deleteField, doc, increment, updateDoc } from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";

// Helper function to format relative date (reuse from page)
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

interface ReplyDialogProps {
  children: React.ReactNode; // The trigger button
  comment: Comment;
  replies: CommentReply[]; // Receive replies as prop from parent
  onReplyAdded: (newReply: CommentReply) => void; // Callback to inform parent
  onReplyUpdated: (updatedReply: CommentReply) => void; // Callback for updates (Keep for consistency, though unused now)
  onReplyDeleted: (deletedReplyId: string) => void; // Callback for deletions
  createReplyService: (
    commentId: string,
    replyText: string,
    userId: string
  ) => Promise<CommentReply>;
  // Removed updateReplyService prop as editing is removed
  deleteReplyService?: (replyId: string) => Promise<void>;
}

export function ReplyDialog({
  children,
  comment,
  replies: initialReplies, // Rename prop to avoid conflict
  onReplyAdded,
  onReplyUpdated, // Keep prop for now, but won't be called
  onReplyDeleted,
  createReplyService,
  // Removed updateReplyService prop
  deleteReplyService, // Use imported service as default
}: ReplyDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [newReplyText, setNewReplyText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  // Local state to manage replies within the dialog, initialized from props
  const [localReplies, setLocalReplies] =
    React.useState<CommentReply[]>(initialReplies);

  // Update local state if the initialReplies prop changes (e.g., parent updates)
  React.useEffect(() => {
    setLocalReplies(initialReplies);
  }, [initialReplies]);

  // Local state for likes/dislikes (simulation - keep this local)
  const [likes, setLikes] = React.useState<Record<string, number>>({});
  const [dislikes, setDislikes] = React.useState<Record<string, number>>({});
  const [userVote, setUserVote] = React.useState<
    Record<string, "like" | "dislike" | null>
  >({});

  const { toast } = useToast();
  const { userData } = useAuth();
  const t = useTranslations("comments");
  const currentUserId = userData?.uid; // Replace with actual auth logic

  React.useEffect(() => {
    const likesObj: Record<string, number> = {};
    const dislikesObj: Record<string, number> = {};
    const voteObj: Record<string, "like" | "dislike" | null> = {};

    localReplies.forEach((r) => {
      likesObj[r.id] = r.likeCount ?? 0;
      dislikesObj[r.id] = r.dislikeCount ?? 0;
      voteObj[r.id] =
        r.votes && r.votes[currentUserId ?? ""] ? r.votes[currentUserId ?? ""] : null;
    });

    setLikes(likesObj);
    setDislikes(dislikesObj);
    setUserVote(voteObj);
  }, [localReplies, currentUserId]);

  const handleVote = async (replyId: string, voteType: "like" | "dislike") => {
    const db = getInitializedFirestore();
    // 1) Lê o voto atual do usuário nesta reply (se existir no state)
    const prevUserVote = userVote[replyId]; // pode ser "like" | "dislike" | null
    const newUserVoteState = { ...userVote };

    // 2) Cria variáveis temporárias para os novos contadores
    //    Usaremos increment() do Firestore para alterar atômicamente.
    let likeChange = 0;
    let dislikeChange = 0;

    if (prevUserVote === voteType) {
      // usuário clicou de novo no mesmo botão → “unvota”
      newUserVoteState[replyId] = null;
      if (voteType === "like") {
        likeChange = -1;
      } else {
        dislikeChange = -1;
      }
    } else {
      // usuário está votando pela primeira vez OU trocando o voto
      newUserVoteState[replyId] = voteType;

      // se já tinha votado do tipo oposto, decrementa primeiro
      if (prevUserVote === "like") {
        likeChange = -1; // remove o like anterior
        dislikeChange = voteType === "dislike" ? 1 : 0;
      } else if (prevUserVote === "dislike") {
        dislikeChange = -1; // remove o dislike anterior
        likeChange = voteType === "like" ? 1 : 0;
      } else {
        // prevUserVote == null: votando pela primeira vez
        if (voteType === "like") {
          likeChange = 1;
        } else {
          dislikeChange = 1;
        }
      }
    }

    // 3) Atualiza primeiro o estado local para feedback imediato
    setUserVote(newUserVoteState);
    setLikes((prev) => ({
      ...prev,
      [replyId]: (prev[replyId] || 0) + likeChange,
    }));
    setDislikes((prev) => ({
      ...prev,
      [replyId]: (prev[replyId] || 0) + dislikeChange,
    }));

    // 4) Agora persiste no Firestore:
    //    - usamos increment(likeChange) para mudar atômico de likeCount
    //    - e increment(dislikeChange) para o dislikeCount
    try {
      const replyDocRef = doc(db, "comments", comment.id, "replies", replyId);

      const updatePayload: Record<string, any> = {};

      if (likeChange !== 0) {
        updatePayload.likeCount = increment(likeChange);
      }
      if (dislikeChange !== 0) {
        updatePayload.dislikeCount = increment(dislikeChange);
      }

      // Também precisamos manter o mapa `votes` no Firestore:
      //    → se newUserVoteState[replyId] for null, removemos a chave do mapa;
      //    → se for "like" ou "dislike", atrelamos no mapa.
      //
      // Por simplicidade, vamos buscar o documento e reconstruir o campo votes inteiro.
      // Alternativamente, você pode usar updateDoc especificamente para o campo votes[uid].
      // Aqui mostramos a forma direta:
      if (prevUserVote === voteType) {
        // significa "unvote": apagar a chave do mapa votes
        // no Firestore, para remover campo específico dentro do map, fazemos:
        //   updateDoc(replyDocRef, { [`votes.${currentUserId}`]: deleteField() })
        // mas precisa importar deleteField de "firebase/firestore".
        // Exemplo mínimo:
        updatePayload[`votes.${currentUserId}`] = deleteField();
      } else {
        // está votando ou trocando: define votes[currentUserId] = voteType
        updatePayload[`votes.${currentUserId}`] = voteType;
      }

      await updateDoc(replyDocRef, updatePayload);
    } catch (firestoreError) {
      console.error("Erro ao gravar voto no Firestore:", firestoreError);
      // Aqui você pode querer “desfazer” o state local ou mostrar toast de erro.
    }
  };

  const handleSendReply = async () => {
    if (!newReplyText.trim() || isSending) return; // Prevent double submission
    if (!currentUserId) {
      return;
    }

    setIsSending(true);
    try {
      // Call the passed service function
      const newReply = await createReplyService(
        comment.id,
        newReplyText,
        currentUserId
      );

      if (newReply) {
        // Update local state immediately with the reply returned from the service
        setLocalReplies((prev) => [...prev, newReply]);
        // Inform parent to update its state
        onReplyAdded(newReply);
        setNewReplyText(""); // Clear input
        toast({ title: t("replyDialog.toast.replySent.title") });
      } else {
        throw new Error("Failed to create reply (service returned null).");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        variant: "destructive",
        title: t("replyDialog.toast.replyError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("replyDialog.toast.replyError.description"),
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle reply deletion confirmed from the dialog
  const handleConfirmDeleteReply = async (replyId: string) => {
    try {
      if (!deleteReplyService) throw new Error("Delete service not provided");
      // Call the service *first*
      await deleteReplyService(replyId);
      // *Then* update local state and inform parent
      setLocalReplies((prev) => prev.filter((r) => r.id !== replyId));
      onReplyDeleted(replyId);
      toast({ title: t("replyDialog.toast.deleteSuccess.title") }); // Move toast here
      // Close the dialog if needed, or assume it's handled by the DeleteConfirmationDialog caller
    } catch (error) {
      console.error("Failed to delete reply:", error);
      toast({
        variant: "destructive",
        title: t("replyDialog.toast.deleteError.title"),
        description:
          error instanceof Error
            ? error.message
            : t("replyDialog.toast.deleteError.description"),
      });
    }
  };

  // Removed handleConfirmUpdateReply as editing is removed

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />{" "}
            {t("replyDialog.title")}
          </DialogTitle>
          {/* Use div instead of blockquote inside DialogDescription */}
          <DialogDescription asChild>
            <div className="text-sm mt-1 space-y-1">
              <p className="text-muted-foreground">
                {t("replyDialog.description.prefix")}
              </p>
              {/* Use div instead of blockquote */}
              <div className="border-l-2 pl-3 italic text-muted-foreground">
                "
                {comment.text.length > 100
                  ? comment.text.substring(0, 100) + "..."
                  : comment.text}
                "
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Replies List */}
        <ScrollArea className="h-64 px-6 py-4">
          <div className="space-y-4">
            {localReplies.length === 0 ? ( // Use localReplies
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("replyDialog.description.noReplies")}
              </p>
            ) : (
              localReplies.map((reply) => {
                // Use localReplies
                const isCurrentUser = reply.user === currentUserId;
                const currentVote = userVote[reply.id];
                return (
                  <div
                    key={reply.id} // Use the permanent ID directly
                    className={cn(
                      "flex items-start gap-3",
                      isCurrentUser && "justify-end"
                    )}
                  >
                    {!isCurrentUser && (
                      <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                        <AvatarImage src={reply.photoURL} alt={reply.user} />
                        <AvatarFallback className="text-xs">
                          {reply.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "flex flex-col max-w-[80%]",
                        isCurrentUser ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-3 py-1.5 relative group",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {!isCurrentUser && (
                          <p className="text-xs font-medium mb-0.5">
                            {reply.user}
                          </p>
                        )}
                        <p className="text-sm">{reply.text}</p>
                        {isCurrentUser && (
                          <div className="absolute -top-2 -left-8 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            {/* Removed Edit Button and Dialog */}
                            <DeleteReplyConfirmationDialog
                              replyId={reply.id}
                              onConfirmDelete={handleConfirmDeleteReply}
                            >
                              {/* Trigger for delete confirmation */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive bg-background/80 hover:bg-background rounded-sm shadow"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">
                                  {t("replyDialog.replyCard.deleteReply")}
                                </span>
                              </Button>
                            </DeleteReplyConfirmationDialog>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(reply.createdAt)}
                        </span>
                        <button
                          className={cn(
                            "text-muted-foreground hover:text-primary disabled:opacity-50",
                            currentVote === "like" && "text-primary"
                          )}
                          title="Like"
                          onClick={() => handleVote(reply.id, "like")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="sr-only">
                            {t("replyDialog.replyCard.like")}
                          </span>
                        </button>
                        <span className="text-xs text-muted-foreground font-medium w-3 text-center">
                          {likes[reply.id] || 0}
                        </span>
                        <button
                          className={cn(
                            "text-muted-foreground hover:text-destructive disabled:opacity-50",
                            currentVote === "dislike" && "text-destructive"
                          )}
                          title="Dislike"
                          onClick={() => handleVote(reply.id, "dislike")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span className="sr-only">
                            {t("replyDialog.replyCard.dislike")}
                          </span>
                        </button>
                        <span className="text-xs text-muted-foreground font-medium w-3 text-center">
                          {dislikes[reply.id] || 0}
                        </span>
                      </div>
                    </div>

                    {isCurrentUser && (
                      <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                        <AvatarImage
                          src={reply.photoURL ?? ""}
                          alt={reply.user}
                        />
                        <AvatarFallback className="text-xs">
                          {reply.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Reply Input Section */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex gap-2 items-center">
            <Textarea
              placeholder={t("replyDialog.input.placeholder")}
              className="flex-1 text-sm h-10 min-h-10 bg-background resize-none"
              value={newReplyText}
              onChange={(e) => setNewReplyText(e.target.value)}
              disabled={isSending}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isSending) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            {/* <label>
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                accept="image/*,application/pdf" // ou os tipos que quiser permitir
              />
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">{t("replyDialog.input.attach")}</span>
              </Button>
            </label> */}
            <Button
              size="sm"
              className="h-10"
              onClick={handleSendReply}
              disabled={isSending || !newReplyText.trim()}
            >
              <Send className="mr-1.5 h-4 w-4" />{" "}
              {isSending
                ? t("replyDialog.input.sending")
                : t("replyDialog.input.send")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
