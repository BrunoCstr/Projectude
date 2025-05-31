
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
// Removed Tabs imports

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
         <Skeleton className="h-9 w-48" />
         {/* Skeleton for Mark all read button */}
         <Skeleton className="h-10 w-44" />
      </div>

      {/* Skeleton for month navigation */}
       <div className="flex items-center justify-center gap-4 mb-4">
           <Skeleton className="h-10 w-10 rounded-md" /> {/* Arrow Button */}
           <Skeleton className="h-7 w-48" /> {/* Month Name */}
           <Skeleton className="h-10 w-10 rounded-md" /> {/* Arrow Button */}
       </div>


      {/* Skeleton for the loading list component area */}
       <Card className="shadow-md rounded-lg mt-0"> {/* Removed mt-4 */}
            <CardContent className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3 border">
                  <div className="flex flex-col items-center pt-0.5">
                      <Skeleton className="h-4 w-4 rounded-md" />
                      <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5" />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </CardContent>
       </Card>
    </div>
  );
}

