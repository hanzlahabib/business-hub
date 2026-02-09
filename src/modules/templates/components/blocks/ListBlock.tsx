import { useRef, useEffect } from 'react'
import { List, ListOrdered } from 'lucide-react'

export function ListBlock({ block, onChange, onKeyDown, isActive }) {
  const items = block.items || ['']
  const style = block.style || 'bullet'

  const handleItemChange = (index, value) => {
    const newItems = [...items]
    newItems[index] = value
    onChange({ items: newItems })
  }

  const handleItemKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newItems = [...items]
      newItems.splice(index + 1, 0, '')
      onChange({ items: newItems })
      // Focus will be handled by useEffect in the new item
    }

    if (e.key === 'Backspace' && !items[index]) {
      e.preventDefault()
      if (items.length > 1) {
        const newItems = items.filter((_, i) => i !== index)
        onChange({ items: newItems })
      } else {
        onKeyDown?.('backspace-empty')
      }
    }
  }

  const toggleStyle = () => {
    onChange({ style: style === 'bullet' ? 'numbered' : 'bullet' })
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleStyle}
        className="absolute -left-8 top-0.5 opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-text-secondary hover:bg-bg-tertiary rounded transition-all"
        title={style === 'bullet' ? 'Switch to numbered' : 'Switch to bullets'}
      >
        {style === 'bullet' ? <ListOrdered className="w-4 h-4" /> : <List className="w-4 h-4" />}
      </button>

      <ul className={`space-y-1 ${style === 'numbered' ? 'list-decimal' : 'list-disc'} list-inside`}>
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-text-muted select-none">
              {style === 'numbered' ? `${index + 1}.` : '•'}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              onKeyDown={(e) => handleItemKeyDown(e, index)}
              placeholder="List item..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
              autoFocus={isActive && index === items.length - 1}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ListBlock
