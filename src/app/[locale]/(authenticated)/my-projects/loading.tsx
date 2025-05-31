
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8"> {/* Removed padding */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-44" /> {/* Adjusted width for new button text */}
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
           <Card key={i} className="shadow-md rounded-lg overflow-hidden flex flex-col">
             {/* Cover Image Skeleton */}
             <Skeleton className="h-32 w-full" />
             {/* Content Wrapper */}
             <div className="relative p-4 flex-grow flex flex-col">
               {/* Logo Skeleton */}
               <Skeleton className="absolute left-4 top-[-2rem] w-16 h-16 rounded-full border-4 border-background shadow-lg bg-background z-10" />
               {/* Main Content Area */}
               <div className="pt-8 flex-grow flex flex-col gap-3">
                 {/* Header Skeleton */}
                 <CardHeader className="p-0 space-y-1">
                   <Skeleton className="h-5 w-3/5" /> {/* Name */}
                   <Skeleton className="h-4 w-4/5" /> {/* Description Line 1 */}
                   <Skeleton className="h-4 w-3/5" /> {/* Description Line 2 */}
                 </CardHeader>
                 {/* Details Skeleton */}
                 <CardContent className="p-0 space-y-3 flex-grow">
                   <div className="flex items-center justify-start gap-4 text-xs">
                     <Skeleton className="h-5 w-16 rounded-full" /> {/* Status Badge */}
                     <Skeleton className="h-4 w-24" /> {/* Start Date */}
                   </div>
                   <Skeleton className="h-4 w-20" /> {/* Investment */}
                 </CardContent>
               </div>
             </div>
             {/* Footer Skeleton */}
             <CardFooter className="p-4 border-t border-border bg-muted/30 flex items-center justify-between h-14">
               <div className="flex -space-x-2 overflow-hidden">
                 <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
                 <Skeleton className="h-6 w-6 rounded-full border-2 border-background" />
               </div>
               <Skeleton className="h-8 w-24" /> {/* Details Button */}
             </CardFooter>
           </Card>
        ))}
      </div>
    </div>
  );
}
