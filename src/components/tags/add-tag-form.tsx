"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form"; // Added Controller
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // For description
import { useToast } from "@/hooks/use-toast";
import { createTag } from "@/services/tag";
import type { Tag } from "@/services/project";
import { cn } from "@/lib/utils"; // Import cn
import { Check } from "lucide-react"; // Import Check icon
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

// Define predefined colors (HSL format for compatibility with existing code)
const predefinedTagColors = [
  { name: "Primary", value: "hsl(180 82% 44%)" }, // Primary
  { name: "Accent", value: "hsl(16 100% 66%)" }, // Accent (Coral)
  { name: "Destructive", value: "hsl(0 84.2% 60.2%)" }, // Red
  { name: "Green", value: "hsl(142 71% 45%)" }, // Green
  { name: "Blue", value: "hsl(221 83% 53%)" }, // Blue
  { name: "Purple", value: "hsl(262 84% 58%)" }, // Purple
  { name: "Yellow", value: "hsl(48 96% 50%)" }, // Yellow
  { name: "Muted", value: "hsl(240 4.8% 95.9%)" }, // Muted (Light Gray) - Use as default?
  { name: "Muted Dark", value: "hsl(240 5% 15%)" }, // Muted Dark (Dark Gray)
];

// Basic HSL validation (adjust regex as needed for more strictness)
const hslColorRegex =
  /^hsl\(\s*\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%\s*\)$/i;

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  description: z.string().optional(),
  color: z
    .string()
    .min(1, "Color is required.")
    .regex(hslColorRegex, "Invalid HSL format (e.g., hsl(180 82% 44%)).")
    // Ensure the selected color is one of the predefined ones
    .refine(
      (value) => predefinedTagColors.some((color) => color.value === value),
      {
        message: "Please select a predefined color.",
      }
    ),
});

type TagFormData = z.infer<typeof tagSchema>;

interface AddTagFormProps {
  onClose: (newTag?: Tag) => void; // Callback to close dialog and pass back new tag
}

export function AddTagForm({ onClose }: AddTagFormProps) {
  const { userData } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const t = useTranslations("tags");

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      color:
        predefinedTagColors.find((c) => c.name === "Muted")?.value ||
        "hsl(240 4.8% 95.9%)", // Default to Muted or a fallback
    },
  });

  const onSubmit = async (data: TagFormData) => {
    setIsLoading(true);

    const uid = userData?.uid;
    if (!uid) {
      toast({
        variant: "destructive",
        title: t("form.errors.unauthenticated.title"),
        description: t("form.errors.unauthenticated.description"),
      });
      setIsLoading(false);
      return;
    }

    console.log("Submitting new tag data:", data);

    try {
      const newTag = await createTag(userData?.uid, {
        name: data.name,
        description: data.description,
        color: data.color,
      });

      toast({
        title: t("form.success.title"),
        description: `${t("form.success.description")} "${newTag.name}" ${t(
          "form.success.description2"
        )}`,
      });
      form.reset(); // Reset form
      onClose(newTag); // Close dialog and pass back new tag
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        variant: "destructive",
        title: t("form.errors.create.title"),
        description: t("form.errors.create.description"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("form.labels.name")}</Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder={t("form.placeholders.name")}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="description">{t("form.labels.description")}</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          placeholder={t("form.placeholders.description")}
          rows={2}
          disabled={isLoading}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Predefined Color Selection */}
      <div>
        <Label>{t("form.labels.color")}</Label>
        <Controller
          name="color"
          control={form.control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2 pt-2">
              {predefinedTagColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={cn(
                    "h-8 w-8 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-110",
                    field.value === colorOption.value &&
                      "ring-2 ring-ring ring-offset-2" // Highlight selected
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => field.onChange(colorOption.value)}
                  title={colorOption.name}
                  disabled={isLoading}
                >
                  {field.value === colorOption.value && (
                    // Add a checkmark inside the circle for better visibility
                    // Choose color based on background lightness for contrast
                    <Check
                      className={cn(
                        "h-5 w-5 mx-auto",
                        // Simple heuristic: darker colors get light check, lighter colors get dark check
                        parseInt(
                          colorOption.value.split(" ")[2].replace("%", ""),
                          10
                        ) < 50
                          ? "text-primary-foreground"
                          : "text-foreground"
                      )}
                    />
                  )}
                  <span className="sr-only">{colorOption.name}</span>
                </button>
              ))}
            </div>
          )}
        />
        {form.formState.errors.color && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.color.message}
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose()}
          disabled={isLoading}
        >
          {t("form.buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("form.buttons.submit.loading")
            : t("form.buttons.submit.default")}
        </Button>
      </div>
    </form>
  );
}
