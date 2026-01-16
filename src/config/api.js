// Central API configuration
// Easy to change for different environments (dev, staging, production)

const env = import.meta.env.MODE || 'development'

// Configuration by environment
const config = {
  development: {
    JSON_SERVER: 'http://localhost:3001',
    API_SERVER: 'http://localhost:3002'
  },
  staging: {
    JSON_SERVER: 'https://staging-api.example.com/db',
    API_SERVER: 'https://staging-api.example.com'
  },
  production: {
    JSON_SERVER: 'https://api.example.com/db',
    API_SERVER: 'https://api.example.com'
  }
}

const currentConfig = config[env] || config.development

export const JSON_SERVER = currentConfig.JSON_SERVER
export const API_SERVER = currentConfig.API_SERVER

// Common endpoints
export const ENDPOINTS = {
  // Email
  EMAIL_SEND: `${API_SERVER}/api/email/send`,
  EMAIL_TEST: `${API_SERVER}/api/email/test`,

  // CVs
  CV_LIST: `${API_SERVER}/api/cvs`,
  CV_UPLOAD: `${API_SERVER}/api/upload/cv`,
  CV_LINK: `${API_SERVER}/api/cvs/link`,

  // Database collections (JSON Server)
  JOBS: `${JSON_SERVER}/jobs`,
  JOB_TEMPLATES: `${JSON_SERVER}/jobTemplates`,
  JOB_SEARCH_PROMPTS: `${JSON_SERVER}/jobSearchPrompts`,
  JOB_OUTREACH_HISTORY: `${JSON_SERVER}/jobOutreachHistory`,
  CV_FILES: `${JSON_SERVER}/cvFiles`,
  USER_PROFILE: `${JSON_SERVER}/userProfile`,
  EMAIL_SETTINGS: `${JSON_SERVER}/emailSettings`,
  LEADS: `${JSON_SERVER}/leads`,
  MESSAGES: `${JSON_SERVER}/messages`,
  EMAIL_TEMPLATES: `${JSON_SERVER}/emailTemplates`
}

export default {
  JSON_SERVER,
  API_SERVER,
  ENDPOINTS
}
