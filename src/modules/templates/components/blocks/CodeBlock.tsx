import { useRef, useEffect, useState } from 'react'

const languages = [
  'javascript', 'typescript', 'python', 'html', 'css',
  'json', 'bash', 'sql', 'markdown', 'plaintext'
]

export function CodeBlock({ block, onChange, onKeyDown, isActive }) {
  const inputRef = useRef<any>(null)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const language = block.language || 'javascript'

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleChange = (e) => {
    onChange({ text: e.target.value })
  }

  const handleKeyDown = (e) => {
    // Allow Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const value = e.target.value
      onChange({ text: value.substring(0, start) + '  ' + value.substring(end) })
      // Move cursor after tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2
      }, 0)
      return
    }

    if (e.key === 'Backspace' && !block.text) {
      e.preventDefault()
      onKeyDown?.('backspace-empty')
    }
  }

  return (
    <div className="relative group bg-bg-primary rounded-lg border border-border overflow-hidden">
      {/* Language selector */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-secondary border-b border-border">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          {language}
        </button>

        {showLangPicker && (
          <div className="absolute left-0 top-full z-10 mt-1 p-1 bg-bg-primary border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => {
                  onChange({ language: lang })
                  setShowLangPicker(false)
                }}
                className={`block w-full text-left px-3 py-1.5 text-xs rounded hover:bg-bg-tertiary ${
                  language === lang ? 'text-blue-400' : 'text-text-secondary'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Code editor */}
      <textarea
        ref={inputRef}
        value={block.text || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="// Write code here..."
        rows={3}
        className="w-full p-3 bg-transparent text-green-300 font-mono text-sm placeholder:text-text-muted resize-none focus:outline-none leading-relaxed"
        spellCheck={false}
      />
    </div>
  )
}

export default CodeBlock
