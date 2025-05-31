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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCardIcon, PlusCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addPaymentMethodFlow } from "@/services/paymentMethods";

import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

const schema = z.object({
  cardName: z.string().min(2, { message: "Nome no cartão é obrigatório." }),
});

type FormData = z.infer<typeof schema>;

interface AddPaymentMethodDialogProps {
  onPaymentMethodAdded: (newCard: any) => void;
  addPaymentMethodAction: (cardElement: any, name: string) => Promise<any>;
}

export function AddPaymentMethodDialog({
  onPaymentMethodAdded,
  addPaymentMethodAction,
}: AddPaymentMethodDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("settings");

  const stripe = useStripe();
  const elements = useElements();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardName: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: FormData) => {
    const cardElement = elements?.getElement(CardElement);
    if (!cardElement || !stripe) {
      toast({
        title: "Erro interno",
        description: "Stripe não carregado corretamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const newCard = await addPaymentMethodFlow(
        stripe,
        cardElement,
        data.cardName
      );
      onPaymentMethodAdded(newCard);
      toast({
        title: t("addPaymentMethodDialog.toast.success.title"),
        description: `${t(
          "addPaymentMethodDialog.toast.success.description"
        )} ${newCard?.last4} ${t(
          "addPaymentMethodDialog.toast.success.description2"
        )}`,
      });
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Erro ao adicionar cartão:", error);
      toast({
        title: t("addPaymentMethodDialog.toast.error.title"),
        description: error?.message ?? "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusCircle className="mr-1.5 h-4 w-4" />
          {t("addPaymentMethodDialog.triggerButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            {t("addPaymentMethodDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("addPaymentMethodDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardName">
              {t("addPaymentMethodDialog.fields.cardName.label")}
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardName"
                placeholder={t(
                  "addPaymentMethodDialog.fields.cardName.placeholder"
                )}
                className="pl-9"
                {...form.register("cardName")}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Stripe Card Element */}
          <div>
            <Label>{t("addPaymentMethodDialog.fields.cardNumber.label")}</Label>
            <div className="p-3 border rounded-md text-white bg-background">
              <CardElement
                options={{
                  style: { base: { fontSize: "16px", color: "white" } },
                }}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                {t("addPaymentMethodDialog.buttons.cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !form.formState.isValid}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCardIcon className="mr-2 h-4 w-4" />
              )}
              {isSaving
                ? t("addPaymentMethodDialog.buttons.submit.loading")
                : t("addPaymentMethodDialog.buttons.submit.default")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
