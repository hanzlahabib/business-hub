// Central API configuration
// Uses VITE_ env vars for production, falls back to localhost for dev

const env = import.meta.env.MODE || 'development'

const isDev = env === 'development'

export const API_SERVER = import.meta.env.VITE_API_SERVER || (isDev ? 'http://localhost:3002' : '')
export const WS_SERVER = import.meta.env.VITE_WS_SERVER || (isDev ? 'ws://localhost:3002' : '')

// Common endpoints
export const ENDPOINTS = {
  // Email
  EMAIL_SEND: `${API_SERVER}/api/email/send`,
  EMAIL_TEST: `${API_SERVER}/api/email/test`,
  EMAIL_SEND_BULK: `${API_SERVER}/api/email/send-bulk`,

  // CVs
  CV_LIST: `${API_SERVER}/api/cvs`,
  CV_UPLOAD: `${API_SERVER}/api/upload/cv`,
  CV_LINK: `${API_SERVER}/api/cvs/link`,
  FILE_SEARCH: `${API_SERVER}/api/file/search`,
  FILE_READ: `${API_SERVER}/api/file/read`,

  // Database collections (Now using Prisma/Postgres via API_SERVER)
  JOBS: `${API_SERVER}/api/jobs`,
  JOB_TEMPLATES: `${API_SERVER}/api/resources/jobtemplates`,
  JOB_SEARCH_PROMPTS: `${API_SERVER}/api/resources/jobsearchprompts`,
  JOB_OUTREACH_HISTORY: `${API_SERVER}/api/resources/joboutreachhistory`,
  USER_PROFILE: `${API_SERVER}/api/auth/profile`,
  EMAIL_SETTINGS: `${API_SERVER}/api/resources/emailsettings`,
  SETTINGS: `${API_SERVER}/api/resources/settings`,
  LEADS: `${API_SERVER}/api/leads`,
  LEADS_BULK: `${API_SERVER}/api/leads/bulk`,
  CONTENTS: `${API_SERVER}/api/contents`,
  MESSAGES: `${API_SERVER}/api/messages`,
  EMAIL_TEMPLATES: `${API_SERVER}/api/resources/emailtemplates`,

  // Templates Module
  TEMPLATES: `${API_SERVER}/api/resources/templates`,
  TEMPLATE_FOLDERS: `${API_SERVER}/api/resources/templatefolders`,
  TEMPLATE_HISTORY: `${API_SERVER}/api/resources/templatehistory`,
  TEMPLATE_COMMENTS: `${API_SERVER}/api/resources/templatecomments`,

  // Task Boards
  TASKBOARDS: `${API_SERVER}/api/resources/taskboards`,
  TASKS: `${API_SERVER}/api/resources/tasks`,

  // Skill Mastery
  SKILL_MASTERY: `${API_SERVER}/api/skillmastery`,

  // Outreach Campaigns
  CAMPAIGNS: `${API_SERVER}/api/campaigns`,

  // Automation Engine
  NOTIFICATIONS: `${API_SERVER}/api/notifications`,
  NOTIFICATIONS_COUNT: `${API_SERVER}/api/notifications/count`,
  NOTIFICATIONS_READ_ALL: `${API_SERVER}/api/notifications/read-all`,
  DASHBOARD: `${API_SERVER}/api/dashboard`,
  DASHBOARD_TRENDS: `${API_SERVER}/api/dashboard/trends`,
  LEAD_ACTIVITY: (leadId: string) => `${API_SERVER}/api/leads/${leadId}/activity`,
  AUTOMATION_RULES: `${API_SERVER}/api/automation/rules`,

  // Lead Types
  LEAD_TYPES: `${API_SERVER}/api/lead-types`,

  // AI Calling System
  CALLS: `${API_SERVER}/api/calls`,
  CALL_STATS: `${API_SERVER}/api/calls/stats`,
  CALL_PROVIDERS: `${API_SERVER}/api/calls/providers`,
  CALL_SCRIPTS: `${API_SERVER}/api/calls/scripts`,
  CALL_SCRIPTS_LIST: `${API_SERVER}/api/calls/scripts/list`,
  CALL_SCRIPTS_GENERATE: `${API_SERVER}/api/calls/scripts/generate`,
  CALL_WEBHOOK: `${API_SERVER}/api/calls/webhook`,
  CALL_ACTIVITY: `${API_SERVER}/api/calls/activity`,
  CALL_PROVIDER_HEALTH: `${API_SERVER}/api/calls/provider-health`,
  AGENTS: `${API_SERVER}/api/agents`,
  AGENTS_FLOW_CONFIG: `${API_SERVER}/api/agents/flow-config`,

  // DNC (Do Not Call) Registry
  DNC_LIST: `${API_SERVER}/api/campaigns/dnc/list`,
  DNC_ADD: `${API_SERVER}/api/campaigns/dnc/add`,
  DNC_REMOVE: `${API_SERVER}/api/campaigns/dnc/remove`,

  // Lead Enrichment
  LEAD_ENRICH: (leadId: string) => `${API_SERVER}/api/scraper/enrich/${leadId}`,

  // Intelligence
  INTELLIGENCE_LEAD: (leadId: string) => `${API_SERVER}/api/intelligence/lead/${leadId}`,
  INTELLIGENCE_ANALYZE: (leadId: string) => `${API_SERVER}/api/intelligence/analyze/${leadId}`,
  INTELLIGENCE_INSIGHTS: `${API_SERVER}/api/intelligence/insights`,
  INTELLIGENCE_LEADERBOARD: `${API_SERVER}/api/intelligence/leaderboard`,

  // Proposals
  PROPOSALS: `${API_SERVER}/api/proposals`,
  PROPOSAL_GENERATE: (leadId: string) => `${API_SERVER}/api/proposals/generate/${leadId}`
}

export default {
  API_SERVER,
  WS_SERVER,
  ENDPOINTS
}

