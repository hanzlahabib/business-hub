import { useEffect, useRef } from 'react'
import { Bot, User } from 'lucide-react'

interface Message {
    role: 'assistant' | 'user'
    content: string
}

interface Props {
    transcription: string
    maxMessages?: number
}

function parseTranscript(raw: string): Message[] {
    if (!raw || !raw.trim()) return []

    const messages: Message[] = []

    // Try JSON array format first
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            return parsed.map(m => ({
                role: (m.role === 'user' || m.role === 'human' ? 'user' : 'assistant') as Message['role'],
                content: m.content || m.text || m.message || '',
            })).filter(m => m.content)
        }
    } catch { /* not JSON, try text parsing */ }

    // Parse text format: "Assistant: ..." / "User: ..." or "Agent: ..." / "Lead: ..."
    const lines = raw.split('\n').filter(l => l.trim())
    let currentRole: 'assistant' | 'user' = 'assistant'
    let currentContent = ''

    for (const line of lines) {
        const match = line.match(/^(assistant|agent|ai|bot|user|lead|human|customer|caller):\s*(.*)/i)
        if (match) {
            // Save previous message
            if (currentContent.trim()) {
                messages.push({ role: currentRole, content: currentContent.trim() })
            }
            const roleStr = match[1].toLowerCase()
            currentRole = ['user', 'lead', 'human', 'customer', 'caller'].includes(roleStr) ? 'user' : 'assistant'
            currentContent = match[2]
        } else {
            // Continuation of current message
            currentContent += '\n' + line
        }
    }

    // Push last message
    if (currentContent.trim()) {
        messages.push({ role: currentRole, content: currentContent.trim() })
    }

    // If nothing parsed, treat whole thing as single assistant message
    if (messages.length === 0 && raw.trim()) {
        messages.push({ role: 'assistant', content: raw.trim() })
    }

    return messages
}

export function CallTranscript({ transcription, maxMessages }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const messages = parseTranscript(transcription)
    const displayed = maxMessages ? messages.slice(0, maxMessages) : messages

    useEffect(() => {
        if (scrollRef.current && !maxMessages) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages.length, maxMessages])

    if (displayed.length === 0) {
        return (
            <div className="text-center py-6">
                <Bot size={24} className="mx-auto text-text-muted/30 mb-2" />
                <p className="text-xs text-text-muted">No transcript available</p>
            </div>
        )
    }

    return (
        <div
            ref={scrollRef}
            className={`space-y-3 ${!maxMessages ? 'max-h-[500px] overflow-y-auto pr-1' : ''}`}
        >
            {displayed.map((msg, i) => (
                <div
                    key={i}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'assistant'
                            ? 'bg-cyan-500/10 border border-cyan-500/20'
                            : 'bg-bg-tertiary border border-border'
                    }`}>
                        {msg.role === 'assistant'
                            ? <Bot size={12} className="text-cyan-400" />
                            : <User size={12} className="text-text-muted" />
                        }
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'assistant'
                            ? 'bg-bg-secondary border-l-2 border-cyan-500/40 text-text-primary'
                            : 'bg-bg-tertiary text-text-primary'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}

            {maxMessages && messages.length > maxMessages && (
                <p className="text-[10px] text-text-muted text-center">
                    +{messages.length - maxMessages} more messages
                </p>
            )}
        </div>
    )
}

export default CallTranscript
