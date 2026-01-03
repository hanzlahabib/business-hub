import { useReducer, useEffect, useCallback, memo, useState } from 'react'
import { Modal, Button } from '../UI'
import { Video, Smartphone, Plus, X, Youtube, FileText, FileCode, Link2, ExternalLink, Folder, Presentation, ListChecks, ChevronDown, Calendar, MessageSquare, StickyNote, Monitor, Pencil, User, Clapperboard, BookOpen } from 'lucide-react'
import VariantGuideModal from './VariantGuideModal'
import { CommentSection } from '../Comments'
import { motion, AnimatePresence } from 'framer-motion'

// Accordion Section Component
const AccordionSection = memo(function AccordionSection({ title, icon: Icon, isOpen, onToggle, children, badge }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-text-muted" />}
          <span className="text-sm font-medium text-text-primary">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-accent-primary/20 text-accent-primary">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 space-y-3 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

const statusOptions = [
  { value: 'idea', label: 'Idea' },
  { value: 'script', label: 'Script' },
  { value: 'recording', label: 'Recording' },
  { value: 'editing', label: 'Editing' },
  { value: 'thumbnail', label: 'Thumbnail' },
  { value: 'published', label: 'Published' }
]

const DEFAULT_TOPICS = ['React Hooks', 'React 19', 'Performance', 'Interview Prep', 'JavaScript', 'React Basics', 'Other']

const URL_TYPE_CONFIG = {
  youtube: { icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  doc: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  github: { icon: FileCode, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  other: { icon: Link2, color: 'text-gray-400', bgColor: 'bg-gray-500/10' }
}

const detectUrlType = (url) => {
  if (!url) return 'other'
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
  if (lowerUrl.includes('docs.google.com') || lowerUrl.includes('notion.so') || lowerUrl.includes('notion.com')) return 'doc'
  if (lowerUrl.includes('github.com') || lowerUrl.includes('gist.github.com')) return 'github'
  return 'other'
}

const initialFormState = {
  type: 'short',
  title: '',
  topic: '',
  status: 'idea',
  scheduledDate: '',
  hook: '',
  notes: '',
  urls: [],
  videoVariant: '',
  presentationReady: false,
  slideDetails: {
    folderName: '',
    bulletPoints: [],
    slides: []
  }
}

const VIDEO_VARIANT_ICONS = {
  'monitor': Monitor,
  'pencil': Pencil,
  'user': User,
  'file-text': FileText
}

const DEFAULT_VIDEO_VARIANTS = [
  { id: 'cozy-screen', name: 'Cozy Screen', icon: 'monitor', color: '#8B5CF6', description: 'Faceless, VS Code, lo-fi music' },
  { id: 'whiteboard', name: 'Whiteboard', icon: 'pencil', color: '#F59E0B', description: 'Hand-drawn explainer style' },
  { id: 'slides-face', name: 'Slides + Face', icon: 'user', color: '#10B981', description: 'Minimal slides, face in corner' },
  { id: 'notion-doc', name: 'Notion Doc', icon: 'file-text', color: '#3B82F6', description: 'Aesthetic doc scroll, voiceover' }
]

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return initialFormState
    case 'LOAD_CONTENT':
      return {
        type: action.payload.type || 'short',
        title: action.payload.title || '',
        topic: action.payload.topic || '',
        status: action.payload.status || 'idea',
        scheduledDate: action.payload.scheduledDate || '',
        hook: action.payload.hook || '',
        notes: action.payload.notes || '',
        urls: action.payload.urls || [],
        videoVariant: action.payload.videoVariant || '',
        presentationReady: action.payload.presentationReady || false,
        slideDetails: action.payload.slideDetails || {
          folderName: '',
          bulletPoints: [],
          slides: []
        }
      }
    case 'SET_INITIAL_DATE':
      return { ...initialFormState, scheduledDate: action.payload }
    case 'ADD_URL':
      return { ...state, urls: [...state.urls, action.payload] }
    case 'REMOVE_URL':
      return { ...state, urls: state.urls.filter(u => u.id !== action.payload) }
    case 'SET_SLIDE_FIELD':
      return {
        ...state,
        slideDetails: { ...state.slideDetails, [action.field]: action.value }
      }
    case 'ADD_BULLET_POINT':
      return {
        ...state,
        slideDetails: {
          ...state.slideDetails,
          bulletPoints: [...state.slideDetails.bulletPoints, action.payload]
        }
      }
    case 'REMOVE_BULLET_POINT':
      return {
        ...state,
        slideDetails: {
          ...state.slideDetails,
          bulletPoints: state.slideDetails.bulletPoints.filter((_, i) => i !== action.index)
        }
      }
    case 'ADD_SLIDE':
      return {
        ...state,
        slideDetails: {
          ...state.slideDetails,
          slides: [...state.slideDetails.slides, action.payload]
        }
      }
    case 'REMOVE_SLIDE':
      return {
        ...state,
        slideDetails: {
          ...state.slideDetails,
          slides: state.slideDetails.slides.filter((_, i) => i !== action.index)
        }
      }
    default:
      return state
  }
}

// Get next variant in rotation (different from last used)
function getNextVariant(lastUsedVariant, variants) {
  if (!variants || variants.length === 0) return ''
  if (!lastUsedVariant) return variants[0].id

  const currentIndex = variants.findIndex(v => v.id === lastUsedVariant)
  const nextIndex = (currentIndex + 1) % variants.length
  return variants[nextIndex].id
}

export const AddContentModal = memo(function AddContentModal({
  isOpen,
  onClose,
  onAdd,
  initialDate,
  editContent,
  onAddComment,
  onDeleteComment,
  topics = DEFAULT_TOPICS,
  videoVariants = DEFAULT_VIDEO_VARIANTS,
  lastUsedVariant = ''
}) {
  const [formState, dispatch] = useReducer(formReducer, initialFormState)
  const [newUrl, setNewUrl] = useState('')
  const [newUrlLabel, setNewUrlLabel] = useState('')
  const [newBulletPoint, setNewBulletPoint] = useState('')
  const [newSlide, setNewSlide] = useState('')
  const [openSections, setOpenSections] = useState({
    basic: true,
    schedule: false,
    videoStyle: false,
    presentation: false,
    details: false,
    links: false,
    comments: false
  })
  const [showVariantGuide, setShowVariantGuide] = useState(false)

  const toggleSection = useCallback((section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  // Load content when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editContent) {
        dispatch({ type: 'LOAD_CONTENT', payload: editContent })
      } else {
        dispatch({ type: 'SET_INITIAL_DATE', payload: initialDate || '' })
        // Auto-select next variant in rotation
        const nextVariant = getNextVariant(lastUsedVariant, videoVariants)
        if (nextVariant) {
          dispatch({ type: 'SET_FIELD', field: 'videoVariant', value: nextVariant })
        }
      }
    }
  }, [isOpen, editContent, initialDate, lastUsedVariant, videoVariants])

  const handleFieldChange = useCallback((field) => (e) => {
    const value = e.target ? e.target.value : e
    dispatch({ type: 'SET_FIELD', field, value })
  }, [])

  const handleTypeChange = useCallback((type) => {
    dispatch({ type: 'SET_FIELD', field: 'type', value: type })
  }, [])

  const handleAddUrl = useCallback(() => {
    if (!newUrl.trim()) return
    const id = crypto.randomUUID()
    dispatch({
      type: 'ADD_URL',
      payload: {
        id,
        url: newUrl.trim(),
        label: newUrlLabel.trim(),
        type: detectUrlType(newUrl.trim())
      }
    })
    setNewUrl('')
    setNewUrlLabel('')
  }, [newUrl, newUrlLabel])

  const handleRemoveUrl = useCallback((urlId) => {
    dispatch({ type: 'REMOVE_URL', payload: urlId })
  }, [])

  const handleAddBulletPoint = useCallback(() => {
    if (!newBulletPoint.trim()) return
    dispatch({ type: 'ADD_BULLET_POINT', payload: newBulletPoint.trim() })
    setNewBulletPoint('')
  }, [newBulletPoint])

  const handleRemoveBulletPoint = useCallback((index) => {
    dispatch({ type: 'REMOVE_BULLET_POINT', index })
  }, [])

  const handleAddSlide = useCallback(() => {
    if (!newSlide.trim()) return
    dispatch({ type: 'ADD_SLIDE', payload: newSlide.trim() })
    setNewSlide('')
  }, [newSlide])

  const handleRemoveSlide = useCallback((index) => {
    dispatch({ type: 'REMOVE_SLIDE', index })
  }, [])

  const handleAddComment = useCallback(async (text) => {
    if (editContent && onAddComment) {
      await onAddComment(editContent.id, text)
    }
  }, [editContent, onAddComment])

  const handleDeleteComment = useCallback(async (commentId) => {
    if (editContent && onDeleteComment) {
      await onDeleteComment(editContent.id, commentId)
    }
  }, [editContent, onDeleteComment])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onAdd({
      ...(editContent || {}),
      ...formState
    })
    dispatch({ type: 'RESET' })
    onClose()
  }, [formState, editContent, onAdd, onClose])

  const handleClose = useCallback(() => {
    dispatch({ type: 'RESET' })
    setNewUrl('')
    setNewUrlLabel('')
    setNewBulletPoint('')
    setNewSlide('')
    onClose()
  }, [onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editContent ? 'Edit Content' : 'Add Content'}
    >
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        {/* Basic Info Section */}
        <AccordionSection
          title="Basic Info"
          icon={Video}
          isOpen={openSections.basic}
          onToggle={() => toggleSection('basic')}
        >
          <div>
            <label className="block text-xs font-medium text-text-muted mb-2">Content Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('long')}
                className={`flex-1 p-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all text-sm ${
                  formState.type === 'long'
                    ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary'
                    : 'bg-bg-tertiary border-border text-text-muted hover:border-accent-secondary/50'
                }`}
              >
                <Video size={16} />
                <span>Long Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('short')}
                className={`flex-1 p-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all text-sm ${
                  formState.type === 'short'
                    ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                    : 'bg-bg-tertiary border-border text-text-muted hover:border-accent-primary/50'
                }`}
              >
                <Smartphone size={16} />
                <span>Short</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
            <input
              type="text"
              value={formState.title}
              onChange={handleFieldChange('title')}
              placeholder="e.g., useEffect 5 Mistakes"
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Topic</label>
            <select
              value={formState.topic}
              onChange={handleFieldChange('topic')}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="">Select topic...</option>
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </AccordionSection>

        {/* Schedule & Status Section */}
        <AccordionSection
          title="Schedule & Status"
          icon={Calendar}
          isOpen={openSections.schedule}
          onToggle={() => toggleSection('schedule')}
          badge={formState.status}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Status</label>
              <select
                value={formState.status}
                onChange={handleFieldChange('status')}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              >
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formState.scheduledDate}
                onChange={handleFieldChange('scheduledDate')}
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Video Style Section */}
        <AccordionSection
          title="Video Style"
          icon={Clapperboard}
          isOpen={openSections.videoStyle}
          onToggle={() => toggleSection('videoStyle')}
          badge={videoVariants.find(v => v.id === formState.videoVariant)?.name}
        >
          <div className="grid grid-cols-2 gap-2">
            {videoVariants.map(variant => {
              const IconComponent = VIDEO_VARIANT_ICONS[variant.icon] || Monitor
              const isSelected = formState.videoVariant === variant.id
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'videoVariant', value: isSelected ? '' : variant.id })}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-current bg-current/10'
                      : 'border-border bg-bg-tertiary hover:border-current/50'
                  }`}
                  style={{
                    borderColor: isSelected ? variant.color : undefined,
                    color: variant.color
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent size={16} />
                    <span className={`text-sm font-medium ${isSelected ? '' : 'text-text-primary'}`}>
                      {variant.name}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-1">{variant.description}</p>
                </button>
              )
            })}
          </div>
          {formState.videoVariant && (
            <div className="mt-2 p-2 rounded-lg bg-bg-primary flex items-center justify-between">
              <p className="text-xs text-text-muted">
                <span className="font-medium text-text-primary">Best for: </span>
                {videoVariants.find(v => v.id === formState.videoVariant)?.bestFor?.join(', ')}
              </p>
              <button
                type="button"
                onClick={() => setShowVariantGuide(true)}
                className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
              >
                <BookOpen size={12} />
                View Guide
              </button>
            </div>
          )}

          {/* View All Guides Button */}
          <button
            type="button"
            onClick={() => setShowVariantGuide(true)}
            className="w-full mt-2 p-2 rounded-lg border border-dashed border-border text-sm text-text-muted hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen size={14} />
            View All Variant Guides
          </button>
        </AccordionSection>

        {/* Variant Guide Modal */}
        <VariantGuideModal
          isOpen={showVariantGuide}
          onClose={() => setShowVariantGuide(false)}
          selectedVariant={formState.videoVariant || null}
        />

        {/* Presentation Section */}
        <AccordionSection
          title="Presentation"
          icon={Presentation}
          isOpen={openSections.presentation}
          onToggle={() => toggleSection('presentation')}
          badge={formState.presentationReady ? 'Ready' : null}
        >
          <div className="flex items-center justify-between p-2 rounded-lg bg-bg-primary">
            <div>
              <p className="text-sm font-medium text-text-primary">Presentation Ready</p>
              <p className="text-xs text-text-muted">Slides/presentation is prepared</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'presentationReady', value: !formState.presentationReady })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                formState.presentationReady ? 'bg-accent-success' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  formState.presentationReady ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {formState.presentationReady && (
            <div className="space-y-3 p-2 rounded-lg bg-accent-success/5 border border-accent-success/20">
              {/* Folder Name */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
                  <Folder size={12} /> Folder Name
                </label>
                <input
                  type="text"
                  value={formState.slideDetails.folderName}
                  onChange={(e) => dispatch({ type: 'SET_SLIDE_FIELD', field: 'folderName', value: e.target.value })}
                  placeholder="e.g., react-optimization"
                  className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Bullet Points */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
                  <ListChecks size={12} /> Key Points ({formState.slideDetails.bulletPoints.length})
                </label>
                {formState.slideDetails.bulletPoints.length > 0 && (
                  <div className="space-y-1 mb-2 max-h-24 overflow-y-auto">
                    {formState.slideDetails.bulletPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-2 p-1.5 rounded bg-bg-tertiary group">
                        <span className="text-xs text-accent-success">•</span>
                        <span className="text-xs text-text-primary flex-1 truncate">{point}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBulletPoint(index)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent-danger/20 text-accent-danger transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBulletPoint}
                    onChange={(e) => setNewBulletPoint(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBulletPoint())}
                    placeholder="Add a key point..."
                    className="flex-1 px-2 py-1.5 rounded bg-bg-tertiary border border-border text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddBulletPoint}
                    disabled={!newBulletPoint.trim()}
                    className="px-2 py-1.5 rounded bg-accent-success text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-success/90 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* Slide Names */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
                  <Presentation size={12} /> Slides ({formState.slideDetails.slides.length})
                </label>
                {formState.slideDetails.slides.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-y-auto">
                    {formState.slideDetails.slides.map((slide, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-tertiary text-xs text-text-primary group"
                      >
                        <span className="text-accent-success font-medium">{index + 1}.</span>
                        {slide}
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(index)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent-danger/20 text-accent-danger transition-opacity"
                        >
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSlide}
                    onChange={(e) => setNewSlide(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSlide())}
                    placeholder="Add slide name..."
                    className="flex-1 px-2 py-1.5 rounded bg-bg-tertiary border border-border text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlide}
                    disabled={!newSlide.trim()}
                    className="px-2 py-1.5 rounded bg-accent-success text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-success/90 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </AccordionSection>

        {/* Content Details Section */}
        <AccordionSection
          title="Content Details"
          icon={StickyNote}
          isOpen={openSections.details}
          onToggle={() => toggleSection('details')}
        >
          {formState.type === 'short' && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Hook (First 3 seconds)</label>
              <input
                type="text"
                value={formState.hook}
                onChange={handleFieldChange('hook')}
                placeholder="e.g., Stop making this mistake!"
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
            <textarea
              value={formState.notes}
              onChange={handleFieldChange('notes')}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>
        </AccordionSection>

        {/* Links Section */}
        <AccordionSection
          title="Links"
          icon={Link2}
          isOpen={openSections.links}
          onToggle={() => toggleSection('links')}
          badge={formState.urls.length > 0 ? formState.urls.length : null}
        >
          {/* Existing URLs */}
          {formState.urls.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {formState.urls.map(urlItem => {
                const config = URL_TYPE_CONFIG[urlItem.type] || URL_TYPE_CONFIG.other
                const Icon = config.icon
                return (
                  <div key={urlItem.id} className={`flex items-center gap-2 p-2 rounded-lg ${config.bgColor} group`}>
                    <Icon size={14} className={config.color} />
                    <div className="flex-1 min-w-0">
                      {urlItem.label && <p className="text-xs font-medium text-text-primary truncate">{urlItem.label}</p>}
                      <p className="text-xs text-text-muted truncate">{urlItem.url}</p>
                    </div>
                    <a
                      href={urlItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1 rounded hover:bg-white/10 ${config.color}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(urlItem.id)}
                      className="p-1 rounded hover:bg-accent-danger/20 text-accent-danger"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add URL input */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
              />
              {newUrl && (
                <input
                  type="text"
                  value={newUrlLabel}
                  onChange={(e) => setNewUrlLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-primary"
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={!newUrl.trim()}
              className="px-3 py-2 rounded-lg bg-accent-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-primary/90 transition-colors self-start"
            >
              <Plus size={14} />
            </button>
          </div>
          {newUrl && (
            <p className="text-xs text-text-muted">
              Type: <span className={URL_TYPE_CONFIG[detectUrlType(newUrl)]?.color}>{detectUrlType(newUrl)}</span>
            </p>
          )}
        </AccordionSection>

        {/* Comments Section (only when editing) */}
        {editContent && (
          <AccordionSection
            title="Comments"
            icon={MessageSquare}
            isOpen={openSections.comments}
            onToggle={() => toggleSection('comments')}
            badge={editContent.comments?.length > 0 ? editContent.comments.length : null}
          >
            <CommentSection
              comments={editContent.comments || []}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              maxHeight="120px"
            />
          </AccordionSection>
        )}

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-bg-secondary pb-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {editContent ? 'Update' : 'Add Content'}
          </Button>
        </div>
      </form>
    </Modal>
  )
})
