"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  PlusCircle,
  Trash2,
  Upload,
  Link as LinkIcon,
  Users,
  Lock,
  Unlock,
  FileText,
  Image as ImageIcon,
  Facebook,
  Twitter,
  Github,
  Globe,
  ChevronsUpDown,
  Check as CheckIcon,
  X,
  Package,
  AlignLeft,
  MapPin,
  Home,
  Building,
  KeyRound,
  Mail,
  Tag as LucideTag,
  Shapes,
  Info,
  Workflow,
  EyeOff,
  Eye,
  Briefcase,
  GraduationCap,
  Heart,
  Palette,
  Building2,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import type { Collaborator } from "@/services/collaborator";
import type {
  Project,
  Tag,
  ProjectCollaborator,
  ProjectLink,
  Credential,
  Address,
  ProjectAttachment,
} from "@/services/project"; // Import Project type and related types
import { listCollaborators } from "@/services/collaborator";
import { listTags } from "@/services/tag";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import Image from "next/image"; // Import next/image
import { getInitializedFirestore, getInitializedStorage } from "@/lib/firebase"; // ou onde você tiver exportado sua instância
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseInvestment } from "@/utils/parseInvestment";

const db = getInitializedFirestore();
const storage = getInitializedStorage();

// Define available link icons (replace with actual icons if needed)
const linkIcons = {
  facebook: Facebook,
  twitter: Twitter,
  github: Github,
  website: Globe,
  other: LinkIcon,
};
type LinkIconType = keyof typeof linkIcons;

const MAX_ATTACHMENTS = 3;

const projectSchema = z.object({
  logo: z.any().optional(), // Handle file uploads separately
  cover: z.any().optional(), // Handle file uploads separately
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  investment: z.string().optional(),
  startDate: z.date().optional(),
  status: z.enum(["Pendente", "Em Andamento", "Pausado", "Concluído"]),
  tags: z.array(z.string()).optional(), // Array of tag IDs
  isPhysical: z.boolean().default(false),
  address: z
    .object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      neighborhood: z.string().optional(),
      street: z.string().optional(),
    })
    .optional(),
  links: z
    .array(
      z.object({
        // Use z.string() for icon type key, validation happens implicitly via enum keys
        icon: z.string().refine((val) => Object.keys(linkIcons).includes(val), {
          message: "Invalid icon type",
        }),
        url: z.string().url("Please enter a valid URL"),
      })
    )
    .optional(),
  credentials: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        email: z
          .string()
          .email("Invalid email address")
          .optional()
          .or(z.literal("")),
        password: z.string().optional(),
        url: z.string().url("Invalid URL").optional().or(z.literal("")), // Added URL field
      })
    )
    .optional(),
  collaborators: z
    .array(
      z.object({
        id: z.string(),
        canViewCredentials: z.boolean().default(false),
      })
    )
    .optional(),
  attachments: z
    .array(z.any())
    .max(MAX_ATTACHMENTS, `Maximum ${MAX_ATTACHMENTS} attachments allowed`)
    .optional(), // Handle file uploads separately
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectFormProps {
  onClose: (project?: Project) => void; // Pass the created/edited project back on close if needed
  projectToEdit?: Project; // Optional project data for editing
  onProjectCreated?: (newProject: Project) => void; // Add this prop
}

