/**
 * Template Comments Hook
 *
 * Provides comment functionality for templates with block-level targeting.
 * Comments can be attached to specific blocks or to the template as a whole.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { commentApi } from '../services/templateApi'
import { useAuth } from '../../../hooks/useAuth'

export function useTemplateComments(templateId = null) {
  const { user } = useAuth()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all comments for a template
  const fetchComments = useCallback(async (id = templateId) => {
    if (!id) return []

    setLoading(true)
    setError(null)

    try {
      const data = await commentApi.getByTemplateId(id)
      setComments(data)
      return data
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [templateId])

  // Create a new comment
  const createComment = useCallback(async ({
    text,
    blockId = null,
    parentId = null,
    userId = user?.id || 'anonymous'
  }) => {
    if (!templateId || !text?.trim()) return null

    setLoading(true)
    setError(null)

    try {
      const newComment = {
        templateId,
        blockId,
        parentId, // For threaded replies
        userId,
        text: text.trim(),
        resolved: false,
        reactions: [],
        mentions: extractMentions(text)
      }

      const data = await commentApi.create(newComment)
      setComments(prev => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [templateId])

  // Update a comment
  const updateComment = useCallback(async (commentId, updates) => {
    setLoading(true)
    setError(null)

    try {
      const data = await commentApi.update(commentId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setComments(prev => prev.map(c => c.id === commentId ? data : c))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete a comment
  const deleteComment = useCallback(async (commentId) => {
    setLoading(true)
    setError(null)

    try {
      await commentApi.delete(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Resolve/unresolve a comment thread
  const toggleResolved = useCallback(async (commentId) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return null

    return updateComment(commentId, { resolved: !comment.resolved })
  }, [comments, updateComment])

  // Add reaction to comment
  const addReaction = useCallback(async (commentId, emoji, reactionUserId = user?.id || 'anonymous') => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return null

    const reactions = comment.reactions || []
    const existingIndex = reactions.findIndex(
      r => r.emoji === emoji && r.userId === reactionUserId
    )

    let newReactions
    if (existingIndex >= 0) {
      // Remove reaction if already exists
      newReactions = reactions.filter((_, i) => i !== existingIndex)
    } else {
      // Add new reaction
      newReactions = [...reactions, { emoji, userId: reactionUserId, createdAt: new Date().toISOString() }]
    }

    return updateComment(commentId, { reactions: newReactions })
  }, [comments, updateComment, user])

  // Get comments for a specific block
  const getBlockComments = useCallback((blockId) => {
    return comments
      .filter(c => c.blockId === blockId && !c.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [comments])

  // Get replies to a comment
  const getReplies = useCallback((parentId) => {
    return comments
      .filter(c => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [comments])

  // Get template-level comments (not attached to blocks)
  const getTemplateComments = useCallback(() => {
    return comments
      .filter(c => !c.blockId && !c.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [comments])

  // Get unresolved comments count
  const unresolvedCount = useMemo(() => {
    return comments.filter(c => !c.resolved && !c.parentId).length
  }, [comments])

  // Get blocks that have comments
  const blocksWithComments = useMemo(() => {
    const blockIds = new Set()
    comments.forEach(c => {
      if (c.blockId) blockIds.add(c.blockId)
    })
    return blockIds
  }, [comments])

  // Check if block has unresolved comments
  const hasUnresolvedComments = useCallback((blockId) => {
    return comments.some(c => c.blockId === blockId && !c.resolved && !c.parentId)
  }, [comments])

  // Get comment count for block
  const getBlockCommentCount = useCallback((blockId) => {
    return comments.filter(c => c.blockId === blockId && !c.parentId).length
  }, [comments])

  // Auto-fetch on mount if templateId provided
  useEffect(() => {
    if (templateId) {
      fetchComments()
    }
  }, [templateId, fetchComments])

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    toggleResolved,
    addReaction,
    getBlockComments,
    getReplies,
    getTemplateComments,
    unresolvedCount,
    blocksWithComments,
    hasUnresolvedComments,
    getBlockCommentCount
  }
}

// Helper to extract @mentions from text
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g
  const matches = text.match(mentionRegex) || []
  return matches.map(m => m.slice(1)) // Remove @ symbol
}

export default useTemplateComments
