"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCollaboratorProjects } from "@/services/project"; // Assuming a service to fetch projects SHARED WITH THE USER
import type { Project, Tag } from "@/services/project";
import { listTags } from "@/services/tag"; // Import tag service
import { Badge } from "@/components/ui/badge";
import { Eye, Circle, UserCircle, CalendarDays, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SharedProjectDetailsDialog } from "@/components/projects/shared-project-details-dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { FilterPanel } from "@/components/filters/FilterPanel"; // Import FilterPanel
import type { DateRange } from "react-day-picker"; // Import DateRange type
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";

const formatRelativeDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "-";
  }
};

const canCurrentUserViewCredentials = (project: Project): boolean => {
  // Placeholder - replace with actual logic based on current user and project.collaborators permissions
  return project.id === "1";
};

// Loading Skeleton component for shared project cards
const SharedProjectCardSkeleton = () => (
  <Card className="shadow-md rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-4 w-1/3" /> {/* Project Name */}
        <Skeleton className="h-3 w-3/4" /> {/* Description */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 pt-1">
          <Skeleton className="h-3 w-20" /> {/* Creator */}
          <Skeleton className="h-3 w-24" /> {/* Date */}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center flex-wrap justify-end">
      <Skeleton className="h-5 w-20 rounded-full" /> {/* Status Badge */}
      <div className="flex -space-x-2">
        <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
        <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" /> {/* View Button */}
    </div>
  </Card>
);

export function SharedProjectList() {
  const t = useTranslations("projects");
  // --- Helper Functions ---
  const getStatusColorClass = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case t("shared-projects.project-list.card.status.completed"):
        return "text-green-600 dark:text-green-500";
      case t("shared-projects.project-list.card.status.inProgress"):
        return "text-yellow-500 dark:text-yellow-400";
      case t("shared-projects.project-list.card.status.paused"):
        return "text-destructive";
      case t("shared-projects.project-list.card.status.pending"):
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const [allSharedProjects, setAllSharedProjects] = React.useState<Project[]>(
    []
  );
  const [filteredProjects, setFilteredProjects] = React.useState<Project[]>([]);
  const [allTags, setAllTags] = React.useState<Tag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const { userData } = useAuth();

  // Filter States
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Status options for projects
  const statusOptions = [
    t("shared-projects.project-list.card.status.pending"),
    t("shared-projects.project-list.card.status.inProgress"),
    t("shared-projects.project-list.card.status.paused"),
    t("shared-projects.project-list.card.status.completed"),
  ];

  React.useEffect(() => {
    if (!userData?.uid) return;
    const fetchSharedProjects = async () => {
      setIsLoading(true);
      try {
        const [projectsData, tagsData] = await Promise.all([
          listCollaboratorProjects(userData.uid), // Using listProjects as placeholder
          listTags(userData.uid),
        ]);
        setAllSharedProjects(projectsData);
        setFilteredProjects(projectsData);
        setAllTags(tagsData);
      } catch (error) {
        console.error("Failed to fetch shared projects or tags:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedProjects();
  }, []);

  // Filter logic (similar to ProjectList)
  React.useEffect(() => {
    let tempFiltered = [...allSharedProjects];

    // Filter by Tags
    if (selectedTags.length > 0) {
      tempFiltered = tempFiltered.filter((project) =>
        selectedTags.every((tagId) =>
          project.tags?.some((pt) => pt.id === tagId)
        )
      );
    }

    // Filter by Status
    if (selectedStatus) {
      tempFiltered = tempFiltered.filter(
        (project) => project.status === selectedStatus
      );
    }

    // Filter by Date Range (using createdAt)
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

    // Filter by Search Query (Name or Description)
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerCaseQuery) ||
          project.description?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredProjects(tempFiltered);
  }, [
    selectedTags,
    selectedStatus,
    selectedDateRange,
    searchQuery,
    allSharedProjects,
  ]);

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSelectedStatus("");
    setSelectedDateRange(undefined);
    setSearchQuery("");
  };

  return (
    <>
      {/* Page Title */}
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {t("shared-projects.project-list.pageTitle")}
      </h1>

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

      {isLoading ? (
        <div className="space-y-4 mt-6">
          {[...Array(2)].map((_, i) => (
            <SharedProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="shadow-md rounded-lg text-center p-8 mt-6">
          <CardContent className="flex flex-col items-center justify-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">
              {t("shared-projects.project-list.emptyState.title")}
            </p>
            <p className="text-muted-foreground mb-4">
              {t("shared-projects.project-list.emptyState.description")}
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              {t("shared-projects.project-list.emptyState.clearFilters")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mt-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="shadow-md rounded-lg hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="w-12 h-12 rounded-lg flex-shrink-0 border bg-background shadow-sm">
                    {project.logoUrl ? (
                      <AvatarImage
                        src={project.logoUrl}
                        alt={`${project.name} logo`}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-lg font-semibold rounded-lg">
                        {project.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-1">
                      {project.description ||
                        t("shared-projects.project-list.card.noDescription")}
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 truncate">
                        <UserCircle className="w-3 h-3 flex-shrink-0" />{" "}
                        {project.creatorName}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <CalendarDays className="w-3 h-3 flex-shrink-0" />{" "}
                        {t("shared-projects.project-list.card.createdLabel")}{" "}
                        {formatRelativeDate(project.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center flex-wrap justify-end">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs py-1 px-2.5",
                      getStatusColorClass(project.status)
                    )}
                  >
                    <Circle className="h-2 w-2 mr-1.5 fill-current" />
                    {project.status}
                  </Badge>
                  <div className="flex -space-x-2 overflow-hidden">
                    {project.collaborators?.slice(0, 2).map((collab) => (
                      <Avatar
                        key={collab.id}
                        className="h-7 w-7 border-2 border-background"
                      >
                        <AvatarImage src={collab.avatarUrl} alt={collab.name} />
                        <AvatarFallback className="text-xs">
                          {collab.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.collaborators &&
                      project.collaborators.length > 2 && (
                        <Avatar className="h-7 w-7 border-2 border-background">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            +{project.collaborators.length - 2}
                          </AvatarFallback>
                        </Avatar>
                      )}
                  </div>
                  <SharedProjectDetailsDialog
                    project={project}
                    canViewCredentials={canCurrentUserViewCredentials(project)}
                  >
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Eye className="mr-1 h-4 w-4" />{" "}
                      {t("shared-projects.project-list.card.viewDetails")}
                    </Button>
                  </SharedProjectDetailsDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
