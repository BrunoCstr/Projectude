
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>

      <Card className="shadow-md rounded-lg">
        <CardHeader>
           <Skeleton className="h-6 w-36" />
           <Skeleton className="h-4 w-96 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center gap-3 flex-1 mr-4">
                   <Skeleton className="h-6 w-24 rounded-full" />
                   <Skeleton className="h-4 w-3/5" />
                 </div>
                <div className="flex gap-1">
                   <Skeleton className="h-8 w-8 rounded-md" />
                   <Skeleton className="h-8 w-8 rounded-md" />
                 </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
