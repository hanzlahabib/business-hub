/**
 * Reusable loading skeleton components.
 * Use these as placeholders while data is being fetched.
 */

interface SkeletonProps {
    className?: string
}

/** Basic rectangular skeleton */
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-bg-secondary rounded-lg ${className}`}
            role="status"
            aria-label="Loading"
        />
    )
}

/** Skeleton for a card-like element */
export function CardSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-border bg-bg-secondary/50 space-y-3" role="status" aria-label="Loading card">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
        </div>
    )
}

/** Skeleton for a table row */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex items-center gap-4 p-3 border-b border-border" role="status" aria-label="Loading row">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-1/3' : 'flex-1'}`} />
            ))}
        </div>
    )
}

/** Skeleton for a list of items */
export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3" role="status" aria-label="Loading list">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    )
}

/** Full page loading skeleton */
export function PageSkeleton() {
    return (
        <div className="space-y-6 p-6" role="status" aria-label="Loading page">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-10 h-10 rounded-xl" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
}

/** Loading skeleton with variant support (board/list) — used by module views */
export function LoadingSkeleton({ variant = 'board' }: { variant?: 'board' | 'list' }) {
    if (variant === 'list') {
        return (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-bg-secondary/30 animate-pulse" role="status" aria-label="Loading">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>
        )
    }

    // Board variant
    return (
        <div className="p-4 rounded-xl border border-border bg-bg-secondary/30 space-y-3 animate-pulse" role="status" aria-label="Loading">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 pt-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-18 rounded-full" />
            </div>
        </div>
    )
}

