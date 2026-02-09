import { useRef, useEffect } from 'react'

export function QuoteBlock({ block, onChange, onKeyDown, isActive }) {
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onKeyDown?.('enter')
    }
    if (e.key === 'Backspace' && !block.text) {
      e.preventDefault()
      onKeyDown?.('backspace-empty')
    }
  }

  return (
    <div className="relative pl-4 border-l-4 border-border-hover">
      <textarea
        ref={inputRef}
        value={block.text || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Quote..."
        rows={1}
        className="w-full bg-transparent text-text-secondary italic placeholder:text-text-muted resize-none focus:outline-none leading-relaxed"
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />
    </div>
  )
}

export default QuoteBlock
