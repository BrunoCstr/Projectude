
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem } from "@/components/ui/accordion";


export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
       <Skeleton className="h-9 w-52 mx-auto" />
       <Skeleton className="h-6 w-80 mx-auto" />

      {/* Search Bar Skeleton */}
      <div className="relative max-w-xl mx-auto w-full">
        <Skeleton className="h-11 w-full" />
      </div>

      {/* Popular Topics Skeleton */}
      <section>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-10 w-36 rounded-md" />
          ))}
        </div>
      </section>

      {/* FAQs Section Skeleton */}
      <section>
        <Skeleton className="h-6 w-64 mb-4" />
        <Card className="shadow-md rounded-lg">
          <CardContent className="p-0">
             <Accordion type="single" collapsible className="w-full">
                {[...Array(3)].map((_, i) => (
                    <AccordionItem value={`item-${i}`} key={i} className="border-b px-6 py-4 last:border-b-0">
                         <Skeleton className="h-5 w-3/4" />
                    </AccordionItem>
                 ))}
             </Accordion>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
