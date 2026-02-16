import { CallingCalendarGrid } from './CallingCalendarGrid'
import { CallingScheduleSidebar } from './CallingScheduleSidebar'

export function CallingSchedule() {
    return (
        <div className="flex-1 flex overflow-hidden h-full">
            {/* Left: Calendar Grid (~70%) */}
            <CallingCalendarGrid onAddEvent={() => { }} />

            {/* Right: Sidebar Panel (~30% / 380px) */}
            <CallingScheduleSidebar />
        </div>
    )
}

export default CallingSchedule
