import { Mail, Phone, MessageSquare, Linkedin, UserPlus, Edit, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const activityIcons = {
  email_sent: Mail,
  email_received: Mail,
  call: Phone,
  whatsapp: MessageSquare,
  linkedin: Linkedin,
  lead_created: UserPlus,
  lead_updated: Edit,
  status_changed: ArrowRight,
  meeting_scheduled: Calendar,
  won: CheckCircle,
  lost: XCircle
}

const activityColors = {
  email_sent: 'text-blue-400 bg-blue-500/20',
  email_received: 'text-green-400 bg-green-500/20',
  call: 'text-emerald-400 bg-emerald-500/20',
  whatsapp: 'text-green-400 bg-green-500/20',
  linkedin: 'text-indigo-400 bg-indigo-500/20',
  lead_created: 'text-purple-400 bg-purple-500/20',
  lead_updated: 'text-yellow-400 bg-yellow-500/20',
  status_changed: 'text-orange-400 bg-orange-500/20',
  meeting_scheduled: 'text-cyan-400 bg-cyan-500/20',
  won: 'text-green-400 bg-green-500/20',
  lost: 'text-red-400 bg-red-500/20'
}

function ActivityItem({ activity, isLast }) {
  const Icon = activityIcons[activity.type] || Edit
  const colorClass = activityColors[activity.type] || 'text-gray-400 bg-gray-500/20'

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && (
          <div className="w-px h-full bg-white/10 my-1" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <p className="text-sm text-white">
          {activity.description}
        </p>
        {activity.details && (
          <p className="text-xs text-white/50 mt-1">
            {activity.details}
          </p>
        )}
        <span className="text-xs text-white/30 mt-1 block">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}

export function ActivityTimeline({ activities, loading, maxItems = 10 }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-white/10 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-1" />
              <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-6 text-white/40">
        <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <div className="relative">
      {displayedActivities.map((activity, index) => (
        <ActivityItem
          key={activity.id || index}
          activity={activity}
          isLast={index === displayedActivities.length - 1}
        />
      ))}

      {activities.length > maxItems && (
        <p className="text-xs text-white/40 text-center mt-2">
          +{activities.length - maxItems} more activities
        </p>
      )}
    </div>
  )
}

// Helper to generate activity from messages
export function messagesToActivities(messages) {
  return messages.map(msg => ({
    id: msg.id,
    type: msg.type === 'sent' ? `${msg.channel}_sent` : `${msg.channel}_received`,
    description: msg.type === 'sent'
      ? `Sent ${msg.channel} ${msg.subject ? `: "${msg.subject}"` : ''}`
      : `Received ${msg.channel} ${msg.subject ? `: "${msg.subject}"` : ''}`,
    details: msg.body?.substring(0, 100) + (msg.body?.length > 100 ? '...' : ''),
    createdAt: msg.createdAt
  }))
}

export default ActivityTimeline
