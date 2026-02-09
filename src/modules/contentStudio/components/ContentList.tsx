import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Video, Film, Calendar, MoreVertical, Edit, Trash2,
    Eye, Filter, Search, SortAsc, SortDesc
} from 'lucide-react'
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
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Content } from '@/components/Calendar/ContentCard'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    idea: { label: 'Idea', color: 'bg-slate-500/20 text-slate-400' },
    script: { label: 'Script', color: 'bg-blue-500/20 text-blue-400' },
    recording: { label: 'Recording', color: 'bg-amber-500/20 text-amber-400' },
    editing: { label: 'Editing', color: 'bg-purple-500/20 text-purple-400' },
    thumbnail: { label: 'Thumbnail', color: 'bg-orange-500/20 text-orange-400' },
    published: { label: 'Published', color: 'bg-green-500/20 text-green-400' }
}

interface ContentListProps {
    contents: Content[]
    onEdit?: (content: Content) => void
    onDelete?: (id: string) => void
    onOpenDetail?: (content: Content) => void
}

export const ContentList = memo(function ContentList({
    contents,
    onEdit,
    onDelete,
    onOpenDetail
}: ContentListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [sortBy, setSortBy] = useState('created')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

    const filteredContents = useMemo(() => {
        let filtered = [...contents]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(c =>
                c.title?.toLowerCase().includes(query) ||
                c.topic?.toLowerCase().includes(query) ||
                c.hook?.toLowerCase().includes(query)
            )
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter)
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(c => c.type === typeFilter)
        }

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0
            switch (sortBy) {
                case 'created':
                    comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    break
                case 'scheduled':
                    if (!a.scheduledDate) return 1
                    if (!b.scheduledDate) return -1
                    comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
                    break
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '')
                    break
                case 'status':
                    const statusOrder = ['idea', 'script', 'recording', 'editing', 'thumbnail', 'published']
                    comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
                    break
                default:
                    break
            }
            return sortDir === 'asc' ? comparison : -comparison
        })

        return filtered
    }, [contents, searchQuery, statusFilter, typeFilter, sortBy, sortDir])

    const toggleSortDir = () => {
        setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-bg-secondary/50 rounded-xl border border-border">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary text-sm"
                    />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] bg-bg-tertiary border-border">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[130px] bg-bg-tertiary border-border">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="long">Long Videos</SelectItem>
                        <SelectItem value="short">Shorts</SelectItem>
                    </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[130px] bg-bg-tertiary border-border">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="created">Created</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSortDir}
                    className="bg-bg-tertiary border-border"
                >
                    {sortDir === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>

                {/* Results count */}
                <div className="text-sm text-text-muted ml-auto">
                    <span className="font-medium text-text-primary">{filteredContents.length}</span>
                    {filteredContents.length !== contents.length && (
                        <span> of {contents.length}</span>
                    )}
                    {' '}items
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-2">
                {filteredContents.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                        <Filter className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No content matches your filters</p>
                    </div>
                ) : (
                    filteredContents.map((content, index) => {
                        const statusConfig = STATUS_CONFIG[content.status] || STATUS_CONFIG.idea

                        return (
                            <motion.div
                                key={content.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="group flex items-center gap-4 p-4 bg-bg-secondary/50 rounded-xl border border-border hover:border-border-hover hover:bg-bg-secondary transition-all cursor-pointer"
                                onClick={() => onOpenDetail?.(content)}
                            >
                                {/* Type Icon */}
                                <div className={`p-2.5 rounded-lg ${content.type === 'short' ? 'bg-accent-primary/20' : 'bg-accent-secondary/20'}`}>
                                    {content.type === 'short' ? (
                                        <Video className="w-5 h-5 text-accent-primary" />
                                    ) : (
                                        <Film className="w-5 h-5 text-accent-secondary" />
                                    )}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-text-primary truncate">{content.title || 'Untitled'}</h3>
                                        {content.topic && (
                                            <Badge variant="outline" className="text-[10px] shrink-0">
                                                {content.topic}
                                            </Badge>
                                        )}
                                    </div>
                                    {content.hook && (
                                        <p className="text-sm text-text-muted truncate">{content.hook}</p>
                                    )}
                                </div>

                                {/* Status Badge */}
                                <Badge className={`${statusConfig.color} shrink-0`}>
                                    {statusConfig.label}
                                </Badge>

                                {/* Scheduled Date */}
                                {content.scheduledDate && (
                                    <div className="flex items-center gap-1.5 text-sm text-text-muted shrink-0">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(content.scheduledDate)}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation()
                                            onOpenDetail?.(content)
                                        }}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation()
                                            onEdit?.(content)
                                        }}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete?.(content.id)
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
})

export default ContentList
