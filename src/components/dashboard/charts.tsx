"use client"; // Mark this component as a Client Component

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  Pie,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  PieChart,
  LineChart,
  AreaChart,
} from "recharts"; // Added Line, Area, CartesianGrid, XAxis, YAxis, LineChart, AreaChart
import type { ChartConfig } from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Define collaborator details type for chart data
interface CollaboratorDetail {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Define chart data structures with collaborator details
interface CollaboratorsPerProjectData {
  project: string;
  collaborators: number;
  collaboratorDetails?: CollaboratorDetail[]; // Array of collaborator details
}

// Define props for the component
interface DashboardChartsProps {
  projectsByPeriodData: any[]; // Define more specific types if possible
  projectStatusData: any[]; // Define more specific types if possible
  collaboratorsPerProjectData: CollaboratorsPerProjectData[]; // Use the updated type
  investmentGrowthData: any[]; // Added prop
}

// Define chart configuration within the client component
const chartConfig = {
  projects: {
    label: "Projects",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "Count",
  },
  collaborators: {
    label: "Collaborators",
    color: "hsl(var(--chart-3))", // Use a different color
  },
  investment: {
    label: "Investment",
    color: "hsl(var(--chart-2))", // Use another different color
  },
} satisfies ChartConfig;

// Custom Tooltip Content for Collaborators Chart
const CollaboratorTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CollaboratorsPerProjectData;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-[auto_1fr] gap-1 items-center">
          <p className="text-sm font-medium text-foreground col-span-2 pb-1 border-b mb-1">
            {data.project}
          </p>
          <p className="text-xs text-muted-foreground">Collaborators:</p>
          <p className="text-xs font-medium text-right">{data.collaborators}</p>
          {/* Display Avatars */}
          {data.collaboratorDetails && data.collaboratorDetails.length > 0 && (
            <div className="col-span-2 pt-1 mt-1 border-t">
              <p className="text-xs text-muted-foreground mb-1">Assigned:</p>
              <div className="flex -space-x-1 overflow-hidden">
                {data.collaboratorDetails.slice(0, 4).map(
                  (
                    collab // Limit avatars shown
                  ) => (
                    <Avatar
                      key={collab.id}
                      className="h-5 w-5 border border-background"
                    >
                      <AvatarImage src={collab.avatarUrl} alt={collab.name} />
                      <AvatarFallback className="text-[0.6rem]">
                        {collab.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )
                )}
                {data.collaboratorDetails.length > 4 && (
                  <Avatar className="h-5 w-5 border border-background">
                    <AvatarFallback className="text-[0.6rem] bg-muted text-muted-foreground">
                      +{data.collaboratorDetails.length - 4}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export function DashboardCharts({
  projectsByPeriodData,
  projectStatusData,
  collaboratorsPerProjectData,
  investmentGrowthData,
}: DashboardChartsProps) {
  const t = useTranslations("dashboard");

  return (
    // Adjusted grid columns for responsiveness
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Projects Created Chart */}
      <Card className="shadow-md rounded-lg md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("charts.projectsCreated.title")}</CardTitle>
          <CardDescription>
            {t("charts.projectsCreated.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectsByPeriodData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <YAxis hide />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Bar
                  dataKey="projects"
                  fill="var(--color-projects)"
                  radius={4}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      {/* Status Distribution Chart */}
      <Card className="shadow-md rounded-lg md:col-span-1 lg:col-span-1">
        <CardHeader>
          <CardTitle>{t("charts.statusDistribution.title")}</CardTitle>
          <CardDescription>
            {t("charts.statusDistribution.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="w-full h-full aspect-square"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  dataKey="count"
                  nameKey="status"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="status" />}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      {/* Collaborators per Project Chart - Updated Tooltip */}
      <Card className="shadow-md rounded-lg md:col-span-1 lg:col-span-1">
        <CardHeader>
          <CardTitle>{t("charts.collaboratorsPerProject.title")}</CardTitle>
          <CardDescription>
            {t("charts.collaboratorsPerProject.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={collaboratorsPerProjectData}
                layout="vertical"
                margin={{ left: 0, right: 10, top: 5, bottom: 0 }}
              >
                <YAxis
                  dataKey="project"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80}
                />
                <XAxis dataKey="collaborators" type="number" hide />
                <CartesianGrid horizontal={false} vertical />
                <Bar
                  dataKey="collaborators"
                  fill="var(--color-collaborators)"
                  radius={4}
                />
                {/* Use Custom Tooltip */}
                <ChartTooltip
                  cursor={false}
                  content={<CollaboratorTooltipContent />}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      {/* Investment Growth Chart */}
      <Card className="shadow-md rounded-lg md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t("charts.investmentGrowth.title")}</CardTitle>
          <CardDescription>
            {t("charts.investmentGrowth.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={investmentGrowthData}
                margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <CartesianGrid vertical={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="investment"
                  type="natural"
                  fill="var(--color-investment)"
                  fillOpacity={0.4}
                  stroke="var(--color-investment)"
                  stackId="a"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}
