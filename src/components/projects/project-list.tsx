"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/services/project"; // Added createProject and updateProject
import type { Project, ProjectLink, Tag } from "@/services/project";
import { listTags } from "@/services/tag";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PlusCircle,
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  Link2,
  Globe,
  Facebook,
  Twitter,
  Github,
  Circle,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { AddProjectButton } from "@/components/projects/add-project-button";
import { ProjectDetailsDialog } from "@/components/projects/project-details-dialog";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPanel } from "@/components/filters/FilterPanel";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

// Helper functions
const getStatusColorClass = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case "concluído":
      return "text-green-600 dark:text-green-500";
    case "em andamento":
      return "text-yellow-500 dark:text-yellow-400";
    case "pausado":
      return "text-destructive";
    case "pendente":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// const formatDate = (dateString?: string) => {
//   if (!dateString) return "-";
//   try {
//     const date = new Date(dateString);
//     if (isNaN(date.getTime())) return "-";
//     return date.toLocaleDateString("pt-BR");
//   } catch (error) {
//     console.error("Error formatting date:", error);
//     return "-";
//   }
// };

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
      return Link2;
  }
};

const truncateUrl = (url: string, maxLength = 30): string => {
  let displayUrl = url.replace(/^https?:\/\//, "");
  displayUrl = displayUrl.replace(/^www\./, "");
  if (displayUrl.length > maxLength) {
    return displayUrl.substring(0, maxLength - 3) + "...";
  }
  return displayUrl;
};

// Loading Skeleton component
const ProjectCardSkeleton = () => (
  <Card className="shadow-md rounded-lg overflow-hidden flex flex-col">
    <Skeleton className="h-32 w-full" />
    <div className="relative p-4 flex-grow flex flex-col">
      <Skeleton className="absolute left-4 top-[-2rem] w-16 h-16 rounded-full border-4 border-background shadow-lg bg-background z-10" />
      <div className="pt-8 flex-grow flex flex-col gap-3">
        <CardHeader className="p-0 space-y-1">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </CardHeader>
        <CardContent className="p-0 space-y-3 flex-grow">
          <div className="flex items-center justify-start gap-4 text-xs">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </div>
    </div>
    <CardFooter className="p-3 border-t border-border bg-muted/30 flex items-center justify-between h-12">
      <div className="flex -space-x-2 overflow-hidden">
        <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
        <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
      </div>
      <Skeleton className="h-8 w-24" />
    </CardFooter>
  </Card>
);

export function ProjectList() {
  const [projects, setProjects] = React.useState<Project[]>([]); // Changed from allProjects to projects
  const [filteredProjects, setFilteredProjects] = React.useState<Project[]>([]);
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const router = useRouter();
  const { userData } = useAuth();
  const t = useTranslations("projects");

  console.log(projects);

  // Filter States
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const statusOptions = [
    t("projects-list.statusOptions.pending"),
    t("projects-list.statusOptions.inProgress"),
    t("projects-list.statusOptions.paused"),
    t("projects-list.statusOptions.completed"),
  ];

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectsData, tagsData] = await Promise.all([
          listProjects(userData!.uid),
          listTags(userData!.uid),
        ]);
        setProjects(projectsData); // Set main projects state
        setFilteredProjects(projectsData);
        setAllTags(tagsData);
      } catch (error) {
        console.error("Failed to fetch projects or tags:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  React.useEffect(() => {
    let tempFiltered = [...projects]; // Filter from the main projects state

    if (selectedTags.length > 0) {
      tempFiltered = tempFiltered.filter((project) =>
        selectedTags.every((tagId) =>
          project.tags?.some((pt) => pt.id === tagId)
        )
      );
    }

    if (selectedStatus && selectedStatus !== "all") {
      tempFiltered = tempFiltered.filter(
        (project) => project.status === selectedStatus
      );
    }

    if (selectedDateRange?.from && selectedDateRange?.to) {
      const fromDate = selectedDateRange.from;
      const toDate = selectedDateRange.to;
      toDate.setHours(23, 59, 59, 999);
      tempFiltered = tempFiltered.filter((project) => {
        const projectDate = new Date(project.createdAt);
        return projectDate >= fromDate && projectDate <= toDate;
      });
    } else if (selectedDateRange?.from) {
      const fromDate = selectedDateRange.from;
      tempFiltered = tempFiltered.filter(
        (project) => new Date(project.createdAt) >= fromDate
      );
    } else if (selectedDateRange?.to) {
      const toDate = selectedDateRange.to;
      toDate.setHours(23, 59, 59, 999);
      tempFiltered = tempFiltered.filter(
        (project) => new Date(project.createdAt) <= toDate
      );
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerCaseQuery) ||
          project.description?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredProjects(tempFiltered);
  }, [selectedTags, selectedStatus, selectedDateRange, searchQuery, projects]); // Depend on projects state

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prevProjects) => {
      // Check if it's an update or a new project
      const existingIndex = prevProjects.findIndex(
        (p) => p.id === newProject.id
      );
      if (existingIndex > -1) {
        // Update existing project
        const updatedProjects = [...prevProjects];
        updatedProjects[existingIndex] = newProject;
        return updatedProjects;
      } else {
        // Add new project to the beginning
        // Ensure a unique ID (if mock service doesn't assign one reliably)
        const projectWithId = {
          ...newProject,
          id:
            newProject.id ||
            `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        return [projectWithId, ...prevProjects];
      }
    });
    // Filtering will be re-applied due to the useEffect dependency on `projects`
  };

  const handleProjectDeleted = (deletedProjectId: string) => {
    setProjects((prevProjects) =>
      prevProjects.filter((p) => p.id !== deletedProjectId)
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedStatus("");
    setSelectedDateRange(undefined);
    setSearchQuery("");
  };

  return (
    <>
      {/* Header section with Title, Add Button, and Filter Panel */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("projects-list.pageTitle")}
          </h1>
          {userData?.currentPlan === "Premium" ? (
            <AddProjectButton onProjectCreated={handleProjectCreated} />
          ) : (
            <div className="flex items-center gap-2 bg-muted border border-border text-muted-foreground px-4 py-2 rounded-md text-sm">
              Você está no plano gratuito.
              <Button
                variant="default"
                onClick={() => router.push("/settings")}
              >
                Fazer upgrade
              </Button>
            </div>
          )}
        </div>
        {/* Filter Panel */}
        <FilterPanel
          tags={allTags}
          statusOptions={statusOptions}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedDateRange={selectedDateRange}
          onDateChange={setSelectedDateRange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Project Grid or Loading/Empty State */}
      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="shadow-md rounded-lg text-center p-8 bg-card mt-6">
          <CardContent className="flex flex-col items-center justify-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {t("projects-list.emptyState.title")}
            </p>
            <p className="text-muted-foreground mb-4">
              {t("projects-list.emptyState.description")}
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              {t("projects-list.emptyState.clearFilters")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col bg-card text-card-foreground"
            >
              {/* Cover Image Placeholder */}
              <div className="relative h-32 w-full bg-muted flex items-center justify-center overflow-hidden">
                {project.coverUrl ? (
                  <Image
                    src={project.coverUrl}
                    alt={`${project.name} cover`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {t("projects-list.cover")}
                  </span>
                )}
              </div>
              {/* Content Area */}
              <div className="relative p-4 pt-10 flex-grow flex flex-col">
                {/* Logo */}
                <Avatar className="absolute left-4 top-[-2rem] w-16 h-16 rounded-full flex-shrink-0 border-4 border-background shadow-lg bg-background z-10">
                  {project.logoUrl ? (
                    <AvatarImage
                      src={project.logoUrl}
                      alt={`${project.name} logo`}
                      className="object-contain p-1"
                    />
                  ) : (
                    <AvatarFallback className="text-2xl font-semibold rounded-full">
                      {project.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* Main Content */}
                <div className="flex-grow flex flex-col gap-3">
                  <CardHeader className="p-0 space-y-1">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                      {project.description ||
                        t("projects-list.card.noDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-2 flex-grow text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span
                        className={cn(
                          "flex items-center gap-1 font-medium text-xs",
                          getStatusColorClass(project.status)
                        )}
                      >
                        <Circle className="h-2 w-2 fill-current" />
                        {project.status}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {t("projects-list.card.startDateLabel")}{" "}
                        {formatDate(project.startDate)}
                      </span>
                    </div>
                    {project.investment !== undefined && (
                      <div className="text-xs flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formatCurrency(project.investment)}
                        </span>
                      </div>
                    )}
                    {project.isPhysical && project.address && (
                      <div className="text-xs flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {project.address.city}, {project.address.state}
                        </span>
                      </div>
                    )}
                    {project.links && project.links.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {project.links.slice(0, 2).map((link: ProjectLink) => {
                          const Icon = getLinkIcon(link.type);
                          return (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 truncate"
                              title={link.url}
                            >
                              <Icon className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                              <span className="truncate">
                                {truncateUrl(link.url, 25)}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </div>
              </div>
              {/* Footer */}
              <CardFooter className="p-3 border-t border-border bg-muted/30 flex items-center justify-between h-12">
                <div className="flex -space-x-2 overflow-hidden">
                  {project.collaborators?.slice(0, 3).map((collab) => (
                    <Avatar
                      key={collab.id}
                      className="h-6 w-6 border-2 border-background"
                    >
                      <AvatarImage src={collab.photoURL} alt={collab.name} />
                      <AvatarFallback className="text-xs">
                        {collab.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.collaborators &&
                    project.collaborators.length > 3 && (
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          +{project.collaborators.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  {(!project.collaborators ||
                    project.collaborators.length === 0) && (
                    <p className="text-xs text-muted-foreground"></p> // Removed placeholder content
                  )}
                </div>
                <ProjectDetailsDialog
                  project={project}
                  onProjectUpdated={handleProjectCreated} // já atualiza a lista
                  onProjectDeleted={handleProjectDeleted}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />{" "}
                    {t("projects-list.card.viewDetails")}
                  </Button>
                </ProjectDetailsDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
