import { useState, useEffect, useCallback, memo } from 'react'
import { Modal, Button } from '../UI'
import { Video, Smartphone, Tag, Plus, X, Target } from 'lucide-react'

const DEFAULT_TOPICS = ['React Hooks', 'React 19', 'Performance', 'Interview Prep', 'JavaScript', 'React Basics', 'Other']

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave
}) {
  const [goalsEnabled, setGoalsEnabled] = useState(true)
  const [longGoal, setLongGoal] = useState(2)
  const [shortsGoal, setShortsGoal] = useState(5)
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [newTopic, setNewTopic] = useState('')

  useEffect(() => {
    if (isOpen && settings) {
      setGoalsEnabled(settings.goalsEnabled !== false)
      setLongGoal(settings.weeklyGoals?.long || 2)
      setShortsGoal(settings.weeklyGoals?.shorts || 5)
      setTopics(settings.topics || DEFAULT_TOPICS)
    }
  }, [isOpen, settings])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onSave({
      goalsEnabled,
      weeklyGoals: {
        long: parseInt(longGoal) || 2,
        shorts: parseInt(shortsGoal) || 5
      },
      topics
    })
    onClose()
  }, [goalsEnabled, longGoal, shortsGoal, topics, onSave, onClose])

  const handleAddTopic = useCallback(() => {
    const trimmed = newTopic.trim()
    if (trimmed && !topics.includes(trimmed)) {
      setTopics(prev => [...prev, trimmed])
      setNewTopic('')
    }
  }, [newTopic, topics])

  const handleRemoveTopic = useCallback((topicToRemove) => {
    setTopics(prev => prev.filter(t => t !== topicToRemove))
  }, [])

  const handleLongChange = useCallback((e) => {
    setLongGoal(e.target.value)
  }, [])

  const handleShortsChange = useCallback((e) => {
    setShortsGoal(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTopic()
    }
  }, [handleAddTopic])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Weekly Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Target size={16} className="text-accent-primary" />
              Weekly Goals
            </h3>
            <button
              type="button"
              onClick={() => setGoalsEnabled(prev => !prev)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                goalsEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary border border-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  goalsEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {goalsEnabled ? (
            <>
              <p className="text-xs text-text-muted mb-3">
                Set your weekly content goals to track progress.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
                    <Video size={16} className="text-accent-secondary" />
                    Long Videos per Week
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="14"
                    value={longGoal}
                    onChange={handleLongChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-primary font-semibold focus:outline-none focus:border-accent-secondary"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted mb-2">
                    <Smartphone size={16} className="text-accent-primary" />
                    Shorts per Week
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={shortsGoal}
                    onChange={handleShortsChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-tertiary border border-border text-text-primary font-semibold focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted py-2">
              Goals tracking is disabled. Enable to set weekly targets.
            </p>
          )}
        </div>

        {/* Topics Section */}
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Tag size={16} className="text-accent-primary" />
            Content Topics
          </h3>
          <p className="text-xs text-text-muted mb-3">
            Manage topics for categorizing your content.
          </p>

          {/* Topic Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {topics.map(topic => (
              <span
                key={topic}
                className="px-2.5 py-1 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary flex items-center gap-1.5 group"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="p-0.5 rounded hover:bg-accent-danger/20 text-text-muted hover:text-accent-danger transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Add New Topic */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add new topic..."
              className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={!newTopic.trim()}
              className="px-3 py-2 rounded-lg bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Save Settings
          </Button>
        </div>
      </form>
    </Modal>
  )
})
