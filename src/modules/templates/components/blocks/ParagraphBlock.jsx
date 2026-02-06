import { useRef, useEffect } from 'react'

export function ParagraphBlock({ block, onChange, onKeyDown, isActive }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleChange = (e) => {
    onChange({ text: e.target.value })
  }

  const handleKeyDown = (e) => {
    // Handle Enter to create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onKeyDown?.('enter')
    }
    // Handle Backspace on empty block
    if (e.key === 'Backspace' && !block.text) {
      e.preventDefault()
      onKeyDown?.('backspace-empty')
    }
    // Handle / for command menu
    if (e.key === '/' && !block.text) {
      onKeyDown?.('slash')
    }
  }

  // Highlight variables
  const highlightVariables = (text) => {
    if (!text) return text
    return text.replace(/\{\{(\w+)\}\}/g, '<span class="text-blue-400 bg-blue-500/20 px-1 rounded">{{$1}}</span>')
  }

  return (
    <div className="relative group">
      <textarea
        ref={inputRef}
        value={block.text || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type '/' for commands..."
        rows={1}
        className="w-full bg-transparent text-text-primary placeholder:text-text-muted resize-none focus:outline-none leading-relaxed"
        style={{ minHeight: '1.5em', height: 'auto' }}
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />
    </div>
  )
}

export default ParagraphBlock
