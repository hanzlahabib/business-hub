// @ts-nocheck
import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { SlidersHorizontal, Video, Film, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { usePipelineAnalytics } from '@/modules/pipeline/hooks/usePipelineAnalytics'
import { PipelineAnalytics } from '@/modules/pipeline/components/PipelineAnalytics'
import { PipelineBoard } from '@/modules/pipeline/components/PipelineBoard'
import { Content } from '@/components/Calendar/ContentCard'

interface ContentPipelineProps {
    contents: Content[]
    settings: any
    onEditContent?: (content: Content) => void
    onDeleteContent?: (id: string) => void
    onStatusChange: (id: string, status: Content['status']) => void
    onAddContent?: () => void
    onOpenDetail?: (content: Content) => void
}

export const ContentPipeline = memo(function ContentPipeline({
    contents,
    settings,
    onEditContent,
    onDeleteContent,
    onStatusChange,
    onAddContent,
    onOpenDetail
}: ContentPipelineProps) {
    const [typeFilter, setTypeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('recent')
    const [showOverdueOnly, setShowOverdueOnly] = useState(false)
    const [showStuckOnly, setShowStuckOnly] = useState(false)

    // Get analytics
    const analytics = usePipelineAnalytics(contents, settings)

    // Apply filters
    const filteredContents = useMemo(() => {
        let filtered = analytics.contentWithAge

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter((c: any) => c.type === typeFilter)
        }

        // Overdue filter
        if (showOverdueOnly) {
            filtered = filtered.filter((c: any) => c.isOverdue)
        }

        // Stuck filter
        if (showStuckOnly) {
            filtered = filtered.filter((c: any) => c.daysInStage > 5 && c.status !== 'published')
        }

        // Sort
        switch (sortBy) {
            case 'recent':
                filtered = [...filtered].sort((a: any, b: any) =>
                    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                )
                break
            case 'oldest':
                filtered = [...filtered].sort((a: any, b: any) =>
                    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                )
                break
            case 'due-date':
                filtered = [...filtered].sort((a: any, b: any) => {
                    if (!a.scheduledDate) return 1
                    if (!b.scheduledDate) return -1
                    return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
                })
                break
            case 'stuck':
                filtered = [...filtered].sort((a: any, b: any) => b.daysInStage - a.daysInStage)
                break
            default:
                break
        }

        return filtered
    }, [analytics.contentWithAge, typeFilter, sortBy, showOverdueOnly, showStuckOnly])

    const activeFiltersCount = [
        typeFilter !== 'all',
        showOverdueOnly,
        showStuckOnly
    ].filter(Boolean).length

    const clearFilters = () => {
        setTypeFilter('all')
        setShowOverdueOnly(false)
        setShowStuckOnly(false)
        setSortBy('recent')
    }

    return (
        <div className="space-y-3 -mt-2">
            {/* Analytics Dashboard */}
            <PipelineAnalytics
                healthScore={analytics.healthScore}
                weeklyProgress={analytics.weeklyProgress}
                publishingVelocity={analytics.publishingVelocity}
                bottleneck={analytics.bottleneck}
                overdueItems={analytics.overdueItems}
                stuckItems={analytics.stuckItems}
                stageDistribution={analytics.stageDistribution}
            />

            {/* Filters Bar */}
            <div className="flex items-center justify-between bg-bg-secondary/50 rounded-xl p-3 border border-border">
                <div className="flex items-center gap-3">
                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-bg-tertiary border-border">
                            <SelectValue placeholder="Content Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="long">
                                <span className="flex items-center gap-2">
                                    <Film className="w-4 h-4" /> Long Videos
                                </span>
                            </SelectItem>
                            <SelectItem value="short">
                                <span className="flex items-center gap-2">
                                    <Video className="w-4 h-4" /> Shorts
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[140px] h-9 bg-bg-tertiary border-border">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="due-date">Due Date</SelectItem>
                            <SelectItem value="stuck">Time in Stage</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* More Filters */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 bg-bg-tertiary border-border">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <Badge variant="secondary" className="ml-2 px-1.5 text-xs">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Quick Filters</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={showOverdueOnly}
                                onCheckedChange={setShowOverdueOnly}
                            >
                                Overdue Only
                                {analytics.overdueItems.length > 0 && (
                                    <Badge variant="destructive" className="ml-auto text-xs">
                                        {analytics.overdueItems.length}
                                    </Badge>
                                )}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={showStuckOnly}
                                onCheckedChange={setShowStuckOnly}
                            >
                                Stuck Items ({'>'}5 days)
                                {analytics.stuckItems.length > 0 && (
                                    <Badge variant="secondary" className="ml-auto text-xs bg-amber-500/10 text-amber-500">
                                        {analytics.stuckItems.length}
                                    </Badge>
                                )}
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-text-muted hover:text-text-primary"
                                onClick={clearFilters}
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* Content Count */}
                <div className="text-sm text-text-muted">
                    <span className="font-medium text-text-primary">{filteredContents.length}</span>
                    {filteredContents.length !== contents.length && (
                        <span> of {contents.length}</span>
                    )}
                    {' '}items
                </div>
            </div>

            {/* Pipeline Board */}
            <PipelineBoard
                contents={filteredContents}
                onEditContent={onEditContent}
                onDeleteContent={onDeleteContent}
                onStatusChange={onStatusChange}
                onAddContent={onAddContent}
                onOpenDetail={onOpenDetail}
            />
        </div>
    )
})

export default ContentPipeline
