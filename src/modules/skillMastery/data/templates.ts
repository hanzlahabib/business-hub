export const SKILL_TEMPLATES = [
    {
        id: 'blank',
        name: 'Empty Seed',
        description: 'Start with a blank slate. Add your own habits and milestones as you grow.',
        icon: '🌱',
        habits: [],
        milestones: []
    },
    {
        id: 'brain-mastery',
        name: 'Brain Mastery (90 Days)',
        description: 'Master your mind and life with this neuroscience-based transformation plan.',
        icon: '🧠',
        habits: [
            { id: 'h1', name: 'Fajr Prayer + Quran', icon: '🕌', frequency: 'daily' },
            { id: 'h2', name: '3 M\'s Morning Routine', icon: '🧘', frequency: 'daily' },
            { id: 'h3', name: 'Brain Dump Journaling', icon: '📝', frequency: 'daily' },
            { id: 'h4', name: 'One High-Leverage Action', icon: '🚀', frequency: 'daily' },
            { id: 'h5', name: 'Gratitude to Allah', icon: '🤲', frequency: 'daily' },
            { id: 'h6', name: 'No Cheap Dopamine > 8PM', icon: '🚫', frequency: 'daily' },
            { id: 'h7', name: 'Evening Reflection', icon: '🌙', frequency: 'daily' },
            { id: 'h8', name: 'Quality Sleep (7-9h)', icon: '😴', frequency: 'daily' }
        ],
        milestones: [
            { id: 'm1', title: 'Phase 1: Foundation (Days 1-30)', completed: false },
            { id: 'm2', title: 'Phase 2: Manifestation (Days 31-60)', completed: false },
            { id: 'm3', title: 'Phase 3: Mastery (Days 61-90)', completed: false }
        ]
    }
]
