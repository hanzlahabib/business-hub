import { useState, useEffect } from 'react'
import { FileText, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownViewer({ isOpen, onClose, filePath, fileName }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && filePath) {
      setLoading(true)
      setError(null)
      fetch(`http://localhost:3002/api/file/read?path=${encodeURIComponent(filePath)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setContent(data.content)
          } else {
            setError(data.error)
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [isOpen, filePath])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] mx-4 bg-bg-primary rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{fileName}</h3>
              <p className="text-xs text-text-muted truncate max-w-md">{filePath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-4 bg-red-500/20 rounded-full mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 font-medium mb-2">Failed to load file</p>
              <p className="text-text-muted text-sm">{error}</p>
            </div>
          ) : (
            <div className="markdown-viewer">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold text-text-primary border-b border-border pb-4 mb-6">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold text-blue-400 mt-8 mb-4">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-semibold text-text-primary mt-6 mb-3">{children}</h3>,
                  h4: ({children}) => <h4 className="text-lg font-semibold text-text-secondary mt-4 mb-2">{children}</h4>,
                  p: ({children}) => <p className="text-text-secondary leading-relaxed my-3">{children}</p>,
                  strong: ({children}) => <strong className="text-text-primary font-semibold">{children}</strong>,
                  em: ({children}) => <em className="text-text-secondary italic">{children}</em>,
                  ul: ({children}) => <ul className="text-text-secondary my-4 pl-6 list-disc space-y-1">{children}</ul>,
                  ol: ({children}) => <ol className="text-text-secondary my-4 pl-6 list-decimal space-y-1">{children}</ol>,
                  li: ({children}) => <li className="text-text-secondary">{children}</li>,
                  a: ({href, children}) => <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500/50 pl-4 my-4 text-text-muted italic bg-bg-secondary py-2 rounded-r-lg">{children}</blockquote>,
                  code: ({inline, children}) => inline
                    ? <code className="text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded text-sm">{children}</code>
                    : <code className="block text-blue-400 text-sm">{children}</code>,
                  pre: ({children}) => <pre className="bg-bg-primary border border-border rounded-xl p-4 my-4 overflow-x-auto">{children}</pre>,
                  hr: () => <hr className="border-border my-6" />,
                  table: ({children}) => (
                    <div className="overflow-x-auto my-6">
                      <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">{children}</table>
                    </div>
                  ),
                  thead: ({children}) => <thead className="bg-bg-tertiary">{children}</thead>,
                  tbody: ({children}) => <tbody className="divide-y divide-border">{children}</tbody>,
                  tr: ({children}) => <tr className="hover:bg-bg-secondary">{children}</tr>,
                  th: ({children}) => <th className="px-4 py-3 text-left text-text-primary font-semibold border border-border">{children}</th>,
                  td: ({children}) => <td className="px-4 py-3 text-text-secondary border border-border">{children}</td>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-secondary/50">
          <p className="text-xs text-text-muted">Press ESC to close</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary text-sm rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
