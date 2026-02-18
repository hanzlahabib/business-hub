
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  X,
  Check,
  CheckCheck,
  MoreHorizontal,
  Trash2,
  Edit2,
  Reply,
  Smile
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useCurrentUser } from '../hooks/useCurrentUser'

const REACTION_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀']

function CommentItem({
  comment,
  replies = [],
  currentUser,
  getUserById,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onReact,
  depth = 0
}: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(comment.text)
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const author = getUserById(comment.userId)
  const isOwn = currentUser?.id === comment.userId
  const maxDepth = 2

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEdit(comment.id, { text: editText.trim() })
    }
    setIsEditing(false)
  }

  return (
    <div className={`group ${depth > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''}`}>
      <div
        className={`relative p-3 rounded-lg transition-colors ${
          comment.resolved ? 'bg-green-500/5' : 'bg-bg-secondary hover:bg-bg-tertiary'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false)
          setShowReactions(false)
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
              {author.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-primary">{author.name}</span>
            <span className="text-xs text-text-muted">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.resolved && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                <CheckCheck className="w-3 h-3" />
                Resolved
              </span>
            )}
          </div>

          {/* Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                  title="Add reaction"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {depth < maxDepth && (
                  <button
                    onClick={() => onReply(comment)}
                    className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                )}
                {!comment.parentId && (
                  <button
                    onClick={() => onResolve(comment.id)}
                    className={`p-1 rounded transition-colors ${
                      comment.resolved
                        ? 'text-green-400 hover:bg-green-500/10'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                    }`}
                    title={comment.resolved ? 'Unresolve' : 'Resolve'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {isOwn && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="p-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-2 top-10 z-10 flex gap-1 p-2 bg-bg-primary border border-border rounded-lg shadow-xl"
            >
              {REACTION_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(comment.id, emoji)
                    setShowReactions(false)
                  }}
                  className="p-1 hover:bg-bg-tertiary rounded transition-colors text-lg"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 bg-bg-secondary border border-border-hover rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditText(comment.text)
                }}
                className="px-2 py-1 text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{comment.text}</p>
        )}

        {/* Reactions */}
        {comment.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {groupReactions(comment.reactions).map(({ emoji, count, users }) => (
              <button
                key={emoji}
                onClick={() => onReact(comment.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                  users.includes(currentUser?.id)
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary'
                }`}
                title={users.map(u => getUserById(u).name).join(', ')}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs text-blue-400 hover:text-blue-300 ml-2"
            >
              Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <div className="space-y-2">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  currentUser={currentUser}
                  getUserById={getUserById}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onResolve={onResolve}
                  onReact={onReact}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function CommentThread({
  templateId,
  blockId = null,
  comments = [],
  getReplies,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
  onResolve,
  onReact,
  onClose
}: any) {
  const { currentUser, getUserById } = useCurrentUser()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const inputRef = useRef<any>(null)

  // Filter comments for this block/template
  const filteredComments = blockId
    ? comments.filter(c => c.blockId === blockId && !c.parentId)
    : comments.filter(c => !c.blockId && !c.parentId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    await onCreateComment({
      text: newComment,
      blockId,
      parentId: replyingTo?.id || null,
      userId: currentUser.id
    })

    setNewComment('')
    setReplyingTo(null)
  }

  const handleReply = (comment) => {
    setReplyingTo(comment)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus()
    }
  }, [replyingTo])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">
            {blockId ? 'Block Comments' : 'Comments'}
          </h3>
          <span className="text-xs text-text-muted">
            ({filteredComments.length})
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Start a conversation</p>
          </div>
        ) : (
          filteredComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              currentUser={currentUser}
              getUserById={getUserById}
              onReply={handleReply}
              onEdit={onUpdateComment}
              onDelete={onDeleteComment}
              onResolve={onResolve}
              onReact={onReact}
            />
          ))
        )}
      </div>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-bg-secondary border-t border-border"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">
                Replying to <span className="text-text-secondary">{getUserById(replyingTo.userId).name}</span>
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
              className="w-full p-3 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-hover resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit(e)
                }
              }}
            />
            <p className="text-xs text-text-muted mt-1">
              Press ⌘+Enter to send
            </p>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

// Helper to group reactions by emoji
function groupReactions(reactions: any[]) {
  const grouped: Record<string, { emoji: string; count: number; users: string[] }> = {}
  reactions.forEach(r => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] }
    }
    grouped[r.emoji].count++
    grouped[r.emoji].users.push(r.userId)
  })
  return Object.values(grouped)
}

export default CommentThread
