import { memo, useCallback } from 'react'
import { Video, CheckSquare, Briefcase, Users, Target } from 'lucide-react'
import { CalendarFilters as CalendarFiltersType } from '../../hooks/useCalendarItems'

// Filter configuration for calendar/list items
const FILTER_OPTIONS = [
    { key: 'contents', icon: Video, label: 'Content', colorVar: '--color-calendar-content' },
    { key: 'tasks', icon: CheckSquare, label: 'Tasks', colorVar: '--color-calendar-task' },
    { key: 'jobs', icon: Briefcase, label: 'Interviews', colorVar: '--color-calendar-interview' },
    { key: 'leads', icon: Users, label: 'Leads', colorVar: '--color-calendar-lead' },
    { key: 'milestones', icon: Target, label: 'Milestones', colorVar: '--color-calendar-milestone' }
] as const

interface CalendarFiltersProps {
    filters?: CalendarFiltersType
    onChange?: (filters: CalendarFiltersType) => void
}

export const CalendarFilters = memo(function CalendarFilters({
    filters = { contents: true, tasks: false, jobs: false, leads: false, milestones: false },
    onChange
}: CalendarFiltersProps) {
    const handleToggle = useCallback((filterKey: keyof CalendarFiltersType) => {
        if (onChange) {
            onChange({
                ...filters,
                [filterKey]: !filters[filterKey]
            })
        }
    }, [filters, onChange])

    return (
        <div className="flex items-center gap-1 bg-bg-secondary rounded-lg border border-border p-1">
            {FILTER_OPTIONS.map(({ key, icon: Icon, label, colorVar }) => {
                const isActive = filters[key]
                return (
                    <button
                        key={key}
                        onClick={() => handleToggle(key)}
                        title={`${isActive ? 'Hide' : 'Show'} ${label}`}
                        className={`p-2 rounded-md transition-all ${isActive
                                ? 'text-white'
                                : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                            }`}
                        style={isActive ? {
                            backgroundColor: `var(${colorVar})`,
                        } : undefined}
                    >
                        <Icon size={16} />
                    </button>
                )
            })}
        </div>
    )
})

export default CalendarFilters
