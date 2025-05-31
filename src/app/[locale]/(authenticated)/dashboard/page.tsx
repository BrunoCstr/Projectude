"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  FolderKanban,
  Users,
  FolderSearch,
  DollarSign,
  Bell,
  AlertTriangle,
  CalendarCheck2,
  Info,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils"; // Import cn for conditional classes
import type { Collaborator } from "@/services/collaborator"; // Import Collaborator type
import { mockCollaborators } from "@/services/collaborator";
import { useTranslations } from "next-intl"; // Import mock collaborators // Import Firebase auth
import {
  countUserProjects,
  countSharedProjects,
  countUserCollaborators,
  getProjectsByMonth,
  getProjectStatusDistribution,
  getCollaboratorsPerProject,
  listUserCollaborators,
  getTotalInvestment,
  getTotalInvestmentOfTheYear,
} from "@/services/dashboard";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { parseInvestment } from "@/utils/parseInvestment";

export default function DashboardPage() {
  const { userData } = useAuth();
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalCollaboratorsCount, setTotalCollaboratorsCount] = useState(0);
  const [sharedProjects, setSharedProjects] = useState(0);
  const [projectsByMonth, setProjectsByMonth] = useState<
    { month: string; projects: number }[]
  >([]);
  const [projectStatusDistribution, setProjectStatusDistribution] = useState<
    { status: string; count: number; fill: string }[]
  >([]);
  const [collaboratorsPerProject, setCollaboratorsPerProject] = useState<
    { project: string; collaborators: number; collaboratorNames: any }[]
  >([]);
  const [myCollaborators, setMyCollaborators] = useState<any[]>([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalInvesmentOfYear, setTotalInvestmentOfYear] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCollab() {
      if (!userData?.uid) {
        return;
      }

      try {
        const collabs = await listUserCollaborators(userData.uid);

        setMyCollaborators(collabs);
      } catch (error) {
        console.error("Erro ao buscar os colaboradores", error);
      }
    }

    fetchCollab();
  }, [userData?.uid]);

  useEffect(() => {
    async function fetchData() {
      if (!userData?.uid) {
        return;
      }

      try {
        const _totalInvestment = await getTotalInvestment(userData.uid);
        setTotalInvestment(_totalInvestment);

        const _totalInvesmentOfYear = await getTotalInvestmentOfTheYear(
          userData.uid
        );
        setTotalInvestmentOfYear(_totalInvesmentOfYear);

        const total = await countUserProjects(userData?.uid);
        setTotalProjects(total);

        const countShared = await countSharedProjects(userData?.uid);
        setSharedProjects(countShared);

        const allCollab = await countUserCollaborators(userData?.uid);
        setTotalCollaboratorsCount(allCollab);

        const projectsMonth = await getProjectsByMonth(userData?.uid);
        setProjectsByMonth(projectsMonth);

        const projectDistribution = await getProjectStatusDistribution(
          userData?.uid
        );
        const formattedDistribution = Object.entries(projectDistribution).map(
          ([status, count], i) => ({
            status,
            count,
            fill: `hsl(var(--chart-${i + 1}))`,
          })
        );
        setProjectStatusDistribution(formattedDistribution);

        const getCollabPerProject = await getCollaboratorsPerProject(
          userData.uid
        );
        setCollaboratorsPerProject(getCollabPerProject);
      } catch (error) {
        console.error("Erro ao buscar os dados", error);
      }
    }

    fetchData();
  }, [userData?.uid]);

  console.log(
    'Total de investimento', totalInvestment,
    'total investimento ao longo do ano', totalInvesmentOfYear
  );

  // TODO: Fetch real data
  // const totalProjects = 15;
  // const totalCollaboratorsCount = 8;
  // const sharedProjects = 3;
  const lastProjectUpdate = "2025-06-04"; // Example date
  const newPlatformUpdate = true; // Example flag
  const newInvitation = true; // Example flag
  const paymentIssue = false; // Example flag

  // Helper function to get collaborator details by ID
  const getCollaboratorDetails = (ids: string[]) => {
    return ids
      .map((id) => {
        const collab = myCollaborators.find((c) => c.id === id);
        return collab
          ? { id: collab.id, name: collab.name, avatarUrl: collab.photoURL }
          : null;
      })
      .filter(Boolean); // Remove nulls if a collaborator wasn't found
  };

  // Mock Chart Data (to be passed to the client component)
  const projectsByPeriodChartData = [
    { month: "Jan", projects: projectsByMonth[0] },
    { month: "Fev", projects: projectsByMonth[1] },
    { month: "Mar", projects: projectsByMonth[2] },
    { month: "Abr", projects: projectsByMonth[3] },
    { month: "Mai", projects: projectsByMonth[4] },
    { month: "Jun", projects: projectsByMonth[5] },
    { month: "Jul", projects: projectsByMonth[6] },
    { month: "Ago", projects: projectsByMonth[7] },
    { month: "Set", projects: projectsByMonth[8] },
    { month: "Out", projects: projectsByMonth[9] },
    { month: "Nov", projects: projectsByMonth[10] },
    { month: "Dez", projects: projectsByMonth[11] },
  ];

  const projectStatusChartData =
    projectStatusDistribution.length === 4
      ? projectStatusDistribution.map((item, index) => ({
          status: item.status,
          count: item.count,
          fill: `hsl(var(--chart-${index + 1}))`,
        }))
      : [];

  // Updated collaboratorsPerProjectChartData with collaboratorDetails
  const collaboratorsPerProjectChartData = collaboratorsPerProject.map(
    (item) => ({
      project: item.project,
      collaborators: item.collaborators,
      collaboratorDetails: item.collaboratorNames.map((name: any) => ({
        name,
        avatarUrl: null,
        id: name.toLowerCase().replace(/\s/g, "-"),
      })),
    })
  );

  const investmentGrowthChartData = [
    { month: "Jan", investment: totalInvesmentOfYear[0] },
    { month: "Fev", investment: totalInvesmentOfYear[1] },
    { month: "Mar", investment: totalInvesmentOfYear[2] },
    { month: "Abr", investment: totalInvesmentOfYear[3] },
    { month: "Mai", investment: totalInvesmentOfYear[4] },
    { month: "Jun", investment: totalInvesmentOfYear[5] },
    { month: "Jul", investment: totalInvesmentOfYear[6] },
    { month: "Ago", investment: totalInvesmentOfYear[7] },
    { month: "Set", investment: totalInvesmentOfYear[8] },
    { month: "Out", investment: totalInvesmentOfYear[9] },
    { month: "Nov", investment: totalInvesmentOfYear[10] },
    { month: "Dez", investment: totalInvesmentOfYear[11] },
  ];

  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/20 flex-shrink-0">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground mb-1 truncate">
              {t("cards.totalInvestment.header")}
            </CardTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold truncate">
                ${totalInvestment.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("cards.totalInvestment.description")}
            </p>
          </div>
        </Card>

        <Card className="shadow-md rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-accent/20 flex-shrink-0">
            <FolderKanban className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground mb-1 truncate">
              {t("cards.totalProjects.header")}
            </CardTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold truncate">
                {totalProjects}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("cards.totalProjects.description")}
            </p>
          </div>
        </Card>

        <Card className="shadow-md rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/20 flex-shrink-0">
            <FolderSearch className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground mb-1 truncate">
              {t("cards.sharedProjects.header")}
            </CardTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold truncate">
                {sharedProjects}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("cards.sharedProjects.description")}
            </p>
          </div>
        </Card>

        <Card className="shadow-md rounded-lg p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-purple-500/20 flex-shrink-0">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground mb-1 truncate">
              {t("cards.totalCollaborators.header")}
            </CardTitle>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold truncate">
                {totalCollaboratorsCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {t("cards.totalCollaborators.description")}
            </p>
          </div>
        </Card>
      </section>

      <DashboardCharts
        projectsByPeriodData={projectsByPeriodChartData}
        projectStatusData={projectStatusChartData}
        collaboratorsPerProjectData={collaboratorsPerProjectChartData}
        investmentGrowthData={investmentGrowthChartData}
      />

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {t("updatesSection.title")}
        </h2>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {newPlatformUpdate && (
            <Card className="shadow-sm rounded-lg p-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {t("updatesSection.newPlatformUpdate.title")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("updatesSection.newPlatformUpdate.description")}
                </p>
              </div>
            </Card>
          )}

          {newInvitation && (
            <Card className="shadow-sm rounded-lg p-3 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {t("updatesSection.newInvitation.title")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("updatesSection.newInvitation.description")}
                </p>
              </div>
            </Card>
          )}

          <Card className="shadow-sm rounded-lg p-3 flex items-center gap-3">
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {t("updatesSection.lastProjectActivity.title")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("updatesSection.lastProjectActivity.description", {
                  lastProjectUpdate,
                })}
              </p>
            </div>
          </Card>

          {paymentIssue && (
            <Card className="shadow-sm rounded-lg p-3 flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {t("updatesSection.paymentIssue.title")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {t("updatesSection.paymentIssue.description")}
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
