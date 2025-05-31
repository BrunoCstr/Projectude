"use client";

import * as React from "react";
import { useState } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Remove Tabs imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BellRing,
  Circle,
  CheckCheck,
  UserPlus,
  FileEdit,
  MessageSquare,
  AlertTriangle,
  type LucideIcon,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"; // Added ChevronLeft, ChevronRight
import type { Notification, NotificationType } from "@/services/notification"; // Import NotificationType
import { capitalizeFirstLetter } from "@/services/notification"; // Import helper
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns"; // Import format
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

// Helper to format date relative to now
const formatRelativeDate = (dateString?: string | Date) => {
  if (!dateString) return "-";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "-";
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "-";
  }
};

interface NotificationsListProps {
  initialNotifications: Notification[];
  initialGroupedNotifications: Record<string, Notification[]>;
  initialMonths: string[]; // Expects sorted months (latest first)
}

export function NotificationsList({
  initialNotifications,
  initialGroupedNotifications,
  initialMonths,
}: NotificationsListProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [groupedNotifications, setGroupedNotifications] = useState(
    initialGroupedNotifications
  );
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0); // Start with the latest month (index 0)
  const months = initialMonths; // Use the sorted months passed as props
  const { toast } = useToast();
  const t = useTranslations("notifications");

  // Helper function to get the appropriate icon based on notification type
  const getNotificationIcon = (type: NotificationType): LucideIcon => {
    switch (type) {
      case t("types.invite"):
        return UserPlus;
      case t("types.project_update"):
        return FileEdit;
      case t("types.comment_new"):
      case t("types.comment_reply"):
      case t("types.comment_status"):
        return MessageSquare;
      case t("types.system_alert"):
        return AlertTriangle;
      case t("types.other"):
      default:
        return Bell;
    }
  };

  const currentMonth = months[currentMonthIndex];
  const currentMonthNotifications = groupedNotifications[currentMonth] || [];

  const handleMarkAllRead = () => {
    const allRead = notifications.every((n) => n.read);

    if (allRead) {
      toast({
        title: t("markAllRead.toastAllReadTitle"),
        description: t("markAllRead.toastAllReadDescription"),
      });
      return;
    }

    // Update local state to mark all as read
    const updatedNotifications = notifications.map((n) => ({
      ...n,
      read: true,
    }));
    setNotifications(updatedNotifications);

    // Re-group notifications after marking as read
    const updatedGrouped: Record<string, Notification[]> = {};
    updatedNotifications.forEach((notification) => {
      const monthYear = format(new Date(notification.timestamp), "MMMM yyyy", {
        locale: ptBR,
      });
      if (!updatedGrouped[monthYear]) {
        updatedGrouped[monthYear] = [];
      }
      updatedGrouped[monthYear].push(notification);
    });
    setGroupedNotifications(updatedGrouped);

    // TODO: Implement API call to mark notifications as read on the server
    console.log("Marking all notifications as read (client-side simulation)");
    toast({
      title: t("markAllRead.toastSuccessTitle"),
      description: t("markAllRead.toastSuccessDescription"),
    });
  };

  // Go to OLDER month (increase index as months are sorted newest to oldest)
  const handlePreviousMonth = () => {
    setCurrentMonthIndex((prevIndex) =>
      Math.min(months.length - 1, prevIndex + 1)
    );
  };

  // Go to NEWER month (decrease index)
  const handleNextMonth = () => {
    setCurrentMonthIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };

  return (
    <>
      {/* Mark all read Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleMarkAllRead}
          disabled={
            notifications.length === 0 || notifications.every((n) => n.read)
          }
        >
          <CheckCheck className="mr-2 h-4 w-4" /> {t("markAllRead.button")}
        </Button>
      </div>

      {months.length === 0 ? (
        <Card className="shadow-md rounded-lg text-center p-8">
          <CardContent>
            <p className="text-muted-foreground">{t("emptyState.title")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth} // Left arrow -> Older month
              disabled={currentMonthIndex === months.length - 1} // Disable when at the oldest month
              aria-label={t("monthNavigation.previous")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-lg font-medium w-48 text-center">
              {capitalizeFirstLetter(currentMonth)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth} // Right arrow -> Newer month
              disabled={currentMonthIndex === 0} // Disable when at the newest month
              aria-label={t("monthNavigation.next")}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Notifications List for the Current Month */}
          <Card className="shadow-md rounded-lg">
            {/* CardHeader might not be needed if month is shown above */}
            {/* <CardHeader>
                           <CardTitle>{capitalizeFirstLetter(currentMonth)}</CardTitle>
                        </CardHeader> */}
            <CardContent className="space-y-4 p-4">
              {currentMonthNotifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("notificationsList.empty")}
                </p>
              ) : (
                currentMonthNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg p-3 transition-colors border hover:bg-muted/50",
                        !notification.read && "border-primary/30 bg-primary/5" // Style for unread
                      )}
                    >
                      {/* Icon & Unread Indicator */}
                      <div className="flex flex-col items-center pt-0.5">
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {!notification.read ? (
                          <Circle className="h-2.5 w-2.5 mt-1.5 flex-shrink-0 fill-primary text-primary" />
                        ) : (
                          <Circle className="h-2.5 w-2.5 mt-1.5 flex-shrink-0 fill-muted text-muted" /> // Placeholder for read
                        )}
                      </div>
                      {/* Notification Content */}
                      <div className={cn("flex-1 space-y-1")}>
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            !notification.read && "font-medium"
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
