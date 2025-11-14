import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FlashcardsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Bar Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      
      {/* Main Card Skeleton */}
      <Card className="p-8 min-h-[400px] flex flex-col justify-center items-center space-y-6">
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-6 w-full max-w-sm" />
        <Skeleton className="h-32 w-full max-w-lg" />
        <div className="flex gap-4 mt-8">
          <Skeleton className="h-12 w-24 rounded-lg" />
          <Skeleton className="h-12 w-24 rounded-lg" />
        </div>
      </Card>

      {/* Navigation Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-2 w-8 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </div>
        
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </Card>
    </div>
  )
}