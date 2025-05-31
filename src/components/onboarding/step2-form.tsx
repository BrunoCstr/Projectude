"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Palette, Code, Building, Home, Mic, CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";

// Schema for Step 2
const step2Schema = z.object({
  userType: z.string().min(1, { message: "*" }),
});

export type Step2FormData = z.infer<typeof step2Schema>;

interface Step2FormProps {
  onSubmit: (data: Step2FormData) => void;
  onPrevious: () => void;
}

export function Step2Form({ onSubmit, onPrevious }: Step2FormProps) {
  const t = useTranslations("onboarding");

  // User Role Options
  const userRoles = [
    { value: "design", label: t("step2.roles.design"), icon: Palette },
    { value: "developer", label: t("step2.roles.developer"), icon: Code },
    {
      value: "entrepreneur",
      label: t("step2.roles.entrepreneur"),
      icon: Building,
    },
    { value: "architect", label: t("step2.roles.architect"), icon: Home }, // Changed from Building2 to Home
    { value: "influencer", label: t("step2.roles.influencer"), icon: Mic },
    { value: "other", label: t("step2.roles.other"), icon: CircleHelp },
  ];

  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      userType: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-base font-semibold">
                {t("step2.question")}
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {userRoles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <FormItem key={role.value} className="flex-1">
                        <FormControl>
                          {/* Custom styled Radio item */}
                          <RadioGroupItem
                            value={role.value}
                            id={`role-${role.value}`}
                            className="sr-only"
                          />
                        </FormControl>
                        <Label
                          htmlFor={`role-${role.value}`}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                            field.value === role.value &&
                              "border-primary ring-1 ring-primary bg-primary/5"
                          )}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-sm font-medium">
                            {role.label}
                          </span>
                        </Label>
                      </FormItem>
                    );
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onPrevious}>
            {t("step2.actions.back")}
          </Button>
          <Button type="submit">{t("step2.actions.submit")}</Button>
        </div>
      </form>
    </Form>
  );
}
