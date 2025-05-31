
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-44" />
           <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <Tabs defaultValue="my-comments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-comments">
            <Skeleton className="h-5 w-32" />
          </TabsTrigger>
          <TabsTrigger value="received-comments">
            <Skeleton className="h-5 w-40" />
          </TabsTrigger>
        </TabsList>

        {/* My Comments Skeleton */}
        <TabsContent value="my-comments">
          <Card className="shadow-md rounded-lg">
            <CardHeader>
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-4 w-80 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(2)].map((_, i) => (
                 <div key={i} className="flex items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-lg">
                    {/* Avatar */}
                    <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 mt-1" />
                    {/* Content & Actions */}
                     <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-2 sm:gap-4">
                       {/* Main Content */}
                       <div className="flex-1 min-w-0 space-y-1.5">
                         <Skeleton className="h-4 w-4/5" /> {/* Text */}
                         <Skeleton className="h-3 w-1/2" /> {/* Metadata */}
                         <Skeleton className="h-3 w-1/3" /> {/* Metadata */}
                          {/* Status */}
                          <div className="flex items-center gap-2 pt-1">
                            <Skeleton className="w-[120px] sm:w-[130px] h-7 rounded-md" /> {/* Select */}
                             <Skeleton className="hidden sm:block h-4 w-16 rounded-full" /> {/* Status Text */}
                          </div>
                       </div>
                        {/* Right Actions */}
                        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 text-xs text-muted-foreground self-end sm:self-start sm:pt-1">
                            <Skeleton className="h-10 w-8" /> {/* Replies */}
                            <Skeleton className="hidden sm:block h-8 w-16" /> {/* Last Reply */}
                             <Skeleton className="h-8 w-8 rounded-md" /> {/* More Actions */}
                        </div>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Received Comments Skeleton */}
        <TabsContent value="received-comments">
           <Card className="shadow-md rounded-lg">
             <CardHeader>
               <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-72 mt-1" />
             </CardHeader>
             <CardContent className="space-y-4">
               {[...Array(1)].map((_, i) => (
                 <div key={i} className="flex items-start gap-3 sm:gap-4 px-3 sm:px-4 py-3 border rounded-lg">
                     {/* Avatar */}
                     <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 mt-1" />
                     {/* Content & Actions */}
                     <div className="flex flex-col sm:flex-row flex-1 min-w-0 gap-2 sm:gap-4">
                        {/* Main Content */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                         <Skeleton className="h-4 w-4/5" /> {/* Text */}
                         <Skeleton className="h-3 w-1/2" /> {/* Metadata */}
                         <Skeleton className="h-3 w-1/3" /> {/* Metadata */}
                           {/* Status */}
                           <div className="flex items-center gap-2 pt-1">
                             <Skeleton className="w-[120px] sm:w-[130px] h-7 rounded-md" /> {/* Select */}
                              <Skeleton className="hidden sm:block h-4 w-16 rounded-full" /> {/* Status Text */}
                           </div>
                        </div>
                         {/* Right Actions */}
                         <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 text-xs text-muted-foreground self-end sm:self-start sm:pt-1">
                             <Skeleton className="h-10 w-8" /> {/* Replies */}
                             <Skeleton className="hidden sm:block h-8 w-16" /> {/* Last Reply */}
                              <Skeleton className="h-8 w-8 rounded-md" /> {/* More Actions */}
                         </div>
                     </div>
                 </div>
               ))}
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
