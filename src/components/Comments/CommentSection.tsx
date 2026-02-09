import { useState, useCallback, memo } from 'react'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Comment {
    id: string
    text: string
    author: string
    createdAt: string
    [key: string]: any
}

interface CommentSectionProps {
    comments?: Comment[]
    onAddComment: (text: string) => Promise<void>
    onDeleteComment: (commentId: string) => Promise<void>
    maxHeight?: string
}

export const CommentSection = memo(function CommentSection({
    comments = [],
    onAddComment,
    onDeleteComment,
    maxHeight = '240px'
}: CommentSectionProps) {
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            await onAddComment(newComment.trim())
            setNewComment('')
        } finally {
            setIsSubmitting(false)
        }
    }, [newComment, isSubmitting, onAddComment])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e as unknown as React.FormEvent)
        }
    }, [handleSubmit])

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-text-muted flex items-center gap-2">
                <MessageSquare size={14} />
                Comments ({comments.length})
            </h4>

            {/* Comment List */}
            <div
                className="space-y-2 overflow-y-auto pr-1"
                style={{ maxHeight }}
            >
                {comments.length === 0 ? (
                    <p className="text-sm text-text-muted/60 text-center py-4">
                        No comments yet
                    </p>
                ) : (
                    comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onDelete={() => onDeleteComment(comment.id)}
                        />
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                    disabled={isSubmitting}
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-3 py-2 rounded-lg bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    )
})

interface CommentItemProps {
    comment: Comment
    onDelete: () => void
}

const CommentItem = memo(function CommentItem({ comment, onDelete }: CommentItemProps) {
    const formattedDate = comment.createdAt
        ? format(parseISO(comment.createdAt), 'MMM d, h:mm a')
        : ''

    return (
        <div className="p-3 bg-bg-tertiary/50 rounded-lg group">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-text-primary flex-1 whitespace-pre-wrap break-words">
                    {comment.text}
                </p>
                <button
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent-danger/20 text-accent-danger transition-all"
                    title="Delete comment"
                >
                    <Trash2 size={12} />
                </button>
            </div>
            <p className="text-xs text-text-muted/70 mt-2">
                {comment.author} {formattedDate && `- ${formattedDate}`}
            </p>
        </div>
    )
})
