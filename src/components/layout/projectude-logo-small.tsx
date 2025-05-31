
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProjectudeLogoSmall({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Briefcase className="h-6 w-6 text-primary" />
      {/* Optionally hide text on very small screens if needed */}
      {/* <span className="text-lg font-semibold text-foreground hidden xs:inline">Projectude</span> */}
    </div>
  );
}
