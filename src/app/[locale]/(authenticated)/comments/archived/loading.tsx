
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-60" />
        <Skeleton className="h-10 w-40" />
      </div>

      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30 opacity-70">
                {/* Avatar Skeleton */}
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0 mt-1" />
                 {/* Main Content Skeleton */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-1/2" />
                     <Skeleton className="h-3 w-1/3" />
                     {/* Status Skeleton */}
                     <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-5 w-28 rounded-full" />
                     </div>
                </div>
                {/* Actions Skeleton */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-auto pl-4">
                    <Skeleton className="h-7 w-24 rounded-md" />
                     {/* <Skeleton className="h-7 w-36 rounded-md" /> */}
                 </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
