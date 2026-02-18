/**
 * Template API Service Layer
 *
 * This abstraction layer makes the templates module database-agnostic.
 * Current implementation: Express API with Prisma/PostgreSQL
 */

import { ENDPOINTS } from '../../../config/api'
import { getAuthHeaders, getJsonAuthHeaders } from '../../../utils/authHeaders'

// ============================================
// TEMPLATES
// ============================================

export const templateApi = {
  // Fetch all templates with optional query params
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${ENDPOINTS.TEMPLATES}?${query}` : ENDPOINTS.TEMPLATES
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Failed to fetch templates')
    return response.json()
  },

  // Fetch single template by ID
  async getById(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATES}/${id}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Template not found')
    return response.json()
  },

  // Create new template
  async create(data) {
    const response = await fetch(ENDPOINTS.TEMPLATES, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        ...data,
        id: data.id || `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        version: 1
      })
    })
    if (!response.ok) throw new Error('Failed to create template')
    return response.json()
  },

  // Update template (partial update)
  async update(id, data) {
    const response = await fetch(`${ENDPOINTS.TEMPLATES}/${id}`, {
      method: 'PATCH',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
      })
    })
    if (!response.ok) throw new Error('Failed to update template')
    return response.json()
  },

  // Delete template
  async delete(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATES}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete template')
    return true
  },

  // Search templates
  async search(query, filters = {}) {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })
    const response = await fetch(`${ENDPOINTS.TEMPLATES}?${params}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Search failed')
    return response.json()
  }
}

// ============================================
// TEMPLATE FOLDERS
// ============================================

export const folderApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString()
    const url = query ? `${ENDPOINTS.TEMPLATE_FOLDERS}?${query}` : ENDPOINTS.TEMPLATE_FOLDERS
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Failed to fetch folders')
    return response.json()
  },

  async getById(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_FOLDERS}/${id}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Folder not found')
    return response.json()
  },

  async create(data) {
    const response = await fetch(ENDPOINTS.TEMPLATE_FOLDERS, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        ...data,
        id: data.id || `folder-${Date.now()}`,
        createdAt: new Date().toISOString()
      })
    })
    if (!response.ok) throw new Error('Failed to create folder')
    return response.json()
  },

  async update(id, data) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_FOLDERS}/${id}`, {
      method: 'PATCH',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update folder')
    return response.json()
  },

  async delete(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_FOLDERS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete folder')
    return true
  }
}

// ============================================
// TEMPLATE HISTORY (Version Control)
// ============================================

export const historyApi = {
  async getByTemplateId(templateId, params = {}) {
    const query = new URLSearchParams({
      templateId,
      _sort: 'version',
      _order: 'desc',
      ...params
    }).toString()
    const response = await fetch(`${ENDPOINTS.TEMPLATE_HISTORY}?${query}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Failed to fetch history')
    return response.json()
  },

  async getById(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_HISTORY}/${id}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Version not found')
    return response.json()
  },

  async create(data) {
    const response = await fetch(ENDPOINTS.TEMPLATE_HISTORY, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        ...data,
        id: data.id || `history-${Date.now()}`,
        changedAt: new Date().toISOString()
      })
    })
    if (!response.ok) throw new Error('Failed to save version')
    return response.json()
  },

  async delete(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_HISTORY}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete version')
    return true
  },

  async getLatestVersion(templateId) {
    const history = await this.getByTemplateId(templateId, { _limit: 1 })
    return history.length > 0 ? history[0].version : 0
  }
}

// ============================================
// TEMPLATE COMMENTS (Phase 5 - Collaboration)
// ============================================

export const commentApi = {
  async getByTemplateId(templateId, params = {}) {
    const query = new URLSearchParams({
      templateId,
      _sort: 'createdAt',
      _order: 'desc',
      ...params
    }).toString()
    const response = await fetch(`${ENDPOINTS.TEMPLATE_COMMENTS}?${query}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Failed to fetch comments')
    return response.json()
  },

  async getByBlockId(templateId, blockId) {
    const query = new URLSearchParams({ templateId, blockId }).toString()
    const response = await fetch(`${ENDPOINTS.TEMPLATE_COMMENTS}?${query}`, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error('Failed to fetch block comments')
    return response.json()
  },

  async create(data) {
    const response = await fetch(ENDPOINTS.TEMPLATE_COMMENTS, {
      method: 'POST',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify({
        ...data,
        id: data.id || `comment-${Date.now()}`,
        resolved: false,
        createdAt: new Date().toISOString()
      })
    })
    if (!response.ok) throw new Error('Failed to create comment')
    return response.json()
  },

  async update(id, data) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_COMMENTS}/${id}`, {
      method: 'PATCH',
      headers: getJsonAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update comment')
    return response.json()
  },

  async delete(id) {
    const response = await fetch(`${ENDPOINTS.TEMPLATE_COMMENTS}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete comment')
    return true
  },

  async resolve(id) {
    return this.update(id, { resolved: true })
  }
}

// ============================================
// DEFAULT EXPORT - All APIs
// ============================================

export default {
  templates: templateApi,
  folders: folderApi,
  history: historyApi,
  comments: commentApi
}
