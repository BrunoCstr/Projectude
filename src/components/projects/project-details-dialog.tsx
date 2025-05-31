"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import type {
  Project,
  ProjectLink,
  Credential,
  Address,
} from "@/services/project";
import type { Collaborator } from "@/services/collaborator";
import {
  CalendarIcon,
  DollarSign,
  MapPin,
  Link as LinkIcon,
  Globe,
  Facebook,
  Twitter,
  Github,
  Users,
  Lock,
  Unlock,
  FileText,
  Eye,
  Edit,
  Trash2,
  Circle,
} from "lucide-react"; // Added Circle icon
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddProjectButton } from "./add-project-button"; // Import AddProjectButton for Edit
import { toast } from "@/hooks/use-toast"; // Import toast for notifications
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { getInitializedStorage } from "@/lib/firebase";
import { getInitializedFirestore } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { useTranslations } from "next-intl";

const db = getInitializedFirestore();
const storage = getInitializedStorage();

interface ProjectDetailsDialogProps {
  project: Project;
  children: React.ReactNode;
  onProjectUpdated?: (project: Project) => void;
  onProjectDeleted?: (projectId: string) => void;
}

// Helper to get the icon for a link type (reuse from page)
const getLinkIcon = (type?: string): LucideIcon => {
  switch (type?.toLowerCase()) {
    case "facebook":
      return Facebook;
    case "twitter":
      return Twitter;
    case "github":
      return Github;
    case "website":
      return Globe;
    default:
      return LinkIcon;
  }
};

// Function to truncate URL for display (reuse from page)
const truncateUrl = (url: string, maxLength = 30): string => {
  let displayUrl = url.replace(/^https?:\/\//, "");
  displayUrl = displayUrl.replace(/^www\./, "");
  if (displayUrl.length > maxLength) {
    return displayUrl.substring(0, maxLength - 3) + "...";
  }
  return displayUrl;
};

// Function to format currency (reuse from page)
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Function to format date (reuse from page)
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};

// Function to get the Tailwind color class based on status (reuse from page)
const getStatusColorClass = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "concluído":
      return "text-green-600 dark:text-green-500"; // Green
    case "em andamento":
      return "text-yellow-500 dark:text-yellow-400"; // Yellow
    case "pausado":
      return "text-destructive"; // Red (uses theme destructive)
    case "pendente":
      return "text-muted-foreground"; // Gray (uses theme muted)
    default:
      return "text-muted-foreground";
  }
};

// Helper component to display address
const DisplayAddress = ({ address }: { address?: Address }) => {
  if (!address) return null;
  const addressParts = [
    address.street,
    address.neighborhood,
    address.city,
    address.state,
    address.country,
    address.zipCode, // Assuming zipCode might exist
  ].filter(Boolean);
  return (
    <p className="text-sm text-muted-foreground">{addressParts.join(", ")}</p>
  );
};

