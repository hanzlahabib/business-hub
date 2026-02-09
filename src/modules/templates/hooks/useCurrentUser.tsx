/**
 * Current User Hook
 *
 * Bridges the templates module with the app's AuthContext.
 * Provides user context, permissions, and helper methods.
 */

import { useCallback, useMemo } from 'react'
import { useAuth } from '../../../hooks/useAuth'

export function useCurrentUser() {
  const { user } = useAuth()

  const currentUser = useMemo(() => {
    if (!user) {
      return {
        id: 'anonymous',
        name: 'Anonymous',
        email: '',
        avatar: null,
        role: 'viewer'
      }
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || 'user'
    }
  }, [user])

  const getUserById = useCallback((userId: string) => {
    if (user && user.id === userId) return currentUser
    return {
      id: userId,
      name: 'Unknown User',
      email: '',
      avatar: null,
      role: 'viewer'
    }
  }, [user, currentUser])

  const getAllUsers = useCallback(() => {
    return [currentUser]
  }, [currentUser])

  // Check if current user can perform action on template
  const canEdit = useCallback((template: any) => {
    if (!template || !currentUser) return false
    if (template.createdBy === currentUser.id) return true
    if (template.permissions?.canEdit?.includes(currentUser.id)) return true
    if (currentUser.role === 'owner' || currentUser.role === 'editor') return true
    return false
  }, [currentUser])

  const canView = useCallback((template: any) => {
    if (!template || !currentUser) return false
    if (template.permissions?.visibility === 'public') return true
    if (template.createdBy === currentUser.id) return true
    if (template.permissions?.canView?.includes(currentUser.id)) return true
    if (template.permissions?.canEdit?.includes(currentUser.id)) return true
    if (template.permissions?.visibility === 'team') return true
    return false
  }, [currentUser])

  const canDelete = useCallback((template: any) => {
    if (!template || !currentUser) return false
    if (template.createdBy === currentUser.id) return true
    if (currentUser.role === 'owner') return true
    return false
  }, [currentUser])

  const canComment = useCallback((template: any) => {
    return canView(template)
  }, [canView])

  return {
    currentUser,
    currentUserId: currentUser.id,
    getUserById,
    getAllUsers,
    canEdit,
    canView,
    canDelete,
    canComment
  }
}

export default useCurrentUser
