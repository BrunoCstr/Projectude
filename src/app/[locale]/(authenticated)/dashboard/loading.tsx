
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8"> {/* Removed padding */}
       <Skeleton className="h-9 w-48" />

        {/* Info Cards Skeleton */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[...Array(4)].map((_, i) => (
           <Card key={i} className="shadow-md rounded-lg p-4 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" /> {/* Icon Skeleton */}
               <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-3 w-24" /> {/* Title Skeleton */}
                 <Skeleton className="h-6 w-16" /> {/* Value Skeleton */}
                 <Skeleton className="h-3 w-32" /> {/* Description Skeleton */}
               </div>
           </Card>
         ))}
       </div>

       {/* Charts Section Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <Card className="shadow-md rounded-lg lg:col-span-2">
             <CardHeader>
               <Skeleton className="h-5 w-48" />
               <Skeleton className="h-4 w-56 mt-1" />
             </CardHeader>
             <CardContent className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
             </CardContent>
           </Card>
           <Card className="shadow-md rounded-lg flex flex-col"> {/* Added flex flex-col */}
             <CardHeader>
               <Skeleton className="h-5 w-40" />
               <Skeleton className="h-4 w-48 mt-1" />
             </CardHeader>
             <CardContent className="h-64 flex-grow flex items-center justify-center p-4"> {/* Added flex-grow */}
                <Skeleton className="h-40 w-40 rounded-full" /> {/* Adjusted size */}
             </CardContent>
              {/* <CardFooter className="flex items-center justify-center p-4">
                 <Skeleton className="h-4 w-2/3" />
              </CardFooter> */}
           </Card>
            <Card className="shadow-md rounded-lg">
             <CardHeader>
               <Skeleton className="h-5 w-40" />
               <Skeleton className="h-4 w-32 mt-1" />
             </CardHeader>
             <CardContent className="h-64 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
             </CardContent>
           </Card>
            <Card className="shadow-md rounded-lg lg:col-span-2">
             <CardHeader>
               <Skeleton className="h-5 w-52" />
                <Skeleton className="h-4 w-44 mt-1" />
             </CardHeader>
             <CardContent className="h-64 flex items-center justify-center">
               <Skeleton className="h-full w-full" />
             </CardContent>
           </Card>
         </div>

        {/* Notifications Section Skeleton */}
       <section>
           <Skeleton className="h-6 w-56 mb-4" />
           <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                 <Card key={i} className="shadow-sm rounded-lg p-3 flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-1">
                       <Skeleton className="h-4 w-3/5" />
                       <Skeleton className="h-3 w-4/5" />
                    </div>
                 </Card>
              ))}
           </div>
       </section>
    </div>
  );
}