export function ProjectDetailsDialog({
  project,
  children,
  onProjectUpdated,
  onProjectDeleted,
}: ProjectDetailsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false); // State for edit dialog
  const t = useTranslations("projects");

  const { userData } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    console.log("Deleting project:", project.id);

    try {
      // Deletar o documento do Firestore
      const projectRef = doc(db, "projects", project.id);
      await deleteDoc(projectRef);
      console.log("Project document deleted from Firestore");

      // Referência para a pasta do projeto no Storage
      const projectRefInStorage = ref(storage, `projects/${userData?.uid}`);

      // Listar todos os arquivos dentro da pasta (logo, cover, attachments)
      const filesSnapshot = await listAll(projectRefInStorage);

      // Deletar todos os arquivos dentro da pasta
      for (const item of filesSnapshot.items) {
        await deleteObject(item);
        console.log(`File ${item.name} deleted from Firebase Storage`);
      }

      // Mostrar a notificação de sucesso
      toast({
        title: t("projectDetails.dialog.deleteToastTitle"),
        description: `${t("projectDetails.dialog.deleteToastDescription")} "${
          project.name
        }" ${t("projectDetails.dialog.deleteToastDescription2")}`,
        variant: "destructive",
      });

      startTransition(() => {
        router.refresh(); // ou: router.replace(router.asPath)
      });

      onProjectDeleted?.(project.id);

      // Fechar os diálogos
      setIsDeleteDialogOpen(false); // Close delete confirmation
      setIsOpen(false); // Close details dialog
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: t("projectDetails.dialog.deleteErrorToastTitle"),
        description: t("projectDetails.dialog.deleteErrorToastDescription"),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 rounded-lg flex-shrink-0 border shadow-sm">
              {project.logoUrl ? (
                <AvatarImage
                  src={project.logoUrl}
                  alt={`${project.name} logo`}
                />
              ) : (
                <AvatarFallback className="text-xl font-semibold">
                  {project.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-semibold">
                {project.name}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {project.description}
              </DialogDescription>
            </div>
          </div>
          {project.coverUrl && (
            <div className="relative h-40 w-full rounded-md overflow-hidden mt-2 mb-4 bg-muted">
              <Image
                src={project.coverUrl}
                alt={`${project.name} cover`}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            {/* Status Icon + Text */}
            <span
              className={cn(
                "flex items-center gap-1.5 font-medium",
                getStatusColorClass(project.status)
              )}
            >
              <Circle className="h-2.5 w-2.5 fill-current" />
              {project.status}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />{" "}
              {t("projectDetails.dialog.startDateLabel")}{" "}
              {formatDate(project.startDate)}
            </span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">
                {t("projectDetails.dialog.sections.tags.title")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{
                      backgroundColor: tag.color,
                      color: "hsl(var(--primary-foreground))",
                    }}
                    variant="secondary"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Investment and Location */}
          <div className="grid md:grid-cols-2 gap-4">
            {project.investment !== undefined && (
              <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />{" "}
                  {t("projectDetails.dialog.sections.investment.title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(project.investment)}
                </p>
              </div>
            )}
            {project.isPhysical && project.address && (
              <div>
                <h4 className="font-semibold mb-1 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />{" "}
                  {t("projectDetails.dialog.sections.location.title")}
                </h4>
                <DisplayAddress address={project.address} />
              </div>
            )}
          </div>

          {/* Links */}
          {project.links && project.links.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />{" "}
                {t("projectDetails.dialog.sections.links.title")}
              </h4>
              <ul className="space-y-1 list-none pl-0">
                {project.links.map((link: ProjectLink) => {
                  const Icon = getLinkIcon(link.type);
                  return (
                    <li key={link.id} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate"
                        title={link.url}
                      >
                        {truncateUrl(link.url, 50)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Collaborators */}
          {project.collaborators && project.collaborators.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <Users className="w-4 h-4" />{" "}
                {t("projectDetails.dialog.sections.collaborators.title")}
              </h4>
              <div className="flex flex-wrap gap-3">
                {project.collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={collab.photoURL} alt={collab.name} />
                      <AvatarFallback className="text-xs">
                        {collab.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{collab.name}</span>
                    {project.credentials &&
                      project.credentials.length > 0 &&
                      "canViewCredentials" in collab &&
                      (collab.canViewCredentials ? (
                        <Unlock
                          className="h-3 w-3 text-green-600"
                          title={t(
                            "projectDetails.dialog.sections.collaborators.canView"
                          )}
                        />
                      ) : (
                        <Lock
                          className="h-3 w-3 text-red-600"
                          title={t(
                            "projectDetails.dialog.sections.collaborators.cannotView"
                          )}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credentials */}
          {project.credentials && project.credentials.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <Lock className="w-4 h-4" />{" "}
                {t("projectDetails.dialog.sections.credentials.title")}
              </h4>
              <div className="space-y-3">
                {project.credentials.map((cred: Credential) => (
                  <div
                    key={cred.id || cred.description}
                    className="p-3 border rounded-md bg-muted/50"
                  >
                    {" "}
                    {/* Use description as fallback key if needed */}
                    <p className="font-medium text-sm mb-1">
                      {cred.description}
                    </p>
                    {cred.url && (
                      <p className="text-xs text-muted-foreground">
                        <strong>
                          {t(
                            "projectDetails.dialog.sections.credentials.label.url"
                          )}
                        </strong>{" "}
                        <a
                          href={cred.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {cred.url}
                        </a>
                      </p>
                    )}
                    {cred.email && (
                      <p className="text-xs text-muted-foreground">
                        <strong>
                          {t(
                            "projectDetails.dialog.sections.credentials.label.email"
                          )}
                        </strong>{" "}
                        {cred.email}
                      </p>
                    )}
                    {cred.password && (
                      <p className="text-xs text-muted-foreground">
                        <strong>
                          {t(
                            "projectDetails.dialog.sections.credentials.label.password"
                          )}
                        </strong>{" "}
                        ********
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {project.attachments && project.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <FileText className="w-4 h-4" />{" "}
                {t("projectDetails.dialog.sections.attachments.title")}
              </h4>
              <div className="space-y-2">
                {project.attachments.map((attachment: any, index: number) => (
                  <div
                    key={attachment.id || index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate cursor-pointer">
                      <a href={attachment.url} target="_blank">
                        {attachment.name ||
                          `${t(
                            "projectDetails.dialog.sections.attachments.fallbackName"
                          )} ${index + 1}`}
                      </a>
                    </span>
                    {/* TODO: Add download button or link here */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Edit and Delete buttons */}
        <DialogFooter className="mt-6 pt-4 border-t sm:justify-between">
          {/* Delete Button with Confirmation */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />{" "}
                {t("projectDetails.dialog.footer.deleteButton")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("projectDetails.dialog.footer.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("projectDetails.dialog.footer.deleteConfirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("projectDetails.dialog.footer.deleteCancel")}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {t("projectDetails.dialog.footer.deleteContinue")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">
                {t("projectDetails.dialog.footer.closeButton")}
              </Button>
            </DialogClose>
            {/* Edit Button triggers AddProjectButton in edit mode */}
            <AddProjectButton projectToEdit={project} variant="default" onSaved={onProjectUpdated}>
              <Edit className="mr-2 h-4 w-4" />{" "}
              {t("projectDetails.dialog.footer.editButton")}
            </AddProjectButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
