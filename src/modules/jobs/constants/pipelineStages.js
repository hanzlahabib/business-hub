export const JOB_STATUSES = [
  { id: 'saved', label: 'Saved', color: '#6B7280', emoji: '📌', gradient: 'from-gray-500 to-slate-600' },
  { id: 'applied', label: 'Applied', color: '#3B82F6', emoji: '📤', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'interview', label: 'Interview', color: '#F59E0B', emoji: '🎯', gradient: 'from-amber-500 to-orange-600' },
  { id: 'offer', label: 'Offer', color: '#10B981', emoji: '🎉', gradient: 'from-green-500 to-emerald-600' },
  { id: 'rejected', label: 'Rejected', color: '#EF4444', emoji: '❌', gradient: 'from-red-500 to-rose-600' },
  { id: 'accepted', label: 'Accepted', color: '#06B6D4', emoji: '✅', gradient: 'from-cyan-500 to-teal-600' }
]

export const JOB_STATUS_MAP = JOB_STATUSES.reduce((acc, status) => {
  acc[status.id] = status
  return acc
}, {})

export const EXPERIENCE_LEVELS = [
  { id: 'junior', label: 'Junior', years: '0-2' },
  { id: 'mid', label: 'Mid-Level', years: '2-5' },
  { id: 'senior', label: 'Senior', years: '5-8' },
  { id: 'lead', label: 'Lead/Staff', years: '8+' },
  { id: 'principal', label: 'Principal', years: '10+' }
]

export const JOB_SOURCES = [
  { id: 'remoteok', name: 'RemoteOK', icon: '🌐' },
  { id: 'weworkremotely', name: 'We Work Remotely', icon: '💼' },
  { id: 'linkedin', name: 'LinkedIn', icon: '🔗' },
  { id: 'wellfound', name: 'Wellfound (AngelList)', icon: '👼' },
  { id: 'ycombinator', name: 'Y Combinator', icon: '🚀' },
  { id: 'direct', name: 'Company Direct', icon: '🏢' },
  { id: 'referral', name: 'Referral', icon: '👥' },
  { id: 'other', name: 'Other', icon: '📋' }
]

export const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
  { id: 'urgent', label: 'Dream Job', color: '#3B82F6' }
]
