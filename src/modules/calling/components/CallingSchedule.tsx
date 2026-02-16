import { WeekView } from '../../../components/Calendar/WeekView'
import { CalendarFilters as CalendarFiltersType, CalendarItem } from '../../../hooks/useCalendarItems'

interface CallingScheduleProps {
    contents: any[]
    items?: CalendarItem[]
    calendarFilters?: CalendarFiltersType
    onAddContent?: (date: string) => void
    onEditContent?: (content: any) => void
    onDeleteContent?: (id: string) => void
    onDateChange?: (id: string, date: string) => void
    onItemDateChange?: (item: CalendarItem, date: string) => void
    onOpenDetail?: (content: any) => void
    onItemClick?: (item: CalendarItem) => void
}

export function CallingSchedule({
    contents,
    items = [],
    calendarFilters,
    onAddContent,
    onEditContent,
    onDeleteContent,
    onDateChange,
    onItemDateChange,
    onOpenDetail,
    onItemClick
}: CallingScheduleProps) {
    return (
        <div className="flex-1 overflow-hidden">
            <WeekView
                contents={contents}
                items={items}
                calendarFilters={calendarFilters}
                onAddContent={onAddContent}
                onEditContent={onEditContent}
                onDeleteContent={onDeleteContent}
                onDateChange={onDateChange}
                onItemDateChange={onItemDateChange}
                onOpenDetail={onOpenDetail}
                onItemClick={onItemClick}
            />
        </div>
    )
}

export default CallingSchedule
