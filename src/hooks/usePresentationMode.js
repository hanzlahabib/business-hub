import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Hook for presentation-style staggered item reveals
 * Items appear one by one with configurable delays
 *
 * Usage:
 *   const { visibleItems, isPresenting, start, stop, reset } = usePresentationMode(items, {
 *     delay: 1500,     // 1.5 seconds between items
 *     autoStart: false // Start manually
 *   })
 *
 *   {visibleItems.map((item, index) => (
 *     <motion.div key={item.id} {...presentationReveal(index)}>
 *       {item.content}
 *     </motion.div>
 *   ))}
 */
export function usePresentationMode(items = [], options = {}) {
  const {
    delay = 1500,
    autoStart = false,
    onComplete
  } = options

  const [visibleCount, setVisibleCount] = useState(autoStart ? 0 : items.length)
  const [isPresenting, setIsPresenting] = useState(autoStart)
  const timeoutRef = useRef(null)

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
        clearTimeout(timeoutRef.current)
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
