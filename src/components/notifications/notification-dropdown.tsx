"use client";

import * as React from "react";
import {
  Bell,
  Circle,
  UserPlus,
  FileEdit,
  MessageSquare,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"; // Added icons
import { Button, buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markAllNotificationsAsRead,
  type Notification,
  type NotificationType,
} from "@/services/notification"; // Import NotificationType
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

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

export function NotificationDropdown() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasUnread, setHasUnread] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations("notifications");
  const { userData } = useAuth();

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

  React.useEffect(() => {
    async function fetchNotifications() {
      if (!userData) {
        return;
      }

      setIsLoading(true);
      try {
        const fetchedNotifications = await getNotifications(userData?.uid);
        setNotifications(fetchedNotifications);
        setHasUnread(fetchedNotifications.some((n) => !n.read));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        // Handle error appropriately
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, [userData]);

  // Mark notifications as read when popover opens
  // In a real app, this might happen via API call
  React.useEffect(() => {
    if (isOpen && hasUnread && userData?.uid) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setHasUnread(false);

      markAllNotificationsAsRead(userData?.uid);

      console.log("Marking notifications as read (client-side simulation)");
    }
  }, [isOpen, hasUnread]);

  const unreadCount = notifications.filter((n) => !n.read).length; // Re-calculate based on current state if needed

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && ( // Show badge only if there are unread notifications
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              <span className="sr-only">{t("dropdown.badgeLabel")}</span>
            </span>
          )}
          <span className="sr-only">{t("pageTitle")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium leading-none">{t("pageTitle")}</h3>
        </div>
        <ScrollArea className="h-80">
          {" "}
          {/* Limit height and add scroll */}
          <div className="p-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                {t("dropdown.loading")}
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                {t("dropdown.empty")}
              </p>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                      // !notification.read && 'bg-primary/5' // Subtle background for unread
                    )}
                  >
                    {/* Icon & Unread Indicator */}
                    <div className="flex flex-col items-center pt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {!notification.read && (
                        <Circle className="h-2 w-2 mt-1.5 flex-shrink-0 fill-primary text-primary" />
                      )}
                    </div>
                    {/* Notification Content */}
                    <div className={cn("flex-1 space-y-1")}>
                      <p className="text-sm leading-snug">
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
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-2 text-center">
          <Link
            href="/notifications" // Link to the full notifications page
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }), // Use buttonVariants here
              "text-muted-foreground"
            )}
            onClick={() => setIsOpen(false)} // Close popover on click
          >
            {t("dropdown.viewAll")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
