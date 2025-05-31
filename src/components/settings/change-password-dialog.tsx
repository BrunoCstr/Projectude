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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { sendUserPasswordResetEmail } from "@/services/settings";
import { useTranslations } from "next-intl";

export function ChangePasswordDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSendingLink, setIsSendingLink] = React.useState(false);
  const { toast } = useToast();
  const { userData } = useAuth();
  const t = useTranslations("settings");

  // Handler for sending the reset link using the server action
  const handleSendResetLink = async () => {
    setIsSendingLink(true);
    const uid = userData?.uid;
    if (!uid) {
      toast({
        title: t("change-password-dialog.toasts.notAuthenticated.title"),
        description: t(
          "change-password-dialog.toasts.notAuthenticated.description"
        ),
      });
      throw new Error("Usuário não autenticado.");
    }

    try {
      await sendUserPasswordResetEmail(userData.email);
      toast({
        title: t("change-password-dialog.toasts.resetSent.title"),
        description: t("change-password-dialog.toasts.resetSent.description"), // Use message from action
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      toast({
        variant: "destructive",
        title: t("change-password-dialog.toasts.resetFailed.title"),
        description: t("change-password-dialog.toasts.resetFailed.description"),
      });
    } finally {
      setIsSendingLink(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("change-password-dialog.triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            {t("change-password-dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("change-password-dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center pt-2">
          <Button
            type="button"
            variant="link"
            className="text-sm p-0 h-auto text-primary hover:underline"
            onClick={handleSendResetLink}
            disabled={isSaving || isSendingLink}
          >
            {isSendingLink ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                {t("change-password-dialog.sendLinkButton.loading")}
              </>
            ) : (
              <>
                <Mail className="mr-1 h-4 w-4" />{" "}
                {t("change-password-dialog.sendLinkButton.default")}
              </>
            )}
          </Button>
        </div>

        {/* Container for Footer and Reset Link */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          <DialogFooter className="sm:justify-end">
            <div className="flex gap-2 w-full sm:w-auto">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={isSaving || isSendingLink}
                >
                  {t("change-password-dialog.closeButton")}
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
