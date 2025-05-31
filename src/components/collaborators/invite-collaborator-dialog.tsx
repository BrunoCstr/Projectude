"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { inviteCollaborator } from "@/services/collaborator"; // Import the (mock) service
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

const inviteSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteCollaboratorDialogProps {
  children: React.ReactNode; // The trigger button
}

export function InviteCollaboratorDialog({
  children,
}: InviteCollaboratorDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("collaborators");

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    try {
      // Call the service function to send the invitation
      await inviteCollaborator(data.email);
      toast({
        title: t("inviteCollaborator.toast.invitationSent.title"),
        description: `${t(
          "inviteCollaborator.toast.invitationSent.description"
        )} ${data.email}.`,
      });
      form.reset(); // Reset form after successful submission
      setIsOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to send invitation:", error);
      toast({
        variant: "destructive",
        title: t("inviteCollaborator.toast.errorSendingInvitation.title"),
        description: t(
          "inviteCollaborator.toast.errorSendingInvitation.description"
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('inviteCollaborator.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('inviteCollaborator.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inviteCollaborator.form.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('inviteCollaborator.form.emailPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  {t('inviteCollaborator.buttons.cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  t('inviteCollaborator.buttons.sending')
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> {t('inviteCollaborator.buttons.sendInvite')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
