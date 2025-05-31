
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Send } from 'lucide-react';
import { sendPasswordResetEmailAction } from '@/actions/auth-actions'; // Import the updated server action
// Import shared schema
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas';

interface ForgotPasswordDialogProps {
  children: React.ReactNode; // The trigger element (e.g., link or button)
}

export function ForgotPasswordDialog({ children }: ForgotPasswordDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema), // Use shared schema
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSending(true);
    try {
      // Use the server action imported from auth-actions
      const result = await sendPasswordResetEmailAction(data.email);
      if (result.success) {
        toast({
          title: "E-mail de redefinição de senha enviado",
          description: result.message, // Use message from action
        });
        form.reset();
        setIsOpen(false);
      } else {
        // Show specific error from action or generic one
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.message || "Não foi possível enviar o e-mail de redefinição de senha. Tente novamente mais tarde.",
        });
      }
    } catch (error) {
      console.error("Failed to send reset email:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Esqueceu a Senha</DialogTitle>
          <DialogDescription>
            Digite o endereço de e-mail da sua conta e enviaremos um link para redefinir sua senha.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 pb-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço de E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        className="pl-10"
                        {...field}
                        disabled={isSending}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
               <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isSending}>
                    Cancelar
                 </Button>
               </DialogClose>
               <Button type="submit" disabled={isSending || !form.formState.isValid}>
                 {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                 {isSending ? 'Enviando...' : 'Enviar Link'}
               </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
