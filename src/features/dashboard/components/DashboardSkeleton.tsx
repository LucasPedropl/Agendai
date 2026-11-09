import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* 4 Cards Skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-0">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="p-0 pt-3 space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart and List Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 p-4 border border-border bg-card">
          <CardHeader className="pb-4 p-0 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 p-4 border border-border bg-card">
          <CardHeader className="pb-4 p-0 flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
