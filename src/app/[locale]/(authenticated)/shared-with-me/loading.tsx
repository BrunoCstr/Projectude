
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8"> {/* Removed padding */}
       <Skeleton className="h-9 w-52" />

      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg flex items-center justify-between p-4">
             <div className="flex items-center gap-4 w-full">
               <Skeleton className="w-12 h-12 rounded-lg" /> {/* Increased logo size */}
               <div className="flex-1 space-y-1.5"> {/* Adjusted spacing */}
                 <Skeleton className="h-4 w-1/3" /> {/* Project Name */}
                 <Skeleton className="h-3 w-3/4" /> {/* Description */}
                 {/* Creator and Date Skeleton */}
                 <div className="flex items-center gap-3 pt-1">
                     <Skeleton className="h-3 w-20" /> {/* Creator */}
                     <Skeleton className="h-3 w-24" /> {/* Date */}
                 </div>
               </div>
                <div className="flex items-center gap-4 ml-auto">
                  <Skeleton className="h-5 w-20 rounded-full" /> {/* Status Badge */}
                  {/* Collaborators Skeleton */}
                   <div className="flex -space-x-2">
                       <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
                       <Skeleton className="h-7 w-7 rounded-full border-2 border-background" />
                   </div>
                  <Skeleton className="h-8 w-20 rounded-md" /> {/* View Button */}
                </div>
             </div>
           </Card>
        ))}
      </div>
    </div>
  );
}
