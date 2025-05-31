"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FolderSearch,
  Users,
  MessageSquare,
  Tag,
  Settings,
  User,
  LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar
import { cn } from "@/lib/utils";
import { ProjectudeLogoSmall } from "./projectude-logo-small"; // Import small logo
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Mock user data (replace with actual user data logic)

export function SidebarNav() {
  const pathname = usePathname();
  const { isMobile } = useSidebar(); // Get mobile status
  const { userData } = useAuth();

  const t = useTranslations("sidebar");

  // Updated navItems to include Settings
  const navItems: NavItem[] = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/my-projects", label: t("MyProjects"), icon: FolderKanban },
    { href: "/shared-with-me", label: t("shared-with-me"), icon: FolderSearch },
    { href: "/collaborators", label: t("collaborators"), icon: Users },
    { href: "/comments", label: t("comments"), icon: MessageSquare },
    { href: "/tags", label: t("tags"), icon: Tag },
    { href: "/settings", label: t("settings"), icon: Settings }, // Moved Settings here
  ];

  const user = {
    name: userData?.displayName || "Usuário", // Use userData from context
    avatarUrl: userData?.photoURL, // Use a 40x40 avatar
  };

  // Hide sidebar on mobile, it will be replaced by BottomNavBar
  if (isMobile) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-start group-data-[collapsible=icon]:justify-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* Use ProjectudeLogoSmall */}
          <Image
            src={"/logo_dark_mode.png"}
            width={150}
            height={150}
            alt="Logo dark mode"
            className="group-data-[collapsible=icon]:hidden"
          />

          {/* Logo para sidebar recolhida */}
          <Image
            src="/projectude_logo.png"
            width={50}
            height={50}
            alt="Logo compacta"
            className="hidden group-data-[collapsible=icon]:block "
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-2 group-data-[collapsible=icon]:grid group-data-[collapsible=icon]:place-items-center">
        {" "}
        {/* Add p-2 to match footer */}
        {/* Increased gap for main menu items */}
        <SidebarMenu className="gap-3">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                }
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:grid group-data-[collapsible=icon]:place-items-center">
        {" "}
        {/* Ensure footer also has p-2 */}
        {/* Increased gap for footer menu items */}
        <SidebarMenu className="gap-3">
          {/* Profile Item - Remains in Footer */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/profile"}
              tooltip={user.name} // Keep tooltip
              className={cn(
                "pt-5 pb-5", // Existing padding adjustments
                "hover:bg-transparent hover:text-sidebar-foreground focus-visible:bg-transparent focus-visible:ring-1 focus-visible:ring-sidebar-border", // Removed hover bg
                "border border-sidebar-border" // Added solid border
              )}
            >
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar className="h-6 w-6 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
                  {" "}
                  {/* Adjust size */}
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="group-data-[collapsible=icon]:hidden text-sm font-medium">
                  {user.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
