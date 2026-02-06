import { motion } from 'framer-motion'

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0']
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear'
  }
}

function SkeletonBase({ className = '' }) {
  return (
    <motion.div
      {...shimmer}
      className={`bg-gradient-to-r from-bg-tertiary via-bg-secondary to-bg-tertiary bg-[length:200%_100%] rounded ${className}`}
      style={{ backgroundSize: '200% 100%' }}
    />
  )
}

function CardSkeleton() {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-4 space-y-3">
      <SkeletonBase className="h-5 w-3/4" />
      <SkeletonBase className="h-4 w-full" />
      <SkeletonBase className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <SkeletonBase className="h-6 w-16" />
        <SkeletonBase className="h-6 w-20" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-1/3" />
          <SkeletonBase className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="bg-bg-secondary rounded-lg border border-border p-4 min-h-[400px]">
      <SkeletonBase className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-bg-tertiary rounded p-3 space-y-2">
            <SkeletonBase className="h-4 w-full" />
            <SkeletonBase className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-bg-secondary rounded border border-border">
          <SkeletonBase className="h-4 w-1/4" />
          <SkeletonBase className="h-4 w-1/3" />
          <SkeletonBase className="h-4 w-1/5" />
          <SkeletonBase className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}

export function LoadingSkeleton({ variant = 'card', count = 1 }) {
  const variants = {
    card: CardSkeleton,
    list: ListSkeleton,
    board: BoardSkeleton,
    table: TableSkeleton
  }

  const SkeletonComponent = variants[variant] || variants.card

  if (count === 1) {
    return <SkeletonComponent />
  }

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </>
  )
}
