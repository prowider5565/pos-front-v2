import { CardSkeleton } from '@/components/ui/card-skeleton'

export function SectionCardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
