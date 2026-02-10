import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  RotateCcw,
  Eye,
  X,
  ChevronRight,
  Clock,
  FileText,
  Edit2,
  Plus,
  ArrowLeftRight
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useTemplateHistory } from '../hooks/useTemplateHistory'

const changeTypeConfig = {
  created: { label: 'Created', color: 'text-green-400', icon: Plus },
  edited: { label: 'Edited', color: 'text-blue-400', icon: Edit2 },
  restored: { label: 'Restored', color: 'text-amber-400', icon: RotateCcw }
}

export function VersionHistory({
  templateId,
  onRestore,
  onClose
}) {
  const {
    history,
    loading,
    fetchHistory,
    restoreVersion,
    getVersion,
    compareVersions
  } = useTemplateHistory(templateId)

  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareSelection, setCompareSelection] = useState<any[]>([])
  const [comparison, setComparison] = useState<any>(null)
  const [previewVersion, setPreviewVersion] = useState<any>(null)

  useEffect(() => {
    if (templateId) {
      fetchHistory(templateId)
    }
  }, [templateId, fetchHistory])

  const handleRestore = async (historyId) => {
    const restored = await restoreVersion(historyId)
    if (restored) {
      onRestore?.(restored)
      await fetchHistory(templateId)
    }
  }

  const handlePreview = async (historyId) => {
    const version = await getVersion(historyId)
    setPreviewVersion(version)
  }

  const handleCompareSelect = (entry) => {
    if (compareSelection.length === 0) {
      setCompareSelection([entry])
    } else if (compareSelection.length === 1) {
      if (compareSelection[0].id === entry.id) {
        setCompareSelection([])
      } else {
        setCompareSelection([...compareSelection, entry])
        // Perform comparison
        const result = compareVersions(compareSelection[0], entry)
        setComparison(result)
      }
    } else {
      // Reset and start new selection
      setCompareSelection([entry])
      setComparison(null)
    }
  }

  const clearCompare = () => {
    setCompareMode(false)
    setCompareSelection([])
    setComparison(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">Version History</h3>
          <span className="text-xs text-text-muted">({history.length} versions)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              compareMode
                ? 'bg-blue-500/20 text-blue-300'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <ArrowLeftRight className="w-3 h-3 inline mr-1" />
            Compare
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Compare Mode Banner */}
      {compareMode && (
        <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-300">
              {compareSelection.length === 0
                ? 'Select first version to compare'
                : compareSelection.length === 1
                  ? 'Select second version to compare'
                  : 'Comparing versions'}
            </span>
            {compareSelection.length > 0 && (
              <button
                onClick={clearCompare}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Version List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-border border-t-text-secondary rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <History className="w-12 h-12 mb-4 opacity-30" />
            <p>No version history</p>
            <p className="text-xs mt-1">Changes will be saved automatically</p>
          </div>
        ) : (
          <div className="p-2">
            {history.map((entry, index) => {
              const config = changeTypeConfig[entry.changeType] || changeTypeConfig.edited
              const TypeIcon = config.icon
              const isSelected = compareSelection.some(s => s.id === entry.id)
              const isFirst = index === 0

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative p-3 mb-2 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-bg-secondary border-border hover:border-border-hover'
                  }`}
                >
                  {/* Timeline connector */}
                  {index < history.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-[calc(100%-24px)] bg-border" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg bg-bg-secondary ${config.color}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          Version {entry.version}
                        </span>
                        {isFirst && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                            Current
                          </span>
                        )}
                        <span className={`text-xs ${config.color}`}>
                          {config.label}
                        </span>
                      </div>

                      <p className="text-sm text-text-secondary mt-0.5 truncate">
                        {entry.changeSummary || entry.name}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true })}
                        </span>
                        <span title={format(new Date(entry.changedAt), 'PPpp')}>
                          {format(new Date(entry.changedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {compareMode ? (
                        <button
                          onClick={() => handleCompareSelect(entry)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handlePreview(entry.id)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                            title="Preview this version"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isFirst && (
                            <button
                              onClick={() => handleRestore(entry.id)}
                              className="p-1.5 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                              title="Restore this version"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Comparison Result */}
      <AnimatePresence>
        {comparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 bg-bg-secondary">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-text-primary">
                  Comparing v{comparison.version1} → v{comparison.version2}
                </h4>
                <button
                  onClick={clearCompare}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Close
                </button>
              </div>

              {comparison.hasChanges ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comparison.changes.map((change, i) => (
                    <div key={i} className="p-2 bg-bg-secondary rounded-lg">
                      <div className="text-xs text-text-muted mb-1 capitalize">
                        {change.field}
                      </div>
                      {change.field === 'content' ? (
                        <div className="text-xs">
                          <span className="text-red-400">Content changed</span>
                          <span className="text-text-muted ml-2">
                            ({(change.from?.length || 0)} → {(change.to?.length || 0)} chars)
                          </span>
                        </div>
                      ) : change.field === 'tags' ? (
                        <div className="flex flex-wrap gap-1">
                          {(change.from || []).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded">
                              -{tag}
                            </span>
                          ))}
                          {(change.to || []).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                              +{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs">
                          <span className="text-red-400 line-through">{change.from || '(empty)'}</span>
                          <ChevronRight className="w-3 h-3 inline mx-1 text-text-muted" />
                          <span className="text-green-400">{change.to || '(empty)'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">No changes detected</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewVersion(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] bg-bg-primary border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    Version {previewVersion.version} Preview
                  </h3>
                  <p className="text-sm text-text-muted">
                    {format(new Date(previewVersion.changedAt), 'PPpp')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleRestore(previewVersion.id)
                      setPreviewVersion(null)
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-sm rounded-lg hover:bg-amber-500/30 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 inline mr-1" />
                    Restore
                  </button>
                  <button
                    onClick={() => setPreviewVersion(null)}
                    className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-text-muted">Name</label>
                    <p className="text-text-primary mt-1">{previewVersion.name}</p>
                  </div>

                  {previewVersion.description && (
                    <div>
                      <label className="text-xs text-text-muted">Description</label>
                      <p className="text-text-secondary mt-1">{previewVersion.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-text-muted">Category</label>
                    <p className="text-text-secondary mt-1 capitalize">{previewVersion.category}</p>
                  </div>

                  {previewVersion.tags?.length > 0 && (
                    <div>
                      <label className="text-xs text-text-muted">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {previewVersion.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-bg-tertiary text-text-secondary text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-text-muted">Content</label>
                    <div className="mt-2 p-4 bg-bg-secondary rounded-lg border border-border">
                      <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
                        {previewVersion.rawMarkdown || '(No content)'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VersionHistory
