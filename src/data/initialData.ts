// Initial data with your published videos and upcoming plans
export const initialScheduleData = {
  contents: [
    // ========== PUBLISHED VIDEOS ==========
    {
      id: 'pub-1',
      type: 'long',
      title: 'Master React Optimization with These Simple Tips',
      topic: 'Performance',
      status: 'published',
      scheduledDate: '2025-12-23',
      publishedDate: '2025-12-23T00:00:00Z',
      sourceVideoId: null,
      hook: '',
      notes: 'First optimization video - 38 views',
      createdAt: '2025-12-23T00:00:00Z'
    },
    {
      id: 'pub-2',
      type: 'long',
      title: 'When NOT to Use useMemo & useCallback (Most React Devs Get This Wrong)',
      topic: 'Performance',
      status: 'published',
      scheduledDate: '2025-12-24',
      publishedDate: '2025-12-24T00:00:00Z',
      sourceVideoId: null,
      hook: '',
      notes: '147% retention - people rewatching! 30 views',
      createdAt: '2025-12-24T00:00:00Z'
    },
    {
      id: 'pub-3',
      type: 'long',
      title: 'Stop Using React memo Wrong',
      topic: 'Performance',
      status: 'published',
      scheduledDate: '2025-12-25',
      publishedDate: '2025-12-25T00:00:00Z',
      sourceVideoId: null,
      hook: '',
      notes: '18 views - 34% retention',
      createdAt: '2025-12-25T00:00:00Z'
    },
    {
      id: 'pub-4',
      type: 'long',
      title: 'STOP Using useEffect Like This! 5 Mistakes (Hindi)',
      topic: 'React Hooks',
      status: 'published',
      scheduledDate: '2025-12-27',
      publishedDate: '2025-12-27T00:00:00Z',
      sourceVideoId: null,
      hook: '',
      notes: 'useEffect bugs lecture - CTR 1.7% needs better thumbnail',
      createdAt: '2025-12-27T00:00:00Z'
    },

    // ========== SHORTS FROM EXISTING VIDEOS ==========
    {
      id: 'short-1',
      type: 'short',
      title: 'Infinite loop fix in 10 seconds',
      topic: 'React Hooks',
      status: 'idea',
      scheduledDate: '2025-12-30',
      publishedDate: null,
      sourceVideoId: 'pub-4',
      hook: 'Your useEffect is crashing? Here\'s why...',
      notes: 'Clip from useEffect 5 Mistakes video',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-2',
      type: 'short',
      title: 'useEffect cleanup one-liner',
      topic: 'React Hooks',
      status: 'idea',
      scheduledDate: '2025-12-30',
      publishedDate: null,
      sourceVideoId: 'pub-4',
      hook: 'Memory leak fix in 1 line of code',
      notes: 'Clip from useEffect 5 Mistakes video',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-3',
      type: 'short',
      title: 'useState vs useRef - Interview answer',
      topic: 'Interview Prep',
      status: 'idea',
      scheduledDate: '2025-12-31',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'Google asked me this React question',
      notes: 'Original short for interview series',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-4',
      type: 'short',
      title: 'React.memo - When NOT to use',
      topic: 'Performance',
      status: 'idea',
      scheduledDate: '2025-12-31',
      publishedDate: null,
      sourceVideoId: 'pub-3',
      hook: 'Stop wasting performance with React.memo',
      notes: 'Clip from React memo video',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-5',
      type: 'short',
      title: 'This code has 2 bugs - can you spot them?',
      topic: 'React Hooks',
      status: 'idea',
      scheduledDate: '2026-01-01',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'Challenge: Find the bugs!',
      notes: 'Engagement short - quiz format',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-6',
      type: 'short',
      title: 'React 19 killed this hook',
      topic: 'React 19',
      status: 'idea',
      scheduledDate: '2026-01-01',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'useEffect is dead in React 19?',
      notes: 'Teaser for React 19 content',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-7',
      type: 'short',
      title: 'Junior vs Senior: useEffect edition',
      topic: 'React Hooks',
      status: 'idea',
      scheduledDate: '2026-01-02',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'POV: Your senior reviews your useEffect',
      notes: 'Comparison format - popular style',
      createdAt: '2025-12-29T00:00:00Z'
    },

    // ========== UPCOMING LONG VIDEOS ==========
    {
      id: 'upcoming-1',
      type: 'long',
      title: 'React Interview: Top 5 Questions They Always Ask',
      topic: 'Interview Prep',
      status: 'script',
      scheduledDate: '2026-01-02',
      publishedDate: null,
      sourceVideoId: null,
      hook: '',
      notes: 'Part 1 of Interview Series - 5 basic questions',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'upcoming-2',
      type: 'long',
      title: 'React 19: 5 Features That Change Everything',
      topic: 'React 19',
      status: 'idea',
      scheduledDate: '2026-01-06',
      publishedDate: null,
      sourceVideoId: null,
      hook: '',
      notes: 'use() hook, Server Components, Actions, useOptimistic, Compiler',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'upcoming-3',
      type: 'long',
      title: 'Virtual DOM Explained in 10 Minutes (Hindi)',
      topic: 'React Basics',
      status: 'idea',
      scheduledDate: '2026-01-09',
      publishedDate: null,
      sourceVideoId: null,
      hook: '',
      notes: 'Interview question + deep explanation',
      createdAt: '2025-12-29T00:00:00Z'
    },

    // ========== WEEK 2 SHORTS ==========
    {
      id: 'short-w2-1',
      type: 'short',
      title: 'useCallback vs useMemo - 30 sec explanation',
      topic: 'Performance',
      status: 'idea',
      scheduledDate: '2026-01-03',
      publishedDate: null,
      sourceVideoId: 'pub-2',
      hook: 'Stop confusing these two hooks',
      notes: 'Clip from useMemo/useCallback video',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-w2-2',
      type: 'short',
      title: 'Array index as key - Why it\'s BAD',
      topic: 'React Basics',
      status: 'idea',
      scheduledDate: '2026-01-03',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'This mistake breaks your React app',
      notes: 'Common interview question',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-w2-3',
      type: 'short',
      title: 'Controlled vs Uncontrolled - Quick Answer',
      topic: 'Interview Prep',
      status: 'idea',
      scheduledDate: '2026-01-04',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'Interview question in 30 seconds',
      notes: 'Forms interview question',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-w2-4',
      type: 'short',
      title: 'use() hook in React 19 - Mind blown',
      topic: 'React 19',
      status: 'idea',
      scheduledDate: '2026-01-05',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'useEffect is officially replaced',
      notes: 'Teaser for React 19 video',
      createdAt: '2025-12-29T00:00:00Z'
    },
    {
      id: 'short-w2-5',
      type: 'short',
      title: 'Context API pitfall everyone misses',
      topic: 'React Hooks',
      status: 'idea',
      scheduledDate: '2026-01-05',
      publishedDate: null,
      sourceVideoId: null,
      hook: 'Your Context is re-rendering everything',
      notes: 'Performance tip',
      createdAt: '2025-12-29T00:00:00Z'
    }
  ],
  settings: {
    weeklyGoals: {
      long: 2,
      shorts: 5
    }
  }
}
