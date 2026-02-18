
import { useMemo } from 'react'

export function VariableHighlighter({ text, variables = [], className = '' }: any) {
  const highlightedContent = useMemo(() => {
    if (!text) return null

    // Split text by variable patterns
    const parts = text.split(/(\{\{[\w]+\}\})/g)

    return parts.map((part, index) => {
      const match = part.match(/\{\{([\w]+)\}\}/)
      if (match) {
        const varName = match[1]
        const isKnownVar = variables.includes(varName)
        return (
          <span
            key={index}
            className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono ${
              isKnownVar
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
            }`}
            title={isKnownVar ? `Variable: ${varName}` : `Unknown variable: ${varName}`}
          >
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }, [text, variables])

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {highlightedContent}
    </div>
  )
}

// Utility to extract variables from text
export function extractVariables(text) {
  if (!text) return []
  const regex = /\{\{(\w+)\}\}/g
  const matches = text.match(regex) || []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

// Utility to replace variables in text
export function replaceVariables(text, values = {}) {
  if (!text) return ''
  let result = text
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`)
  })
  return result
}

export default VariableHighlighter
