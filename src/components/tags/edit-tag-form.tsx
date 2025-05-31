'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form'; // Added Controller
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateTag } from '@/services/tag';
import type { Tag } from '@/services/project';
import { cn } from '@/lib/utils'; // Import cn
import { Check } from 'lucide-react'; // Import Check icon

// Define predefined colors (HSL format for compatibility) - Should match AddTagForm
const predefinedTagColors = [
  { name: 'Primary', value: 'hsl(180 82% 44%)' },
  { name: 'Accent', value: 'hsl(16 100% 66%)' },
  { name: 'Destructive', value: 'hsl(0 84.2% 60.2%)' },
  { name: 'Green', value: 'hsl(142 71% 45%)' },
  { name: 'Blue', value: 'hsl(221 83% 53%)' },
  { name: 'Purple', value: 'hsl(262 84% 58%)' },
  { name: 'Yellow', value: 'hsl(48 96% 50%)' },
  { name: 'Muted', value: 'hsl(240 4.8% 95.9%)' },
  { name: 'Muted Dark', value: 'hsl(240 5% 15%)' },
];

// Basic HSL validation (same as add form)
const hslColorRegex = /^hsl\(\s*\d{1,3}(?:\.\d+)?\s+\d{1,3}(?:\.\d+)?%\s+\d{1,3}(?:\.\d+)?%\s*\)$/i;

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required.'),
  description: z.string().optional(),
  color: z.string()
    .min(1, 'Color is required.')
    .regex(hslColorRegex, 'Invalid HSL format.')
    .refine(value => predefinedTagColors.some(color => color.value === value), {
        message: "Please select a predefined color.",
      }),
});

type TagFormData = z.infer<typeof tagSchema>;

interface EditTagFormProps {
  tag: Tag; // The tag being edited
  onClose: (updatedTag?: Tag) => void; // Callback to close the dialog
}

export function EditTagForm({ tag, onClose }: EditTagFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag.name,
      description: tag.description || '',
      // Ensure the default color is one of the predefined options, or fallback
      color: predefinedTagColors.find(c => c.value === tag.color)?.value || predefinedTagColors[0].value,
    },
  });

  const onSubmit = async (data: TagFormData) => {
    setIsLoading(true);
    console.log("Submitting updated tag data:", data);

    try {
      const updatedTag = await updateTag(tag.id, {
        name: data.name,
        description: data.description,
        color: data.color,
      });

      toast({
        title: "Tag Updated",
        description: `Tag "${updatedTag.name}" updated successfully.`,
      });
      form.reset(data); // Update form state with new values
      onClose(updatedTag); // Close dialog and pass back updated tag

    } catch (error) {
      console.error("Error updating tag:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Tag",
        description: "Failed to update tag. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Tag Name *</Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="e.g., Urgent, Backend"
          disabled={isLoading}
        />
        {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Briefly describe the tag's purpose..."
          rows={2}
          disabled={isLoading}
        />
        {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
      </div>

      {/* Predefined Color Selection */}
      <div>
         <Label>Color *</Label>
          <Controller
              name="color"
              control={form.control}
              render={({ field }) => (
                  <div className="flex flex-wrap gap-2 pt-2">
                      {predefinedTagColors.map(colorOption => (
                          <button
                              key={colorOption.value}
                              type="button"
                              className={cn(
                                  "h-8 w-8 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-110",
                                  field.value === colorOption.value && "ring-2 ring-ring ring-offset-2" // Highlight selected
                              )}
                              style={{ backgroundColor: colorOption.value }}
                              onClick={() => field.onChange(colorOption.value)}
                              title={colorOption.name}
                              disabled={isLoading}
                          >
                              {field.value === colorOption.value && (
                                  <Check
                                      className={cn(
                                           "h-5 w-5 mx-auto",
                                           parseInt(colorOption.value.split(' ')[2].replace('%',''), 10) < 50
                                               ? 'text-primary-foreground'
                                               : 'text-foreground'
                                       )}
                                   />
                              )}
                               <span className="sr-only">{colorOption.name}</span>
                          </button>
                      ))}
                  </div>
              )}
          />
          {form.formState.errors.color && <p className="text-sm text-destructive mt-1">{form.formState.errors.color.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onClose()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
