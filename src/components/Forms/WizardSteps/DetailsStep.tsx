import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus, X, Youtube, FileText, FileCode, Link2, ExternalLink,
    Folder, ListChecks, Presentation, ChevronDown,
    LucideIcon
} from 'lucide-react'
import { staggerContainer, staggerItem } from '../../../lib/animations'
import { FormState, Action } from './types'

interface UrlConfig {
    icon: LucideIcon
    color: string
    bgColor: string
}

const URL_TYPE_CONFIG: Record<string, UrlConfig> = {
    youtube: { icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    doc: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    github: { icon: FileCode, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    other: { icon: Link2, color: 'text-gray-400', bgColor: 'bg-gray-500/10' }
}

const detectUrlType = (url: string): 'youtube' | 'doc' | 'github' | 'other' => {
    if (!url) return 'other'
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
    if (lowerUrl.includes('docs.google.com') || lowerUrl.includes('notion')) return 'doc'
    if (lowerUrl.includes('github.com')) return 'github'
    return 'other'
}

interface DetailsStepProps {
    formState: FormState
    dispatch: React.Dispatch<Action>
}

export const DetailsStep = memo(function DetailsStep({
    formState,
    dispatch
}: DetailsStepProps) {
    const [newUrl, setNewUrl] = useState('')
    const [newUrlLabel, setNewUrlLabel] = useState('')
    const [newBulletPoint, setNewBulletPoint] = useState('')
    const [newSlide, setNewSlide] = useState('')
    const [expandedSections, setExpandedSections] = useState({
        presentation: false,
        links: false
    })

    const toggleSection = (section: 'presentation' | 'links') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const handleFieldChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        dispatch({ type: 'SET_FIELD', field, value: e.target.value })
    }

    const handleAddUrl = useCallback(() => {
        if (!newUrl.trim()) return
        dispatch({
            type: 'ADD_URL',
            payload: {
                id: crypto.randomUUID(),
                url: newUrl.trim(),
                label: newUrlLabel.trim(),
                type: detectUrlType(newUrl.trim())
            }
        })
        setNewUrl('')
        setNewUrlLabel('')
    }, [newUrl, newUrlLabel, dispatch])

    const handleRemoveUrl = (urlId: string) => {
        dispatch({ type: 'REMOVE_URL', payload: urlId })
    }

    const handleAddBulletPoint = useCallback(() => {
        if (!newBulletPoint.trim()) return
        dispatch({ type: 'ADD_BULLET_POINT', payload: newBulletPoint.trim() })
        setNewBulletPoint('')
    }, [newBulletPoint, dispatch])

    const handleAddSlide = useCallback(() => {
        if (!newSlide.trim()) return
        dispatch({ type: 'ADD_SLIDE', payload: newSlide.trim() })
        setNewSlide('')
    }, [newSlide, dispatch])

    return (
        <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
        >
            {/* Hook (for shorts) */}
            {formState.type === 'short' && (
                <motion.div variants={staggerItem}>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Hook (First 3 seconds)
                    </label>
                    <motion.input
                        type="text"
                        value={formState.hook || ''}
                        onChange={handleFieldChange('hook')}
                        placeholder="e.g., Stop making this React mistake!"
                        whileFocus={{ scale: 1.01 }}
                        className="
              w-full px-4 py-3 rounded-xl
              bg-bg-tertiary border-2 border-border
              text-text-primary placeholder:text-text-muted/50
              focus:outline-none focus:border-accent-warning focus-glow
              transition-glow text-sm
            "
                    />
                    <p className="mt-1 text-xs text-text-muted">
                        The hook decides if viewers stay or scroll
                    </p>
                </motion.div>
            )}

            {/* Notes */}
            <motion.div variants={staggerItem}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                    Notes
                </label>
                <motion.textarea
                    value={formState.notes || ''}
                    onChange={handleFieldChange('notes')}
                    placeholder="Any additional notes, ideas, or reminders..."
                    rows={3}
                    whileFocus={{ scale: 1.01 }}
                    className="
            w-full px-4 py-3 rounded-xl
            bg-bg-tertiary border-2 border-border
            text-text-primary placeholder:text-text-muted/50
            focus:outline-none focus:border-accent-primary focus-glow
            transition-glow text-sm resize-none
          "
                />
            </motion.div>

            {/* Presentation Section - Collapsible */}
            <motion.div variants={staggerItem} className="border border-border rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('presentation')}
                    className="w-full flex items-center justify-between p-4 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Presentation size={18} className="text-accent-success" />
                        <span className="text-sm font-medium text-text-primary">Presentation Details</span>
                        {formState.presentationReady && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-accent-success/20 text-accent-success">
                                Ready
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        size={18}
                        className={`text-text-muted transition-transform ${expandedSections.presentation ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {expandedSections.presentation && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border"
                        >
                            <div className="p-4 space-y-4">
                                {/* Presentation Ready Toggle */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-primary">Presentation Ready</span>
                                    <button
                                        type="button"
                                        onClick={() => dispatch({ type: 'SET_FIELD', field: 'presentationReady', value: !formState.presentationReady })}
                                        className={`
                      relative w-12 h-6 rounded-full transition-colors
                      ${formState.presentationReady ? 'bg-accent-success' : 'bg-border'}
                    `}
                                    >
                                        <motion.span
                                            className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
                                            animate={{ x: formState.presentationReady ? 24 : 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>

                                {formState.presentationReady && (
                                    <>
                                        {/* Folder Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
                                                <Folder size={12} /> Folder Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formState.slideDetails.folderName}
                                                onChange={(e) => dispatch({ type: 'SET_SLIDE_FIELD', field: 'folderName', value: e.target.value })}
                                                placeholder="e.g., react-optimization"
                                                className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                                            />
                                        </div>

                                        {/* Bullet Points */}
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
                                                <ListChecks size={12} /> Key Points ({formState.slideDetails.bulletPoints.length})
                                            </label>
                                            <div className="space-y-1.5 mb-2">
                                                {formState.slideDetails.bulletPoints.map((point, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-bg-primary group"
                                                    >
                                                        <span className="text-accent-success text-xs">•</span>
                                                        <span className="text-xs text-text-primary flex-1">{point}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => dispatch({ type: 'REMOVE_BULLET_POINT', index })}
                                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent-danger/20 text-accent-danger transition-opacity"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newBulletPoint}
                                                    onChange={(e) => setNewBulletPoint(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBulletPoint())}
                                                    placeholder="Add a key point..."
                                                    className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddBulletPoint}
                                                    disabled={!newBulletPoint.trim()}
                                                    className="px-3 py-2 rounded-lg bg-accent-success text-white disabled:opacity-50 hover:bg-accent-success/90 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Slides */}
                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
                                                <Presentation size={12} /> Slides ({formState.slideDetails.slides.length})
                                            </label>
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {formState.slideDetails.slides.map((slide, index) => (
                                                    <motion.span
                                                        key={index}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-primary text-xs group"
                                                    >
                                                        <span className="text-accent-primary font-medium">{index + 1}.</span>
                                                        <span className="text-text-primary">{slide}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => dispatch({ type: 'REMOVE_SLIDE', index })}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent-danger/20 text-accent-danger transition-opacity"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </motion.span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newSlide}
                                                    onChange={(e) => setNewSlide(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSlide())}
                                                    placeholder="Add slide name..."
                                                    className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddSlide}
                                                    disabled={!newSlide.trim()}
                                                    className="px-3 py-2 rounded-lg bg-accent-primary text-white disabled:opacity-50 hover:bg-accent-primary/90 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Links Section - Collapsible */}
            <motion.div variants={staggerItem} className="border border-border rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleSection('links')}
                    className="w-full flex items-center justify-between p-4 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Link2 size={18} className="text-accent-secondary" />
                        <span className="text-sm font-medium text-text-primary">Links & Resources</span>
                        {formState.urls.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-accent-secondary/20 text-accent-secondary">
                                {formState.urls.length}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        size={18}
                        className={`text-text-muted transition-transform ${expandedSections.links ? 'rotate-180' : ''}`}
                    />
                </button>

                <AnimatePresence>
                    {expandedSections.links && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border"
                        >
                            <div className="p-4 space-y-3">
                                {/* Existing URLs */}
                                {formState.urls.length > 0 && (
                                    <div className="space-y-2">
                                        {formState.urls.map((urlItem) => {
                                            const config = URL_TYPE_CONFIG[urlItem.type] || URL_TYPE_CONFIG.other
                                            const Icon = config.icon
                                            return (
                                                <motion.div
                                                    key={urlItem.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`flex items-center gap-2 p-2.5 rounded-lg ${config.bgColor} group`}
                                                >
                                                    <Icon size={14} className={config.color} />
                                                    <div className="flex-1 min-w-0">
                                                        {urlItem.label && (
                                                            <p className="text-xs font-medium text-text-primary truncate">{urlItem.label}</p>
                                                        )}
                                                        <p className="text-xs text-text-muted truncate">{urlItem.url}</p>
                                                    </div>
                                                    <a
                                                        href={urlItem.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`p-1 rounded hover:bg-bg-tertiary ${config.color}`}
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveUrl(urlItem.id)}
                                                        className="p-1 rounded hover:bg-accent-danger/20 text-accent-danger"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Add URL */}
                                <div className="space-y-2">
                                    <input
                                        type="url"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                                    />
                                    {newUrl && (
                                        <input
                                            type="text"
                                            value={newUrlLabel}
                                            onChange={(e) => setNewUrlLabel(e.target.value)}
                                            placeholder="Label (optional)"
                                            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleAddUrl}
                                        disabled={!newUrl.trim()}
                                        className="w-full py-2 rounded-lg bg-accent-secondary text-white disabled:opacity-50 hover:bg-accent-secondary/90 transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} />
                                        Add Link
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    )
})
