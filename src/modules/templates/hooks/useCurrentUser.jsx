/**
 * Current User Hook
 *
 * Provides user context for the templates module.
 * This is a placeholder that can be connected to your auth system.
 *
 * To integrate with your auth:
 * 1. Import your auth context/hook
 * 2. Replace the mock user with actual user data
 * 3. Add login/logout methods if needed
 */

import { useState, useCallback, useMemo, createContext, useContext } from 'react'

// Mock users for development (replace with actual auth)
const MOCK_USERS = {
  'user-1': {
    id: 'user-1',
    name: 'You',
    email: 'you@example.com',
    avatar: null,
    role: 'owner'
  },
  'user-2': {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: null,
    role: 'editor'
  },
  'user-3': {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    avatar: null,
    role: 'viewer'
  }
}

// Create context for user state
const CurrentUserContext = createContext(null)

export function useCurrentUser() {
  // TODO: Replace with actual auth integration
  // Example: const { user } = useAuth()

  const [currentUserId, setCurrentUserId] = useState('user-1')

  const currentUser = useMemo(() => {
    return MOCK_USERS[currentUserId] || MOCK_USERS['user-1']
  }, [currentUserId])

  const getUserById = useCallback((userId) => {
    return MOCK_USERS[userId] || {
      id: userId,
      name: 'Unknown User',
      email: '',
      avatar: null,
      role: 'viewer'
    }
  }, [])

  const getAllUsers = useCallback(() => {
    return Object.values(MOCK_USERS)
  }, [])

  // Check if current user can perform action on template
  const canEdit = useCallback((template) => {
    if (!template || !currentUser) return false

    // Owner can always edit
    if (template.createdBy === currentUser.id) return true

    // Check permissions
    if (template.permissions?.canEdit?.includes(currentUser.id)) return true

    // Check role
    if (currentUser.role === 'owner' || currentUser.role === 'editor') return true

    return false
  }, [currentUser])

  const canView = useCallback((template) => {
    if (!template || !currentUser) return false

    // Public templates can be viewed by anyone
    if (template.permissions?.visibility === 'public') return true

    // Owner can always view
    if (template.createdBy === currentUser.id) return true

    // Check view permissions
    if (template.permissions?.canView?.includes(currentUser.id)) return true
    if (template.permissions?.canEdit?.includes(currentUser.id)) return true

    // Team visibility
    if (template.permissions?.visibility === 'team') return true

    return false
  }, [currentUser])

  const canDelete = useCallback((template) => {
    if (!template || !currentUser) return false

    // Only owner can delete
    if (template.createdBy === currentUser.id) return true
    if (currentUser.role === 'owner') return true

    return false
  }, [currentUser])

  const canComment = useCallback((template) => {
    // Anyone who can view can comment
    return canView(template)
  }, [canView])

  // Switch user (for development/testing)
  const switchUser = useCallback((userId) => {
    if (MOCK_USERS[userId]) {
      setCurrentUserId(userId)
    }
  }, [])

  return {
    currentUser,
    currentUserId: currentUser.id,
    getUserById,
    getAllUsers,
    canEdit,
    canView,
    canDelete,
    canComment,
    switchUser,
    // Expose mock users for dev UI
    mockUsers: MOCK_USERS
  }
}

// Provider component for wrapping app
export function CurrentUserProvider({ children }) {
  const userContext = useCurrentUser()

  return (
    <CurrentUserContext.Provider value={userContext}>
      {children}
    </CurrentUserContext.Provider>
  )
}

// Hook to use context
export function useUserContext() {
  const context = useContext(CurrentUserContext)
  if (!context) {
    // Return default if not wrapped in provider
    return useCurrentUser()
  }
  return context
}

export default useCurrentUser
