import { memo } from 'react'

export const Skeleton = memo(function Skeleton({
  width,
  height = '1rem',
  rounded = 'lg',
  className = ''
}) {
  return (
    <div
      className={`skeleton rounded-${rounded} ${className}`}
      style={{ width, height }}
    />
  )
})

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-bg-secondary border border-border space-y-3 animate-pulse">
      <Skeleton width="60%" height="1rem" />
      <Skeleton width="40%" height="0.75rem" />
      <div className="flex gap-2 pt-2">
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
        <Skeleton width="4rem" height="1.5rem" rounded="full" />
      </div>
    </div>
  )
})

export const ListSkeleton = memo(function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-border">
          <Skeleton width="2.5rem" height="2.5rem" rounded="xl" />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height="0.875rem" />
            <Skeleton width="40%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  )
})

export const StatsSkeleton = memo(function StatsSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 p-4 rounded-xl bg-bg-secondary border border-border space-y-2">
          <Skeleton width="2rem" height="2rem" rounded="lg" />
          <Skeleton width="3rem" height="1.5rem" />
          <Skeleton width="80%" height="0.75rem" />
        </div>
      ))}
    </div>
  )
})
