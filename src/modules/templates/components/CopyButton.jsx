import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, X, ChevronDown } from 'lucide-react'
import { extractVariables, replaceVariables } from './VariableHighlighter'

export function CopyButton({
  content,
  variables = [],
  onCopy,
  size = 'default', // 'small' | 'default' | 'large'
  showLabel = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [variableValues, setVariableValues] = useState({})

  const detectedVars = useMemo(() => {
    return variables.length > 0 ? variables : extractVariables(content)
  }, [content, variables])

  const hasVariables = detectedVars.length > 0

  const handleQuickCopy = async () => {
    const text = replaceVariables(content, variableValues)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyWithVariables = async () => {
    const text = replaceVariables(content, variableValues)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    onCopy?.()
    setShowModal(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVariableChange = (variable, value) => {
    setVariableValues(prev => ({ ...prev, [variable]: value }))
  }

  const sizeClasses = {
    small: 'px-2 py-1 text-xs gap-1',
    default: 'px-3 py-1.5 text-sm gap-2',
    large: 'px-4 py-2 text-base gap-2'
  }

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5'
  }

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        {/* Main copy button */}
        <button
          onClick={hasVariables ? () => setShowModal(true) : handleQuickCopy}
          className={`flex items-center rounded-lg font-medium transition-colors ${sizeClasses[size]} ${
            copied
              ? 'bg-green-500/20 text-green-300'
              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
          }`}
        >
          {copied ? (
            <Check className={iconSizes[size]} />
          ) : (
            <Copy className={iconSizes[size]} />
          )}
          {showLabel && (
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          )}
          {hasVariables && !copied && (
            <ChevronDown className={`${iconSizes[size]} opacity-60`} />
          )}
        </button>
      </div>

      {/* Variable replacement modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-bg-primary border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-text-primary">Fill Variables</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-bg-tertiary rounded transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Variables */}
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {detectedVars.map(variable => (
                  <div key={variable}>
                    <label className="block text-xs text-text-muted mb-1 font-mono">
                      {`{{${variable}}}`}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Enter ${variable}...`}
                      className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover"
                    />
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="p-4 bg-bg-secondary border-t border-border">
                <div className="text-xs text-text-muted mb-2">Preview:</div>
                <div className="p-3 bg-black/20 rounded-lg max-h-32 overflow-y-auto">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap font-sans">
                    {replaceVariables(content, variableValues).slice(0, 300)}
                    {content.length > 300 && '...'}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickCopy}
                  className="px-4 py-2 text-sm bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80 rounded-lg transition-colors"
                >
                  Copy Raw
                </button>
                <button
                  onClick={handleCopyWithVariables}
                  className="px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Copy with Values
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CopyButton
