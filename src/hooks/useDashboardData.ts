'use client'

import { useState, useEffect } from "react";
import { getDocs, collection, getCountFromServer,collectionGroup } from "firebase/firestore";
import { getInitializedFirestore } from "@/lib/firebase";

export function useDashboardData(uid: string | undefined) {
  const db = getInitializedFirestore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalProjects: 0,
    sharedProjects: 0,
    totalCollaboratorsCount: 0,
    projectsByPeriodChartData: [] as { month: string, projects: number }[],
    projectStatusChartData: [] as { status: string, count: number, fill: string }[],
    collaboratorsPerProjectChartData: [] as { project: string, collaborators: number }[],
  });

  useEffect(() => {
    if (!uid) return;
    async function load() {
      const months = Array(12).fill(0);
      const statusMap: Record<string, number> = { "Em andamento": 0, "Pendente": 0, "Pausado": 0, "Concluído": 0 };
      const collaboratorsPerProject: { project: string, collaborators: number }[] = [];

      const projectsSnapshot = await getDocs(collection(db, "projects"));
      let shared = 0;
      let created = 0;

      projectsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.creatorUID === uid) created++;
        if ((data.collaborators || []).some((c: any) => c.id === uid)) shared++;
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt.getFullYear() === new Date().getFullYear()) {
          months[createdAt.getMonth()]++;
        }
        if (data.status && statusMap.hasOwnProperty(data.status)) {
          statusMap[data.status]++;
        }
        collaboratorsPerProject.push({
          project: data.name || "Sem nome",
          collaborators: (data.collaborators || []).length,
        });
      });

      const collaboratorsSnapshot = await getCountFromServer(collectionGroup(db, "collaborators"));

      setData({
        totalProjects: created,
        sharedProjects: shared,
        totalCollaboratorsCount: collaboratorsSnapshot.data().count,
        projectsByPeriodChartData: months.map((count, idx) => ({ month: new Date(0, idx).toLocaleString('default', { month: 'short' }), projects: count })),
        projectStatusChartData: Object.entries(statusMap).map(([status, count], i) => ({
          status,
          count,
          fill: `hsl(var(--chart-${i + 1}))`
        })),
        collaboratorsPerProjectChartData: collaboratorsPerProject,
      });

      setLoading(false);
    }
    load();
  }, [uid]);

  return { loading, ...data };
}
