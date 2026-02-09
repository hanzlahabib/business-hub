export function DividerBlock({ block, onChange, onKeyDown }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      onKeyDown?.('backspace-empty')
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onKeyDown?.('enter')
    }
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="py-2 focus:outline-none group"
    >
      <hr className="border-border-hover group-focus:border-border-hover transition-colors" />
    </div>
  )
}

export default DividerBlock
