import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface LoadingStateProps {
  className?: string
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
