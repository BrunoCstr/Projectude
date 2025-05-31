"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Phone, MapPin, Building, Building2, Globe } from "lucide-react"; // Added icons
import { useTranslations } from "next-intl";

// Schema for Step 1
const step1Schema = z.object({
  phone: z.string().optional(), // Optional for now, add validation if needed (e.g., min length, format)
  country: z.string().min(1, "*"),
  state: z.string().min(1, "*"),
  city: z.string().min(1, "*"),
});

export type Step1FormData = z.infer<typeof step1Schema>;

interface Step1FormProps {
  onSubmit: (data: Step1FormData) => void;
  initialData?: Step1FormData;
}

export function Step1Form({ onSubmit, initialData }: Step1FormProps) {
  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData || {
      phone: "",
      country: "",
      state: "",
      city: "",
    },
  });

  const t = useTranslations("onboarding");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Field */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />{" "}
                {t("step1.fields.phone.label")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("step1.fields.phone.placeholder")}
                  {...field}
                  type="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Location Fields */}
        <div className="space-y-4 rounded-md border p-4 bg-muted/50">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />{" "}
            {t("step1.fields.location.title")}
          </h3>
          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  {t("step1.fields.location.country.label")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("step1.fields.location.country.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* State */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  {t("step1.fields.location.state.label")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("step1.fields.location.state.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-xs">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  {t("step1.fields.location.city.label")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("step1.fields.location.city.placeholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit">{t("step1.actions.next")}</Button>
        </div>
      </form>
    </Form>
  );
}
