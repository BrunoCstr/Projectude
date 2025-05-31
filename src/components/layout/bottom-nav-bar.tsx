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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { useAuth } from "@/hooks/use-auth"; // Import useAuth hook

interface NavItem {
  href: string;
  label: string; // Keep label for accessibility (aria-label)
  icon: LucideIcon;
}

// Updated navigation items to include Comments and Tags, and Profile
const bottomNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-projects", label: "Meus Projetos", icon: FolderKanban },
  { href: "/shared-with-me", label: "Compartilhados", icon: FolderSearch },
  { href: "/collaborators", label: "Colaboradores", icon: Users },
  { href: "/comments", label: "Comentários", icon: MessageSquare },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/profile", label: "Perfil", icon: User }, // Added Profile
];

export function BottomNavBar() {
  // Assuming you have a useAuth hook to get user data
  const { userData } = useAuth();

  // Mock user data (consistent with SidebarNav)
  const user = {
    name: userData?.displayName || 'Usuário', // Use userData from context
    avatarUrl: userData?.photoURL, // Use a 40x40 avatar
  };

  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background shadow-md md:hidden">
      {/* Updated grid columns to accommodate 8 items */}
      <div className="mx-auto grid h-full max-w-lg grid-cols-8 items-center justify-items-center">
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isProfile = item.href === "/profile"; // Check if it's the profile item

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                // Adjusted padding and removed text-xs for icon-only view
                "flex h-full w-full flex-col items-center justify-center rounded-none p-2",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label} // Keep aria-label for accessibility
            >
              {/* Conditionally render Avatar or Icon */}
              {isProfile ? (
                <Avatar
                  className={cn(
                    "h-6 w-6", // Small avatar size for nav bar
                    isActive &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-background" // Add ring if active
                  )}
                >
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <item.icon
                  className={cn("h-6 w-6", isActive ? "text-primary" : "")}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
