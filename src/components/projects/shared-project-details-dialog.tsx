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
  Circle,
  Info,
} from "lucide-react"; // Added Info icon
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";

interface SharedProjectDetailsDialogProps {
  project: Project;
  children: React.ReactNode; // To use as DialogTrigger
  canViewCredentials?: boolean; // Flag indicating if the *current* user can view credentials
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

export function SharedProjectDetailsDialog({
  project,
  children,
  canViewCredentials = false,
}: SharedProjectDetailsDialogProps) {
  const t = useTranslations("projects");

  // Function to get the Tailwind color class based on status (reuse from page)
  const getStatusColorClass = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case t("shared-projects.sharedProjectDetails.status.pending"):
        return "text-green-600 dark:text-green-500"; // Green
      case t("shared-projects.sharedProjectDetails.status.inProgress"):
        return "text-yellow-500 dark:text-yellow-400"; // Yellow
      case t("shared-projects.sharedProjectDetails.status.paused"):
        return "text-destructive"; // Red (uses theme destructive)
      case t("shared-projects.sharedProjectDetails.status.completed"):
        return "text-muted-foreground"; // Gray (uses theme muted)
      default:
        return "text-muted-foreground";
    }
  };

  const [isOpen, setIsOpen] = React.useState(false);

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
              {t("shared-projects.sharedProjectDetails.startDateLabel")}{" "}
              {formatDate(project.startDate)}
            </span>
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-4">
          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">
                {t("shared-projects.sharedProjectDetails.sections.tags.title")}
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
                  {t("shared-projects.sections.investment.title")}{" "}
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
                  {t(
                    "shared-projects.sharedProjectDetails.sections.location.title"
                  )}
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
                {t("shared-projects.sharedProjectDetails.sections.links.title")}
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
                {t(
                  "shared-projects.sharedProjectDetails.sections.collaborators.title"
                )}{" "}
              </h4>
              <div className="flex flex-wrap gap-3">
                {project.collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={collab.avatarUrl} alt={collab.name} />
                      <AvatarFallback className="text-xs">
                        {collab.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{collab.name}</span>
                    {/* Optionally show shared credential visibility status - removed icon here */}
                    {/* {project.credentials && project.credentials.length > 0 && 'canViewCredentials' in collab && (
                                  collab.canViewCredentials ?
                                  <Unlock className="h-3 w-3 text-green-600" title="Can view credentials"/> :
                                  <Lock className="h-3 w-3 text-red-600" title="Cannot view credentials"/>
                               )} */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credentials - Conditionally Rendered */}
          {project.credentials && project.credentials.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <Lock className="w-4 h-4" />{" "}
                {t(
                  "shared-projects.sharedProjectDetails.sections.credentials.title"
                )}{" "}
              </h4>
              {canViewCredentials ? (
                <div className="space-y-3">
                  {project.credentials.map((cred: Credential) => (
                    <div
                      key={cred.id || cred.description}
                      className="p-3 border rounded-md bg-muted/50"
                    >
                      <p className="font-medium text-sm mb-1">
                        {cred.description}
                      </p>
                      {cred.url && (
                        <p className="text-xs text-muted-foreground">
                          <strong>
                            {t(
                              "shared-projects.sharedProjectDetails.sections.credentials.label.url"
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
                              "shared-projects.sharedProjectDetails.sections.credentials.label.email"
                            )}
                          </strong>{" "}
                          {cred.email}
                        </p>
                      )}
                      {cred.password && (
                        <p className="text-xs text-muted-foreground">
                          <strong>
                            {t(
                              "shared-projects.sharedProjectDetails.sections.credentials.label.password"
                            )}
                          </strong>{" "}
                          ********
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert
                  variant="default"
                  className="border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/30"
                >
                  <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertTitle className="text-orange-700 dark:text-orange-300">
                    {t(
                      "shared-projects.sharedProjectDetails.sections.credentials.noPermission.title"
                    )}
                  </AlertTitle>
                  <AlertDescription className="text-orange-600 dark:text-orange-400">
                    {t(
                      "shared-projects.sharedProjectDetails.sections.credentials.noPermission.description"
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Attachments */}
          {project.attachments && project.attachments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-sm flex items-center gap-1">
                <FileText className="w-4 h-4" />{" "}
                {t(
                  "shared-projects.sharedProjectDetails.sections.attachments.title"
                )}{" "}
              </h4>
              <div className="space-y-2">
                {project.attachments.map((attachment: any, index: number) => (
                  <div
                    key={attachment.id || index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 text-sm"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <a
                      href={attachment.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      <span className="truncate">
                        {attachment.name ||
                          `${t(
                            "shared-projects.sharedProjectDetails.sections.attachments.fallback"
                          )} ${index + 1}`}
                      </span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Close button only */}
        <DialogFooter className="mt-6 pt-4 border-t sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline">
              {t("shared-projects.sharedProjectDetails.footer.closeButton")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
