
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { MobileCheck } from "@/components/layout/mobile-check";

interface AppStructureProps {
  children: React.ReactNode;
}

export function AppStructure({ children }: AppStructureProps) {
  return (
    <MobileCheck>
      {(isMobile) => (
        <>
          {!isMobile && <SidebarNav />}
          <SidebarInset>
            <AppHeader />
            <main className={cn(
              "flex-1 p-4 md:p-8",
              isMobile && "pb-20" // Add padding-bottom on mobile for BottomNavBar
            )}>
              {children}
            </main>
            {isMobile && <BottomNavBar />}
          </SidebarInset>
        </>
      )}
    </MobileCheck>
  );
}
