
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
       <div className="flex justify-between items-center">
         <Skeleton className="h-9 w-44" />
         <Skeleton className="h-10 w-28" />
       </div>


      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column Skeleton */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-md rounded-lg">
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-9 w-36" />
              <div className="text-center space-y-1">
                 <Skeleton className="h-6 w-40" />
                 <Skeleton className="h-4 w-48" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md rounded-lg">
             <CardHeader>
               <Skeleton className="h-6 w-32" />
             </CardHeader>
             <CardContent className="space-y-3">
               {[...Array(2)].map((_, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <Skeleton className="h-4 w-4 rounded-full" />
                   <Skeleton className="h-4 w-2/3" />
                 </div>
               ))}
                <Skeleton className="h-9 w-full mt-2" />
             </CardContent>
           </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md rounded-lg">
            <CardHeader>
               <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                 <Skeleton className="h-4 w-16 mb-1" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div>
                 <Skeleton className="h-4 w-10 mb-1" />
                 <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>

           <Card className="shadow-md rounded-lg">
              <CardHeader>
                 <Skeleton className="h-6 w-20" />
                 <Skeleton className="h-4 w-64 mt-1" />
              </CardHeader>
              <CardContent className="space-y-4">
                 {[...Array(3)].map((_, i) => (
                    <div key={i}>
                         <Skeleton className="h-4 w-24 mb-2" />
                        <div className="border p-3 rounded-md min-h-[60px] space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                        </div>
                          <Skeleton className="h-8 w-32 mt-2" />
                    </div>
                 ))}
              </CardContent>
           </Card>

           <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
           </div>
        </div>
      </div>
    </div>
  );
}
