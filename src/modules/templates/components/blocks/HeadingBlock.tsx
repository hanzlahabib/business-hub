import { useRef, useEffect } from 'react'

const headingSizes = {
  1: 'text-2xl font-bold',
  2: 'text-xl font-semibold',
  3: 'text-lg font-medium'
}

export function HeadingBlock({ block, onChange, onKeyDown, isActive }) {
  const inputRef = useRef<any>(null)
  const level = block.level || 2

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

  const cycleLevel = () => {
    const newLevel = level >= 3 ? 1 : level + 1
    onChange({ level: newLevel })
  }

  return (
    <div className="relative group flex items-center gap-2">
      <button
        onClick={cycleLevel}
        className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-xs text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-all"
        title="Change heading level"
      >
        H{level}
      </button>
      <input
        ref={inputRef}
        type="text"
        value={block.text || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Heading ${level}`}
        className={`flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none ${headingSizes[level]}`}
      />
    </div>
  )
}

export default HeadingBlock
