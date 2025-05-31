'use client'

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAllNotifications, groupNotificationsByMonth } from "@/services/notification";
import { NotificationsList } from "./notifications-list";
import { parse } from "date-fns";
import { ptBR } from "date-fns/locale";

const parseMonthYear = (monthYear: string): Date => {
  try {
    return parse(monthYear, 'MMMM yyyy', new Date(), { locale: ptBR });
  } catch {
    return new Date(0);
  }
};

export function NotificationsClientWrapper() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    if (!userData?.uid) return;

    const fetchData = async () => {
      const data = await getAllNotifications(userData.uid);
      const groupedData = groupNotificationsByMonth(data);
      const monthList = Object.keys(groupedData).sort((a, b) => {
        return parseMonthYear(b).getTime() - parseMonthYear(a).getTime();
      });

      setNotifications(data);
      setGrouped(groupedData);
      setMonths(monthList);
      setLoading(false);
    };

    fetchData();
  }, [userData]);

  if (!userData) {
    return <div>Você precisa estar logado para ver as notificações.</div>;
  }

  if (loading) {
    return <div>Carregando notificações...</div>;
  }

  return (
    <NotificationsList
      initialNotifications={notifications}
      initialGroupedNotifications={grouped}
      initialMonths={months}
    />
  );
}
