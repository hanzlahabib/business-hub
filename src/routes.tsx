import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from './App'

// Module route configuration
// This maps URL paths to activeModule values used internally
export const MODULE_ROUTES: Record<string, string> = {
    '/': 'schedule',
    '/calendar': 'schedule',
    '/list': 'schedule',
    '/content': 'contentstudio',
    '/content/pipeline': 'contentstudio',
    '/content/list': 'contentstudio',
    '/content/table': 'contentstudio',
    '/leads': 'leads',
    '/leads/:leadId': 'leads',
    '/taskboards': 'taskboards',
    '/taskboards/:boardId': 'taskboards',
    '/taskboards/:boardId/task/:taskId': 'taskboards',
    '/jobs': 'jobs',
    '/templates': 'templates',
    '/skills': 'skillmastery',
    '/skills/:pathId': 'skillmastery'
}

// View route to view name mapping for schedule module
export const VIEW_ROUTES: Record<string, string> = {
    '/': 'calendar',
    '/calendar': 'calendar',
    '/list': 'list'
}

// View route to view name mapping for content studio module
export const CONTENT_VIEW_ROUTES: Record<string, string> = {
    '/content': 'pipeline',
    '/content/pipeline': 'pipeline',
    '/content/list': 'list',
    '/content/table': 'table'
}

// Helper to get module from pathname
export function getModuleFromPath(pathname: string): string {
    // Check exact matches first
    if (MODULE_ROUTES[pathname]) {
        return MODULE_ROUTES[pathname]
    }

    // Check pattern matches
    if (pathname.startsWith('/content')) return 'contentstudio'
    if (pathname.startsWith('/leads')) return 'leads'
    if (pathname.startsWith('/taskboards')) return 'taskboards'
    if (pathname.startsWith('/skills')) return 'skillmastery'
    if (pathname === '/jobs') return 'jobs'
    if (pathname === '/templates') return 'templates'

    return 'schedule' // Default
}

// Helper to get view from pathname (for schedule module)
export function getViewFromPath(pathname: string): string {
    if (VIEW_ROUTES[pathname]) {
        return VIEW_ROUTES[pathname]
    }
    return 'calendar' // Default view
}

// Helper to get module route
export function getModuleRoute(module: string): string {
    const routes: Record<string, string> = {
        schedule: '/',
        contentstudio: '/content',
        leads: '/leads',
        taskboards: '/taskboards',
        jobs: '/jobs',
        templates: '/templates',
        skillmastery: '/skills'
    }
    return routes[module] || '/'
}

// Helper to get view route (for schedule module)
export function getViewRoute(view: string): string {
    if (view === 'calendar') return '/'
    return `/${view}`
}

export const router = createBrowserRouter([
    // Calendar Module (clean, unified scheduling)
    {
        path: '/',
        element: <App />
    },
    {
        path: '/calendar',
        element: <App />
    },
    {
        path: '/list',
        element: <App />
    },
    // Content Studio Module (video production)
    {
        path: '/content',
        element: <App />
    },
    {
        path: '/content/pipeline',
        element: <App />
    },
    {
        path: '/content/list',
        element: <App />
    },
    {
        path: '/content/table',
        element: <App />
    },
    // Leads Module
    {
        path: '/leads',
        element: <App />
    },
    {
        path: '/leads/:leadId',
        element: <App />
    },
    // Task Boards Module
    {
        path: '/taskboards',
        element: <App />
    },
    {
        path: '/taskboards/:boardId',
        element: <App />
    },
    {
        path: '/taskboards/:boardId/task/:taskId',
        element: <App />
    },
    // Jobs Module
    {
        path: '/jobs',
        element: <App />
    },
    // Templates Module
    {
        path: '/templates',
        element: <App />
    },
    // Skill Mastery Module
    {
        path: '/skills',
        element: <App />
    },
    {
        path: '/skills/:pathId',
        element: <App />
    },
    // Catch-all for 404 - redirect to home
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
])
