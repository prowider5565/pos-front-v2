import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CardSkeletonProps {
  className?: string
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 @[250px]/card:h-10" />
        <Skeleton className="h-8 w-32 @[250px]/card:h-10 mt-1" />
      </CardHeader>
    </Card>
  )
}
