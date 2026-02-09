import { useState, useCallback, useEffect, useRef } from 'react'

interface PresentationOptions {
    delay?: number
    autoStart?: boolean
    onComplete?: () => void
}

interface PresentationState<T> {
    visibleItems: T[]
    visibleCount: number
    totalItems: number
    isPresenting: boolean
    isComplete: boolean
    progress: number
    start: () => void
    stop: () => void
    reset: () => void
    skip: () => void
}

/**
 * Hook for presentation-style staggered item reveals
 * Items appear one by one with configurable delays
 */
export function usePresentationMode<T>(items: T[] = [], options: PresentationOptions = {}): PresentationState<T> {
    const {
        delay = 1500,
        autoStart = false,
        onComplete
    } = options

    const [visibleCount, setVisibleCount] = useState(autoStart ? 0 : items.length)
    const [isPresenting, setIsPresenting] = useState(autoStart)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Auto-reveal items with delay
    useEffect(() => {
        if (!isPresenting || visibleCount >= items.length) {
            if (isPresenting && visibleCount >= items.length) {
                setIsPresenting(false)
                onComplete?.()
            }
            return
        }

        timeoutRef.current = setTimeout(() => {
            setVisibleCount(prev => prev + 1)
        }, delay)

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current!)
            }
        }
    }, [isPresenting, visibleCount, items.length, delay, onComplete])

    // Reset when items change
    useEffect(() => {
        if (!isPresenting) {
            setVisibleCount(items.length)
        }
    }, [items.length, isPresenting])

    const start = useCallback(() => {
        setVisibleCount(0)
        setIsPresenting(true)
    }, [])

    const stop = useCallback(() => {
        setIsPresenting(false)
        setVisibleCount(items.length)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [items.length])

    const reset = useCallback(() => {
        setVisibleCount(0)
        setIsPresenting(false)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    const skip = useCallback(() => {
        setVisibleCount(items.length)
        setIsPresenting(false)
    }, [items.length])

    return {
        visibleItems: items.slice(0, visibleCount),
        visibleCount,
        totalItems: items.length,
        isPresenting,
        isComplete: visibleCount >= items.length,
        progress: items.length > 0 ? (visibleCount / items.length) * 100 : 100,
        start,
        stop,
        reset,
        skip
    }
}