export function CreateProjectForm({
  onClose,
  projectToEdit,
  onProjectCreated,
}: CreateProjectFormProps) {
  const [allCollaborators, setAllCollaborators] = React.useState<
    Collaborator[]
  >([]);
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = React.useState<
    Collaborator[]
  >([]);
  const [collabPopoverOpen, setCollabPopoverOpen] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [showPasswordStates, setShowPasswordStates] = React.useState<
    Record<number, boolean>
  >({}); // State for password visibility per credential
  const { userData } = useAuth();
  const router = useRouter();

  const isEditing = !!projectToEdit;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      investment: "0,00",
      status: "Pendente",
      tags: [],
      isPhysical: false,
      address: {
        country: "",
        state: "",
        city: "",
        neighborhood: "",
        street: "",
      },
      links: [],
      credentials: [],
      collaborators: [],
      attachments: [],
      startDate: undefined,
      logo: undefined,
      cover: undefined,
    },
  });

  // Populate form with project data when editing
  React.useEffect(() => {
    if (isEditing && projectToEdit) {
      // Map project data to form data structure
      const formData: Partial<ProjectFormData> = {
        name: projectToEdit.name,
        description: projectToEdit.description,
        investment: projectToEdit.investment?.toString() || "0,00",
        startDate: projectToEdit.startDate
          ? new Date(projectToEdit.startDate)
          : undefined,
        status: projectToEdit.status as ProjectFormData["status"], // Assert type
        tags: projectToEdit.tags?.map((tag) => tag.id) || [],
        isPhysical: projectToEdit.isPhysical || false,
        address: projectToEdit.address || {
          country: "",
          state: "",
          city: "",
          neighborhood: "",
          street: "",
        },
        // Map links, ensuring icon type is a string key
        links:
          projectToEdit.links?.map((link) => ({
            id: link.id, // Keep ID if needed for update
            icon: link.type || "other", // Default to 'other' if type is missing
            url: link.url,
          })) || [],
        credentials:
          projectToEdit.credentials?.map((cred) => ({
            id: cred.id, // Keep ID if needed for update, though form doesn't use it directly
            description: cred.description,
            email: cred.email || "",
            password: cred.password || "",
            url: cred.url || "", // Added URL
          })) || [],
        collaborators:
          projectToEdit.collaborators?.map((collab) => ({
            id: collab.id,
            canViewCredentials: !!collab.canViewCredentials, // Ensure boolean
          })) || [],
        attachments: projectToEdit.attachments || [],

        // logo: projectToEdit.logoUrl, // Need to handle file representation if needed
        // cover: projectToEdit.coverUrl,
      };
      form.reset(formData);
      setLogoPreview(projectToEdit.logoUrl || null); // Set previews for editing
      setCoverPreview(projectToEdit.coverUrl || null);

      // Set selected collaborators state for the UI
      const initialSelectedCollabs = allCollaborators.filter((c) =>
        projectToEdit.collaborators?.some((pc) => pc.id === c.id)
      );
      setSelectedCollaborators(initialSelectedCollabs);
    }
  }, [isEditing, projectToEdit, form, allCollaborators]);

  const {
    fields: linkFields,
    append: appendLink,
    remove: removeLink,
  } = useFieldArray({
    control: form.control,
    name: "links",
  });

  const {
    fields: credentialFields,
    append: appendCredential,
    remove: removeCredential,
  } = useFieldArray({
    control: form.control,
    name: "credentials",
  });

  const {
    fields: attachmentFields,
    append: appendAttachment,
    remove: removeAttachment,
  } = useFieldArray({
    control: form.control,
    name: "attachments",
  });

  React.useEffect(() => {
    if (!userData) return;

    async function fetchData() {
      try {
        const [collabsData, tagsData] = await Promise.all([
          listCollaborators(userData?.uid),
          listTags(userData?.uid),
        ]);
        setAllCollaborators(collabsData);
        setAllTags(tagsData);
        // If editing, set initial collaborators after fetching all collaborators
        if (isEditing && projectToEdit) {
          const initialSelectedCollabs = collabsData.filter((c) =>
            projectToEdit.collaborators?.some((pc) => pc.id === c.id)
          );
          setSelectedCollaborators(initialSelectedCollabs);
        }
      } catch (error) {
        console.error("Failed to fetch collaborators or tags:", error);
        toast({
          variant: "destructive",
          title: t("createProjectsToasts.error"),
          description: t("createProjectsToasts.errorLoadTag"),
        });
      }
    }
    fetchData();
  }, [userData, isEditing, projectToEdit, toast]); // Added toast to dependency array

  function removeUndefinedFields<T extends Record<string, any>>(
    obj: T
  ): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);

    const collaboratorsPayload = selectedCollaborators.map((c) => ({
      id: c.id,
      canViewCredentials:
        form.getValues("collaborators")?.find((fc) => fc.id === c.id)
          ?.canViewCredentials ?? false,
    }));

    const collaboratorsId = collaboratorsPayload.map((cp) => cp.id);

    let projectRef;
    if (isEditing && projectToEdit) {
      projectRef = doc(db, "projects", projectToEdit.id);
    } else {
      projectRef = await addDoc(collection(db, "projects"), {
        creatorUID: userData?.uid,
        collaboratorIds: [], // nome exato para bater com sua regra
        createdAt: new Date().toISOString(),
      });
    }
    const projectId = projectRef.id;

    // Simulate file upload if files are selected (replace with actual upload logic)
    let logoUrl = projectToEdit?.logoUrl;
    if (data.logo?.length) {
      const file = data.logo[0];
      const path = `projects/${
        userData?.uid
      }/${projectId}/logos/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      logoUrl = await getDownloadURL(storageRef);
    }

    let coverUrl = projectToEdit?.coverUrl;
    if (data.cover?.length) {
      const file = data.cover[0];
      const path = `projects/${
        userData?.uid
      }/${projectId}/covers/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      coverUrl = await getDownloadURL(storageRef);
    }

    const attachmentData: ProjectAttachment[] = [];
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        const path = `projects/${
          userData?.uid
        }/${projectId}/attachments/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        attachmentData.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          url,
          type: file.type,
          size: file.size,
        });
      }
    }

    // Map form data back to the Project structure
    const projectData: Partial<Project> = {
      name: data.name,
      description: data.description || "",
      investment: parseInvestment(data.investment || 0.0),
      startDate: data.startDate ? data.startDate.toISOString() : undefined,
      status: data.status,
      tags: data.tags
        ?.map((tagId) => allTags.find((t) => t.id === tagId))
        .filter(Boolean) as Tag[], // Map IDs back to Tag objects
      isPhysical: data.isPhysical,
      address: data.isPhysical ? (data.address as Address) : undefined,
      links:
        data.links?.map((link, i) => ({
          id: projectToEdit?.links?.[i]?.id || `new-link-${i}`, // Reuse ID or generate temp
          type: link.icon,
          url: link.url,
        })) || [],
      credentials:
        data.credentials?.map((cred, i) => ({
          id: projectToEdit?.credentials?.[i]?.id || `new-cred-${i}`, // Reuse ID or generate temp
          description: cred.description,
          email: cred.email,
          password: cred.password,
          url: cred.url, // Added URL
        })) || [],
      collaborators: collaboratorsPayload.map((cp) => {
        const baseCollab = allCollaborators.find((c) => c.id === cp.id);
        return {
          ...baseCollab!, // Assume collaborator exists
          canViewCredentials: cp.canViewCredentials,
        };
      }) as ProjectCollaborator[], // Assert type
      collaboratorsId,
      logoUrl: logoUrl,
      coverUrl: coverUrl,
      id: projectId,
      attachments: attachmentData, // Use the simulated uploaded data
      createdAt: isEditing ? projectToEdit.createdAt : new Date().toISOString(),
      creatorName: isEditing
        ? projectToEdit.creatorName
        : userData?.displayName,
      creatorUID: isEditing ? projectToEdit.creatorUID : userData?.uid,
    };

    console.log("Form Payload Mapped to Project:", projectData);

    let savedProject: Project | null = null; // To store the created/updated project

    try {
      // 4) Persiste no Firestore (merge em edição)
      await setDoc(
        projectRef,
        {
          // mantém só os campos definidos do seu projectData
          ...removeUndefinedFields(projectData),
          // grava o array de IDs de colaboradores com o nome exato que sua regra espera
          collaboratorIds: selectedCollaborators.map((c) => c.id),
        },
        { merge: true }
      );

      toast({
        title: isEditing
          ? t("createProjectsToasts.projectUpdated")
          : t("createProjectsToasts.projectCreated"),
        description: `Projeto \"${data.name}\" ${
          isEditing
            ? t("createProjectsToasts.updated")
            : t("createProjectsToasts.created")
        }`,
      });

      const saved: Project = {
        ...(projectToEdit || {}),
        ...projectData,
      } as Project;
      onClose(saved);
      if (!isEditing && onProjectCreated) onProjectCreated(saved);
      form.reset();
      setSelectedCollaborators([]);
      setLogoPreview(null);
      setCoverPreview(null);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t("createProjectsToasts.error"),
        description: `${t("createProjectsToasts.fail")} ${
          isEditing
            ? t("createProjectsToasts.update")
            : t("createProjectsToasts.create")
        } ${t("createProjectsToasts.project")}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input changes for previews
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Update form state (important for submission)
      form.setValue(event.target.name as keyof ProjectFormData, [file]); // Store file object
    } else {
      setPreview(null);
      form.setValue(event.target.name as keyof ProjectFormData, undefined);
    }
    event.target.value = ""; // Allow re-selecting the same file
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const currentCount = attachmentFields.length;
      const availableSlots = MAX_ATTACHMENTS - currentCount;

      if (files.length > availableSlots) {
        toast({
          variant: "destructive",
          title: t("createProjectsToasts.tooManyFile"),
          description: `${t(
            "createProjectsToasts.youCanOnlyAdd"
          )} ${availableSlots} ${t(
            "createProjectsToasts.moreFileMaximum"
          )} ${MAX_ATTACHMENTS}.`,
        });
        event.target.value = ""; // Clear the input
        return;
      }

      files.forEach((file) => appendAttachment(file)); // Append the file objects directly
      event.target.value = ""; // Clear the input after processing
    }
  };

  const handleRemoveAttachment = (index: number) => {
    removeAttachment(index);
  };

  const handleCollaboratorSelect = (collaborator: Collaborator) => {
    const isCurrentlySelected = selectedCollaborators.some(
      (c) => c.id === collaborator.id
    );
    let updatedSelectedCollaborators: Collaborator[];
    let updatedFormCollaborators = form.getValues("collaborators") || [];

    if (isCurrentlySelected) {
      // Deselect: Remove from selected state and form state
      updatedSelectedCollaborators = selectedCollaborators.filter(
        (c) => c.id !== collaborator.id
      );
      updatedFormCollaborators = updatedFormCollaborators.filter(
        (fc) => fc.id !== collaborator.id
      );
    } else {
      // Select: Add to selected state and form state (with default visibility)
      updatedSelectedCollaborators = [...selectedCollaborators, collaborator];
      if (!updatedFormCollaborators.some((fc) => fc.id === collaborator.id)) {
        updatedFormCollaborators = [
          ...updatedFormCollaborators,
          { id: collaborator.id, canViewCredentials: false },
        ];
      }
    }

    setSelectedCollaborators(updatedSelectedCollaborators);
    form.setValue("collaborators", updatedFormCollaborators);
    // Don't close popover on select/deselect
    // setCollabPopoverOpen(false);
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswordStates((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const isPhysical = form.watch("isPhysical");
  const t = useTranslations("projects");

  return (
    // Use form element for proper semantics and potential native browser validation
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Images Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <ImageIcon className="h-5 w-5" /> {t("form.sections.images.title")}
          </CardTitle>
          <CardDescription>
            {t("form.sections.images.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="logo"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />{" "}
              {t("form.sections.images.logoLabel")}
            </Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-md border bg-muted">
                <AvatarImage
                  src={logoPreview || undefined}
                  alt="Logo Preview"
                  className="object-contain"
                />
                <AvatarFallback className="rounded-md">
                  {t("form.sections.images.logoFallback")}
                </AvatarFallback>
              </Avatar>
              <Controller
                name="logo"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        // 1) preview
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setLogoPreview(reader.result as string);
                        reader.readAsDataURL(files[0]);

                        // 2) atualiza o RHF
                        field.onChange(Array.from(files)); // agora `data.logo` será File[]
                      }
                    }} // Update preview and form state
                    className="h-auto p-2 border-dashed border-muted-foreground/50 flex-1"
                  />
                )}
              />
            </div>
            {form.formState.errors.logo && (
              <p className="text-sm text-destructive">
                {form.formState.errors.logo.message?.toString()}
              </p>
            )}
          </div>
          {/* Cover Upload */}
          <div className="space-y-2">
            <Label
              htmlFor="cover"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground" />{" "}
              {t("form.sections.images.coverLabel")}
            </Label>
            <div className="flex items-center gap-4">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-md border object-cover bg-muted"
                />
              ) : (
                <div className="h-16 w-16 rounded-md border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  {t("form.sections.images.coverLabel")}
                </div>
              )}
              <Controller
                name="cover"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files[0]) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setCoverPreview(reader.result as string);
                        reader.readAsDataURL(files[0]);
                        field.onChange(Array.from(files));
                      }
                    }} // Update preview and form state
                    className="h-auto p-2 border-dashed border-muted-foreground/50 flex-1"
                  />
                )}
              />
            </div>
            {form.formState.errors.cover && (
              <p className="text-sm text-destructive">
                {form.formState.errors.cover.message?.toString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" /> {t("form.sections.basicInfo.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Name */}
          <div className="relative">
            <Label htmlFor="name">
              {" "}
              {t("form.sections.basicInfo.projectNameLabel")}{" "}
            </Label>
            <Package className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              {...form.register("name")}
              placeholder={t("form.sections.basicInfo.projectNamePlaceholder")}
              className="pl-10"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          {/* Description */}
          <div className="relative">
            {" "}
            {/* Keep relative positioning */}
            <Label htmlFor="description">
              {" "}
              {t("form.sections.basicInfo.descriptionLabel")}{" "}
            </Label>
            {/* Remove icon here */}
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder={t("form.sections.basicInfo.descriptionPlaceholder")}
              className="pt-2" // Keep padding top, remove left padding
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          {/* Investment */}
          <div className="relative">
            <Label htmlFor="investment">
              {" "}
              {t("form.sections.basicInfo.investmentLabel")}{" "}
            </Label>
            <DollarSign className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
            <Input
              id="investment"
              {...form.register("investment")}
              placeholder={t("form.sections.basicInfo.investmentPlaceholder")}
              className="pl-10"
            />
            {form.formState.errors.investment && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.investment.message}
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <Label htmlFor="startDate">
                {" "}
                {t("form.sections.basicInfo.startDateLabel")}{" "}
              </Label>
              <Controller
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal pl-10 relative", // Add relative positioning
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />{" "}
                        {/* Icon inside */}
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>
                            {t("form.sections.basicInfo.startDatePlaceholder")}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[9999] overflow-visible"
                      sideOffset={8}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div className="pointer-events-auto">
                        <Calendar
                          mode="single"
                          selected={field.value ?? new Date()}
                          onSelect={(date) => {
                            if (date) field.onChange(date);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>
            {/* Status */}
            <div className="relative">
              <Label htmlFor="status">
                {" "}
                {t("form.sections.basicInfo.statusLabel")}{" "}
              </Label>
              <Workflow className="absolute left-3 top-9 h-4 w-4 text-muted-foreground z-10" />{" "}
              {/* Icon inside */}
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="pl-10">
                      {" "}
                      {/* Add padding for icon */}
                      <SelectValue
                        placeholder={t(
                          "form.sections.basicInfo.statusPlaceholder"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendente">
                        {t("form.sections.basicInfo.statusOptions.pending")}
                      </SelectItem>
                      <SelectItem value="Em Andamento">
                        {t("form.sections.basicInfo.statusOptions.inProgress")}
                      </SelectItem>
                      <SelectItem value="Pausado">
                        {t("form.sections.basicInfo.statusOptions.paused")}
                      </SelectItem>
                      <SelectItem value="Concluído">
                        {t("form.sections.basicInfo.statusOptions.completed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.status && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>
          {/* Tags Selection */}
          <div className="relative">
            <Label> {t("form.sections.basicInfo.tagsLabel")} </Label>
            <LucideTag className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />{" "}
            {/* Icon inside */}
            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between pl-10" // Add padding for icon
                    >
                      {field.value && field.value.length > 0
                        ? `${field.value.length} ${t(
                            "form.sections.basicInfo.tagsPlaceholderSelected"
                          )}`
                        : t("form.sections.basicInfo.tagsPlaceholder")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search tags..."
                        className="pointer-events-auto"
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t("form.sections.basicInfo.tagsNoneFound")}
                        </CommandEmpty>
                        <CommandGroup>
                          {allTags.map((tag) => {
                            const isSelected = field.value?.includes(tag.id);
                            return (
                              <CommandItem
                                key={tag.id}
                                value={tag.name} // Search by name
                                onSelect={() => {
                                  const currentTags = field.value || [];
                                  const newTags = isSelected
                                    ? currentTags.filter((t) => t !== tag.id)
                                    : [...currentTags, tag.id];
                                  field.onChange(newTags);
                                }}
                                className="pointer-events-auto"
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span
                                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                ></span>
                                {tag.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            />
            {/* Display selected tags as badges */}
            {form.watch("tags") && form.watch("tags")!.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.watch("tags")!.map((tagId) => {
                  const tag = allTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color,
                        color: "hsl(var(--primary-foreground))",
                      }}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}
            {form.formState.errors.tags && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.tags.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" /> {t("form.sections.location.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              control={form.control}
              name="isPhysical"
              render={({ field }) => (
                <Switch
                  id="isPhysical"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isPhysical">
              {t("form.sections.location.isPhysicalLabel")}
            </Label>
          </div>
          {isPhysical && (
            <div className="space-y-3 border p-4 rounded-md bg-muted/50">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Country */}
                <div className="relative">
                  <Label htmlFor="address.country">
                    {" "}
                    {t("form.sections.location.countryLabel")}{" "}
                  </Label>
                  <Globe className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address.country"
                    {...form.register("address.country")}
                    placeholder={t("form.sections.location.countryPlaceholder")}
                    className="pl-10"
                  />
                  {form.formState.errors.address?.country && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.address.country.message}
                    </p>
                  )}
                </div>
                {/* State */}
                <div className="relative">
                  <Label htmlFor="address.state">
                    {" "}
                    {t("form.sections.location.stateLabel")}{" "}
                  </Label>
                  <Building2 className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address.state"
                    {...form.register("address.state")}
                    placeholder={t("form.sections.location.statePlaceholder")}
                    className="pl-10"
                  />
                  {form.formState.errors.address?.state && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.address.state.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* City */}
                <div className="relative">
                  <Label htmlFor="address.city">
                    {" "}
                    {t("form.sections.location.cityLabel")}{" "}
                  </Label>
                  <Building className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address.city"
                    {...form.register("address.city")}
                    placeholder={t("form.sections.location.cityPlaceholder")}
                    className="pl-10"
                  />
                  {form.formState.errors.address?.city && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.address.city.message}
                    </p>
                  )}
                </div>
                {/* Neighborhood */}
                <div className="relative">
                  <Label htmlFor="address.neighborhood">
                    {" "}
                    {t("form.sections.location.neighborhoodLabel")}{" "}
                  </Label>
                  <Home className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address.neighborhood"
                    {...form.register("address.neighborhood")}
                    placeholder={t(
                      "form.sections.location.neighborhoodPlaceholder"
                    )}
                    className="pl-10"
                  />
                  {form.formState.errors.address?.neighborhood && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.address.neighborhood.message}
                    </p>
                  )}
                </div>
              </div>
              {/* Street Address */}
              <div className="relative">
                <Label htmlFor="address.street">
                  {" "}
                  {t("form.sections.location.streetLabel")}{" "}
                </Label>
                <MapPin className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address.street"
                  {...form.register("address.street")}
                  placeholder={t("form.sections.location.streetPlaceholder")}
                  className="pl-10"
                />
                {form.formState.errors.address?.street && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.address.street.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between text-primary">
            <span className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" /> {t("form.sections.links.title")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendLink({ icon: "other", url: "" })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />{" "}
              {t("form.sections.links.addLink")}
            </Button>
          </CardTitle>
          <CardDescription>
            {t("form.sections.links.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-end gap-2 border p-3 rounded-md relative bg-muted/50"
            >
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 flex-grow">
                <Label
                  htmlFor={`links.${index}.icon`}
                  className="text-xs font-medium pt-1 flex items-center gap-1"
                >
                  <Shapes className="h-3 w-3" />{" "}
                  {t("form.sections.links.iconLabel")}
                </Label>
                <Controller
                  control={form.control}
                  name={`links.${index}.icon`}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value as string}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue
                          placeholder={t("form.sections.links.placeholderIcon")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(linkIcons).map(
                          ([key, IconComponent]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </span>
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />

                <Label
                  htmlFor={`links.${index}.url`}
                  className="text-xs font-medium pt-1 flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" />{" "}
                  {t("form.sections.links.urlLabel")}
                </Label>
                <div className="relative w-full">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`links.${index}.url`}
                    {...form.register(`links.${index}.url`)}
                    placeholder={t("form.sections.links.urlPlaceholder")}
                    className="h-8 pl-10" // Add padding for icon
                  />
                </div>
                {form.formState.errors.links?.[index]?.url && (
                  <p className="text-sm text-destructive col-span-2">
                    {form.formState.errors.links[index]?.url?.message}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive absolute top-1 right-1"
                onClick={() => removeLink(index)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">
                  {t("form.sections.links.removeLink")}
                </span>
              </Button>
            </div>
          ))}
          {linkFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("form.sections.links.noLinks")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Credentials Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between text-primary">
            <span className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />{" "}
              {t("form.sections.credentials.title")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                appendCredential({
                  description: "",
                  email: "",
                  password: "",
                  url: "",
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />{" "}
              {t("form.sections.credentials.addCredential")}
            </Button>
          </CardTitle>
          <CardDescription>
            {t("form.sections.credentials.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credentialFields.map((field, index) => (
            <div
              key={field.id}
              className="space-y-3 border p-4 rounded-md relative bg-muted/50"
            >
              {/* Description */}
              <div className="relative">
                <Label htmlFor={`credentials.${index}.description`}>
                  {" "}
                  {t("form.sections.credentials.descriptionLabel")}{" "}
                </Label>
                <AlignLeft className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`credentials.${index}.description`}
                  {...form.register(`credentials.${index}.description`)}
                  placeholder={t(
                    "form.sections.credentials.descriptionPlaceholder"
                  )}
                  className="pl-10"
                />
                {form.formState.errors.credentials?.[index]?.description && (
                  <p className="text-sm text-destructive mt-1">
                    {
                      form.formState.errors.credentials[index]?.description
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Email/Username */}
                <div className="relative">
                  <Label htmlFor={`credentials.${index}.email`}>
                    {" "}
                    {t("form.sections.credentials.emailLabel")}{" "}
                  </Label>
                  <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`credentials.${index}.email`}
                    {...form.register(`credentials.${index}.email`)}
                    placeholder={t(
                      "form.sections.credentials.emailPlaceholder"
                    )}
                    className="pl-10"
                  />
                  {form.formState.errors.credentials?.[index]?.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.credentials[index]?.email?.message}
                    </p>
                  )}
                </div>
                {/* Password */}
                <div className="relative">
                  <Label htmlFor={`credentials.${index}.password`}>
                    {" "}
                    {t("form.sections.credentials.passwordLabel")}{" "}
                  </Label>
                  <KeyRound className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`credentials.${index}.password`}
                    type={showPasswordStates[index] ? "text" : "password"}
                    {...form.register(`credentials.${index}.password`)}
                    placeholder={t(
                      "form.sections.credentials.passwordPlaceholder"
                    )}
                    className="pl-10 pr-10" // Add padding for icons
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground hover:text-foreground" // Adjusted position
                    onClick={() => togglePasswordVisibility(index)}
                    tabIndex={-1}
                  >
                    {showPasswordStates[index] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPasswordStates[index]
                        ? t("form.sections.credentials.togglePasswordHide")
                        : t("form.sections.credentials.togglePasswordShow")}
                    </span>
                  </Button>
                  {form.formState.errors.credentials?.[index]?.password && (
                    <p className="text-sm text-destructive mt-1">
                      {
                        form.formState.errors.credentials[index]?.password
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
              {/* URL */}
              <div className="relative">
                <Label htmlFor={`credentials.${index}.url`}>
                  {" "}
                  {t("form.sections.credentials.urlLabel")}{" "}
                </Label>
                <LinkIcon className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`credentials.${index}.url`}
                  type="url"
                  {...form.register(`credentials.${index}.url`)}
                  placeholder={t("form.sections.credentials.urlPlaceholder")}
                  className="pl-10"
                />
                {form.formState.errors.credentials?.[index]?.url && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.credentials[index]?.url?.message}
                  </p>
                )}
              </div>
              {/* Delete Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive absolute top-2 right-2"
                onClick={() => removeCredential(index)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">
                  {t("form.sections.credentials.removeCredential")}
                </span>
              </Button>
            </div>
          ))}
          {credentialFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("form.sections.credentials.noCredentials")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Collaborators Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />{" "}
            {t("form.sections.collaborators.title")}
          </CardTitle>
          <CardDescription>
            {t("form.sections.collaborators.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Display selected collaborators above the button */}
          {selectedCollaborators.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2 border p-2 rounded-md bg-muted/20">
              {selectedCollaborators.map((collab) => (
                <Badge
                  key={collab.id}
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={collab.photoURL} alt={collab.name} />
                    <AvatarFallback className="text-[0.6rem]">
                      {collab.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {collab.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={() => handleCollaboratorSelect(collab)}
                    aria-label={`${t(
                      "form.sections.collaborators.removeCollaborator"
                    )} ${collab.name}`}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {/* Popover Trigger Button */}
          <div className="relative">
            <Label>
              {" "}
              {t("form.sections.collaborators.addCollaboratorsLabel")}{" "}
            </Label>
            <Users className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />{" "}
            {/* Icon inside */}
            <Popover
              open={collabPopoverOpen}
              onOpenChange={setCollabPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={collabPopoverOpen}
                  className="w-full justify-between pl-10" // Add padding for icon
                >
                  {selectedCollaborators.length > 0
                    ? `${t(
                        "form.sections.collaborators.manageCollaborators"
                      )} (${selectedCollaborators.length})`
                    : t("form.sections.collaborators.searchPlaceholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search collaborators..." />
                  <CommandList>
                    <CommandEmpty>
                      {t("form.sections.collaborators.noCollaboratorsFound")}
                    </CommandEmpty>
                    <CommandGroup>
                      {allCollaborators.map((collaborator) => {
                        const isSelected = selectedCollaborators.some(
                          (c) => c.id === collaborator.id
                        );
                        return (
                          <CommandItem
                            key={collaborator.id}
                            value={collaborator.id}
                            onSelect={(id) => {
                              const collab = allCollaborators.find(
                                (c) => c.id === id
                              );
                              if (collab) {
                                handleCollaboratorSelect(collab);
                              }
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 pointer-events-auto">
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={collaborator.photoURL}
                                  alt={collaborator.name}
                                />
                                <AvatarFallback className="text-xs">
                                  {collaborator.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {collaborator.name} ({collaborator.email})
                              </span>
                            </div>
                            <CheckIcon
                              className={cn(
                                "ml-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Credential Visibility Switches */}
          {selectedCollaborators.length > 0 && (
            <div className="space-y-2 pt-3">
              <Label className="text-sm font-medium">
                Credential Visibility
              </Label>
              {selectedCollaborators.map((collaborator) => {
                const fieldIndex = form
                  .watch("collaborators")
                  ?.findIndex((c) => c.id === collaborator.id);
                // Skip rendering if collaborator is not found in the form state yet (might happen briefly on add)
                if (fieldIndex === undefined || fieldIndex < 0) return null;

                return (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
                  >
                    <span className="text-sm flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={collaborator.photoURL}
                          alt={collaborator.name}
                        />
                        <AvatarFallback className="text-xs">
                          {collaborator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {collaborator.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={`collaborators.${fieldIndex}.canViewCredentials`}
                        className="text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {form.watch(
                          `collaborators.${fieldIndex}.canViewCredentials`
                        ) ? (
                          <Unlock className="h-3 w-3 text-green-600" />
                        ) : (
                          <Lock className="h-3 w-3 text-red-600" />
                        )}
                        {t("form.sections.collaborators.canViewLabel")}
                      </Label>
                      <Controller
                        control={form.control}
                        name={`collaborators.${fieldIndex}.canViewCredentials`}
                        render={({ field }) => (
                          <Switch
                            id={`collaborators.${fieldIndex}.canViewCredentials`}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {form.formState.errors.collaborators && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.collaborators.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between text-primary">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />{" "}
              {t("form.sections.attachments.title")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                document.getElementById("attachments-input")?.click()
              }
            >
              <Upload className="mr-2 h-4 w-4" />{" "}
              {t("form.sections.attachments.addFiles")}
            </Button>
          </CardTitle>
          <CardDescription>
            {t("form.sections.attachments.description")} (max {MAX_ATTACHMENTS}
            ).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            id="attachments-input"
            type="file"
            multiple
            onChange={handleAttachmentChange}
            className="hidden"
            accept="*" // Or be more specific like ".pdf,.docx,.png"
          />
          {attachmentFields.map(
            (
              field: any,
              index // Add 'any' type temporarily if field type is causing issues
            ) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 text-sm truncate">
                  <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {field.name || `Attachment ${index + 1}`}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {t("form.sections.attachments.removeAttachment")}
                  </span>
                </Button>
              </div>
            )
          )}
          {attachmentFields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("form.sections.attachments.noAttachments")}
            </p>
          )}
          {form.formState.errors.attachments && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.attachments.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose()}
          disabled={isLoading}
        >
          {t("form.actions.cancel")}
        </Button>
        {/* Submit Button */}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? isEditing
              ? t("form.actions.updateLoading")
              : t("form.actions.createLoading")
            : isEditing
            ? t("form.actions.update")
            : t("form.actions.create")}
        </Button>
      </div>
    </form>
  );
}
