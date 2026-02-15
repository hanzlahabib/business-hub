// Central API configuration
// Easy to change for different environments (dev, staging, production)

const env = import.meta.env.MODE || 'development'

// Configuration by environment
const config = {
  development: {
    JSON_SERVER: 'http://localhost:3005',
    API_SERVER: 'http://localhost:3002',
    WS_SERVER: 'ws://localhost:3002'
  },
  staging: {
    JSON_SERVER: 'https://staging-api.example.com/db',
    API_SERVER: 'https://staging-api.example.com',
    WS_SERVER: 'wss://staging-api.example.com'
  },
  production: {
    JSON_SERVER: 'https://brain.hanzla.com/api/db',
    API_SERVER: 'https://brain.hanzla.com',
    WS_SERVER: 'wss://brain.hanzla.com:3004'
  }
}

const currentConfig = config[env] || config.development

export const JSON_SERVER = currentConfig.JSON_SERVER
export const API_SERVER = currentConfig.API_SERVER
export const WS_SERVER = currentConfig.WS_SERVER

// Common endpoints
export const ENDPOINTS = {
  // Email
  EMAIL_SEND: `${API_SERVER}/api/email/send`,
  EMAIL_TEST: `${API_SERVER}/api/email/test`,

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
  CV_FILES: `${API_SERVER}/api/resources/cvfiles`,
  USER_PROFILE: `${API_SERVER}/api/auth/profile`,
  EMAIL_SETTINGS: `${API_SERVER}/api/resources/emailsettings`,
  SETTINGS: `${API_SERVER}/api/resources/settings`,
  LEADS: `${API_SERVER}/api/leads`,
  CONTENTS: `${API_SERVER}/api/contents`,
  MESSAGES: `${API_SERVER}/api/messages`,
  EMAIL_TEMPLATES: `${API_SERVER}/api/resources/emailtemplates`,

  // Templates Module
  TEMPLATES: `${API_SERVER}/api/resources/templates`,
  TEMPLATE_FOLDERS: `${API_SERVER}/api/resources/templatefolders`,
  TEMPLATE_HISTORY: `${API_SERVER}/api/resources/templatehistory`,
  TEMPLATE_COMMENTS: `${API_SERVER}/api/resources/templatecomments`,

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
  AGENTS_FLOW_CONFIG: `${API_SERVER}/api/agents/flow-config`
}

export default {
  API_SERVER,
  WS_SERVER,
  ENDPOINTS
}

