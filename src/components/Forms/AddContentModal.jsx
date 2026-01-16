import { useReducer, useEffect, useCallback, memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { Modal, Button } from '../UI'
import { WizardProgress } from './WizardProgress'
import { BasicInfoStep, ScheduleStep, DetailsStep } from './WizardSteps'
import { slideVariants, springSmooth } from '../../lib/animations'
import { CommentSection } from '../Comments'

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TOPICS = ['React Hooks', 'React 19', 'Performance', 'Interview Prep', 'JavaScript', 'React Basics', 'AI & Tools', 'Motivation', 'Other']

const DEFAULT_VIDEO_VARIANTS = [
  { id: 'cozy-screen', name: 'Cozy Screen', icon: 'monitor', color: '#3B82F6', description: 'Faceless, VS Code, lo-fi music' },
  { id: 'whiteboard', name: 'Whiteboard', icon: 'pencil', color: '#F59E0B', description: 'Hand-drawn explainer style' },
  { id: 'slides-face', name: 'Slides + Face', icon: 'user', color: '#10B981', description: 'Minimal slides, face in corner' },
  { id: 'notion-doc', name: 'Notion Doc', icon: 'file-text', color: '#3B82F6', description: 'Aesthetic doc scroll, voiceover' }
]

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

// ============================================================================
// REDUCER
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNextVariant(lastUsedVariant, variants) {
  if (!variants || variants.length === 0) return ''
  if (!lastUsedVariant) return variants[0].id
  const currentIndex = variants.findIndex(v => v.id === lastUsedVariant)
  const nextIndex = (currentIndex + 1) % variants.length
  return variants[nextIndex].id
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [showComments, setShowComments] = useState(false)

  // Load content when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editContent) {
        dispatch({ type: 'LOAD_CONTENT', payload: editContent })
        // When editing, mark all steps as accessible
        setCompletedSteps([1, 2])
      } else {
        dispatch({ type: 'SET_INITIAL_DATE', payload: initialDate || '' })
        const nextVariant = getNextVariant(lastUsedVariant, videoVariants)
        if (nextVariant) {
          dispatch({ type: 'SET_FIELD', field: 'videoVariant', value: nextVariant })
        }
        setCompletedSteps([])
      }
      setCurrentStep(1)
      setDirection(0)
    }
  }, [isOpen, editContent, initialDate, lastUsedVariant, videoVariants])

  // Step navigation
  const handleNextStep = useCallback(() => {
    if (currentStep < 3) {
      // Validate current step before proceeding
      if (currentStep === 1 && !formState.title.trim()) {
        return // Don't proceed without title
      }

      setDirection(1)
      setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep])
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, formState.title])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleStepClick = useCallback((step) => {
    if (completedSteps.includes(step) || step <= currentStep) {
      setDirection(step > currentStep ? 1 : -1)
      setCurrentStep(step)
    }
  }, [completedSteps, currentStep])

  // Form submission
  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    onAdd({
      ...(editContent || {}),
      ...formState
    })
    dispatch({ type: 'RESET' })
    setCurrentStep(1)
    setCompletedSteps([])
    onClose()
  }, [formState, editContent, onAdd, onClose])

  // Modal close
  const handleClose = useCallback(() => {
    dispatch({ type: 'RESET' })
    setCurrentStep(1)
    setCompletedSteps([])
    setShowComments(false)
    onClose()
  }, [onClose])

  // Comment handlers
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

  // Step props
  const stepProps = {
    formState,
    dispatch,
    topics,
    videoVariants
  }

  const isLastStep = currentStep === 3
  const canProceed = currentStep === 1 ? formState.title.trim() : true

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editContent ? 'Edit Content' : 'Create Content'}
      size="lg"
    >
      <div className="relative">
        {/* Wizard Progress */}
        <WizardProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Content with Animations */}
        <div className="relative min-h-[400px] mt-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springSmooth}
              className="w-full"
            >
              {currentStep === 1 && <BasicInfoStep {...stepProps} />}
              {currentStep === 2 && <ScheduleStep {...stepProps} />}
              {currentStep === 3 && <DetailsStep {...stepProps} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Comments Section (only when editing) */}
        {editContent && editContent.comments?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 border-t border-border pt-4"
          >
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <span>Comments ({editContent.comments?.length || 0})</span>
              <motion.span
                animate={{ rotate: showComments ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3"
                >
                  <CommentSection
                    comments={editContent.comments || []}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                    maxHeight="150px"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          {/* Left side - Back or Cancel */}
          <div>
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePrevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </Button>
            )}
          </div>

          {/* Right side - Continue or Submit */}
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <span className="text-xs text-text-muted">
              Step {currentStep} of 3
            </span>

            {isLastStep ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                className="flex items-center gap-2 gradient-primary btn-glow"
              >
                <Check size={16} />
                {editContent ? 'Update' : 'Create'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                onClick={handleNextStep}
                disabled={!canProceed}
                className="flex items-center gap-2"
              >
                Continue
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
})
