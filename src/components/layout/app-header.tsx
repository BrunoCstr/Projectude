
"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // Import useSidebar
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpCircle, Bell } from "lucide-react"; // Added Bell icon
import Link from 'next/link';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'; // Import NotificationDropdown
import { ProjectudeLogoSmall } from './projectude-logo-small'; // Import the small logo component

export function AppHeader() {
  const { isMobile } = useSidebar(); // Get mobile status

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 md:px-8 mb-4 md:mb-8">
      <div className="flex items-center gap-2">
        {/* Conditionally render SidebarTrigger or Logo */}
        {isMobile ? (
          <Link href="/dashboard" className="flex items-center gap-2">
             <img src={'/projectude_logo.png'} className="h-6"></img>
          </Link>
        ) : (
          <SidebarTrigger />
        )}
      </div>
      <div className="flex flex-1 justify-end items-center gap-2 sm:gap-4"> {/* Reduced gap on small screens */}
         <Button variant="ghost" size="icon" asChild>
           <Link href="/help-center">
             <HelpCircle className="h-5 w-5" />
             <span className="sr-only">Help Center</span>
           </Link>
         </Button>
         {/* Add Notification Dropdown */}
         <NotificationDropdown />
        <ThemeToggle />
      </div>
    </header>
  );
}
