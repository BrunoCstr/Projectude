
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Collaborators Grid Skeleton */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                   <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Received Invitations List Skeleton */}
      <Card className="shadow-md rounded-lg">
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                 {/* Inviter Info Skeleton */}
                 <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                   <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar Skeleton */}
                   <Skeleton className="h-4 w-3/4" /> {/* Message Skeleton */}
                 </div>
                 {/* Action Buttons Skeleton */}
                <div className="flex gap-2 flex-shrink-0">
                   <Skeleton className="h-8 w-20 rounded-md" /> {/* Accept Button */}
                   <Skeleton className="h-8 w-20 rounded-md" /> {/* Decline Button */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
