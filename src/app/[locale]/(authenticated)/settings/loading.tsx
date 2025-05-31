
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-9 w-32" />

      <Tabs defaultValue="account" className="w-full">
        {/* Tabs List Skeleton */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1"> {/* Updated grid classes */}
          <TabsTrigger value="account" disabled>
            <Skeleton className="h-5 w-24" />
          </TabsTrigger>
          <TabsTrigger value="billing" disabled>
            <Skeleton className="h-5 w-32" />
          </TabsTrigger>
          <TabsTrigger value="options" disabled>
             <Skeleton className="h-5 w-20" />
          </TabsTrigger>
           <TabsTrigger value="notifications" disabled>
             <Skeleton className="h-5 w-28" />
           </TabsTrigger>
           <TabsTrigger value="appearance" disabled>
             <Skeleton className="h-5 w-24" />
           </TabsTrigger>
        </TabsList>

        {/* Default Tab Content Skeleton (Account) */}
        <TabsContent value="account">
           <Card className="shadow-md rounded-lg mt-4">
             <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-64 mt-1" />
             </CardHeader>
             <CardContent className="space-y-4">
                {/* Name/Email Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                       <Skeleton className="h-4 w-10" />
                       <Skeleton className="h-10 w-full" />
                   </div>
                    <div className="space-y-1">
                       <Skeleton className="h-4 w-12" />
                       <Skeleton className="h-10 w-full" />
                   </div>
                </div>
                 {/* Username Skeleton */}
                 <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                 </div>
                  {/* Change Password Button Skeleton */}
                 <div>
                    <Skeleton className="h-9 w-36" />
                 </div>
                 <Skeleton className="h-px w-full my-2" />
                  {/* Address Skeleton */}
                 <div className="space-y-1">
                     <Skeleton className="h-4 w-28" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                     </div>
                     <Skeleton className="h-10 w-full mt-4" />
                 </div>
             </CardContent>
           </Card>
        </TabsContent>

         {/* Add skeletons for other tabs if needed, but usually loading the default is enough */}
         <TabsContent value="billing">
             <Card className="shadow-md rounded-lg mt-4">
               <CardHeader>
                 <Skeleton className="h-6 w-36" />
                 <Skeleton className="h-4 w-72 mt-1" />
               </CardHeader>
               <CardContent>
                 <Skeleton className="h-40 w-full" /> {/* Placeholder for billing content */}
               </CardContent>
             </Card>
         </TabsContent>
         <TabsContent value="options">
              <Card className="shadow-md rounded-lg mt-4">
               <CardHeader>
                 <Skeleton className="h-6 w-24" />
                 <Skeleton className="h-4 w-64 mt-1" />
               </CardHeader>
               <CardContent>
                 <Skeleton className="h-20 w-full" />
               </CardContent>
             </Card>
         </TabsContent>
          <TabsContent value="notifications">
              <Card className="shadow-md rounded-lg mt-4">
               <CardHeader>
                 <Skeleton className="h-6 w-32" />
                 <Skeleton className="h-4 w-56 mt-1" />
               </CardHeader>
               <CardContent>
                 <Skeleton className="h-48 w-full" />
               </CardContent>
             </Card>
         </TabsContent>
          <TabsContent value="appearance">
              <Card className="shadow-md rounded-lg mt-4">
               <CardHeader>
                 <Skeleton className="h-6 w-28" />
                 <Skeleton className="h-4 w-48 mt-1" />
               </CardHeader>
               <CardContent>
                  <Skeleton className="h-10 w-full" />
               </CardContent>
             </Card>
         </TabsContent>

      </Tabs>
    </div>
  );
}
