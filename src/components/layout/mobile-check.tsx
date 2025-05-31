
'use client';

import React from 'react';
import { useSidebar } from '@/components/ui/sidebar';

interface MobileCheckProps {
  children: (isMobile: boolean) => React.ReactNode;
}

export function MobileCheck({ children }: MobileCheckProps) {
  const { isMobile } = useSidebar();
  return <>{children(isMobile)}</>;
}
