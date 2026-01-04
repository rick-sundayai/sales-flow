import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 space-y-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-9 w-24 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-h-full">
          {/* Pipeline columns */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                  
                  {/* Deal cards */}
                  <div className="space-y-3">
                    {Array.from({ length: Math.floor(Math.random() * 4) + 1 }).map((_, j) => (
                      <Card key={j} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-24 mb-2" />
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}