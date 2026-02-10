// @ts-nocheck
import { useRef, useEffect, useState } from 'react'
import { Lightbulb, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'

const calloutStyles = {
  bulb: { icon: Lightbulb, bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-200' },
  info: { icon: Info, bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-200' },
  success: { icon: CheckCircle, bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-200' },
  error: { icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-200' }
}

const emojiOptions = ['bulb', 'warning', 'info', 'success', 'error']

export function CalloutBlock({ block, onChange, onKeyDown, isActive }) {
  const inputRef = useRef<any>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emoji = block.emoji || 'bulb'
  const style = calloutStyles[emoji] || calloutStyles.bulb
  const Icon = style.icon

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

  const changeEmoji = (newEmoji) => {
    onChange({ emoji: newEmoji })
    setShowEmojiPicker(false)
  }

  return (
    <div className={`relative group flex gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="flex-shrink-0 p-1 hover:bg-bg-tertiary rounded transition-colors"
      >
        <Icon className={`w-5 h-5 ${style.text}`} />
      </button>

      {showEmojiPicker && (
        <div className="absolute left-0 top-full mt-1 z-10 flex gap-1 p-2 bg-bg-primary border border-border rounded-lg shadow-xl">
          {emojiOptions.map(opt => {
            const OptIcon = calloutStyles[opt].icon
            return (
              <button
                key={opt}
                onClick={() => changeEmoji(opt)}
                className={`p-2 rounded hover:bg-bg-tertiary ${emoji === opt ? 'bg-bg-tertiary' : ''}`}
              >
                <OptIcon className={`w-4 h-4 ${calloutStyles[opt].text}`} />
              </button>
            )
          })}
        </div>
      )}

      <textarea
        ref={inputRef}
        value={block.text || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Callout text..."
        rows={1}
        className={`flex-1 bg-transparent ${style.text} placeholder:text-text-muted resize-none focus:outline-none leading-relaxed`}
        onInput={(e) => {
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
      />
    </div>
  )
}

export default CalloutBlock
