import { useState, useMemo, useCallback } from 'react'

interface PaginationOptions {
    /** Total number of items */
    totalItems: number
    /** Number of items per page (default: 20) */
    pageSize?: number
    /** Initial page number (default: 1) */
    initialPage?: number
}

interface PaginationResult<T> {
    /** Current page number (1-indexed) */
    currentPage: number
    /** Total number of pages */
    totalPages: number
    /** Start index for slicing (0-indexed) */
    startIndex: number
    /** End index for slicing (exclusive) */
    endIndex: number
    /** Whether there is a next page */
    hasNextPage: boolean
    /** Whether there is a previous page */
    hasPreviousPage: boolean
    /** Go to a specific page */
    goToPage: (page: number) => void
    /** Go to next page */
    nextPage: () => void
    /** Go to previous page */
    previousPage: () => void
    /** Paginate an array of items */
    paginate: (items: T[]) => T[]
}

export function usePagination<T = any>({
    totalItems,
    pageSize = 20,
    initialPage = 1
}: PaginationOptions): PaginationResult<T> {
    const [currentPage, setCurrentPage] = useState(initialPage)

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize]
    )

    // Ensure current page stays in bounds
    const safePage = useMemo(
        () => Math.min(Math.max(1, currentPage), totalPages),
        [currentPage, totalPages]
    )

    const startIndex = (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages))
    }, [totalPages])

    const nextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages))
    }, [totalPages])

    const previousPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1))
    }, [])

    const paginate = useCallback((items: T[]): T[] => {
        return items.slice(startIndex, endIndex)
    }, [startIndex, endIndex])

    return {
        currentPage: safePage,
        totalPages,
        startIndex,
        endIndex,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
        goToPage,
        nextPage,
        previousPage,
        paginate
    }
}

export default usePagination
