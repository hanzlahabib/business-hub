import { Mail, Phone, MessageSquare, Linkedin, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { format } from 'date-fns'

const channelIcons = {
  email: Mail,
  call: Phone,
  whatsapp: MessageSquare,
  linkedin: Linkedin
}

const channelColors = {
  email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  call: 'bg-green-500/10 text-green-400 border-green-500/20',
  whatsapp: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  linkedin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
}

function MessageCard({ message }) {
  const Icon = channelIcons[message.channel] || Mail
  const colorClass = channelColors[message.channel] || channelColors.email
  const isSent = message.type === 'sent'

  return (
    <div className={`relative border rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${isSent ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
          {isSent ? (
            <ArrowUpRight className="w-4 h-4 text-blue-400" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-green-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4 opacity-60" />
            <span className="text-xs uppercase tracking-wider opacity-60">
              {message.channel}
            </span>
            <span className="text-xs opacity-40">
              {isSent ? 'Sent' : 'Received'}
            </span>
          </div>

          {message.subject && (
            <h4 className="font-medium text-white mb-1 truncate">
              {message.subject}
            </h4>
          )}

          <p className="text-sm opacity-80 line-clamp-3 whitespace-pre-wrap">
            {message.body}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs opacity-50">
            <span>
              {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
            {message.status && (
              <span className={`px-2 py-0.5 rounded-full ${
                message.status === 'sent' ? 'bg-blue-500/20 text-blue-300' :
                message.status === 'delivered' ? 'bg-green-500/20 text-green-300' :
                message.status === 'opened' ? 'bg-purple-500/20 text-purple-300' :
                message.status === 'replied' ? 'bg-yellow-500/20 text-yellow-300' :
                message.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                'bg-gray-500/20 text-gray-300'
              }`}>
                {message.status}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function MessageThread({ messages, loading, emptyMessage = 'No messages yet' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse border border-white/10 rounded-lg p-4">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-3/4 mb-1" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map(message => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  )
}

export default MessageThread
