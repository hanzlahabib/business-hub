import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ArrowLeft, Settings, Droplets, Sun, Leaf, BookOpen,
  Sparkles, Trophy, X, Check, RotateCcw, Trash2, ChevronRight,
  ChevronDown, ExternalLink, ListChecks, Clock, Target, Eye
} from 'lucide-react'
import { useSkillMastery } from '../hooks/useSkillMastery'
import { MarkdownViewer } from '../../../shared/components/MarkdownViewer'

// Growth stages with visual properties
const GROWTH_STAGES = [
  { name: 'Seed', minProgress: 0, icon: '🌰', color: '#8B4513', description: 'Just planted' },
  { name: 'Sprout', minProgress: 10, icon: '🌱', color: '#90EE90', description: 'Breaking ground' },
  { name: 'Seedling', minProgress: 25, icon: '🌿', color: '#32CD32', description: 'Taking root' },
  { name: 'Growing', minProgress: 45, icon: '🪴', color: '#228B22', description: 'Gaining strength' },
  { name: 'Mature', minProgress: 65, icon: '🌳', color: '#006400', description: 'Strong foundation' },
  { name: 'Blooming', minProgress: 85, icon: '🌸', color: '#FF69B4', description: 'Ready to flourish' },
  { name: 'Mastered', minProgress: 100, icon: '🌺', color: '#FFD700', description: 'Full mastery!' }
]

export function SkillMasteryView() {
  const { pathId } = useParams()
  const navigate = useNavigate()
  const {
    paths,
    loading,
    createPath,
    deletePath,
    updatePath,
    addVocabulary,
    removeVocabulary,
    toggleVocabularyLearned,
    addResource,
    removeResource,
    toggleResourceCompleted,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    waterPlant,
    resetProgress
  } = useSkillMastery()

  // Get selected plant from URL params
  const selectedPlant = useMemo(() => {
    if (!pathId) return null
    return paths.find(p => p.id === pathId) || null
  }, [pathId, paths])

  const [showPlantModal, setShowPlantModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          🌱
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[600px]">
      <AnimatePresence mode="wait">
        {selectedPlant ? (
          <PlantDetailView
            key="detail"
            plant={selectedPlant}
            onBack={() => navigate('/skills')}
            onSettings={() => setShowSettings(true)}
            onWater={waterPlant}
            onAddVocabulary={addVocabulary}
            onRemoveVocabulary={removeVocabulary}
            onToggleVocabulary={toggleVocabularyLearned}
            onAddResource={addResource}
            onRemoveResource={removeResource}
            onToggleResource={toggleResourceCompleted}
            onAddMilestone={addMilestone}
            onToggleMilestone={toggleMilestone}
            onRemoveMilestone={removeMilestone}
          />
        ) : (
          <GardenView
            key="garden"
            plants={paths}
            onSelectPlant={(plant) => navigate(`/skills/${plant.id}`)}
            onPlantNew={() => setShowPlantModal(true)}
          />
        )}
      </AnimatePresence>

      {/* Plant New Skill Modal */}
      <PlantNewModal
        isOpen={showPlantModal}
        onClose={() => setShowPlantModal(false)}
        onCreate={createPath}
      />

      {/* Settings Modal */}
      <PlantSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        plant={selectedPlant}
        onUpdate={(updates) => {
          updatePath(selectedPlant.id, updates)
        }}
        onDelete={() => {
          deletePath(selectedPlant.id)
          navigate('/skills')
          setShowSettings(false)
        }}
        onReset={() => {
          resetProgress(selectedPlant.id)
          navigate('/skills')
          setShowSettings(false)
        }}
      />
    </div>
  )
}

// ============ GARDEN VIEW ============
function GardenView({ plants, onSelectPlant, onPlantNew }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Garden Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          🌿 Your Skill Garden 🌿
        </h1>
        <p className="text-text-muted">
          Plant skills, nurture them daily, watch them grow into mastery
        </p>
      </div>

      {/* Garden Stats */}
      {plants.length > 0 && (
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{plants.length}</p>
            <p className="text-xs text-text-muted">Plants Growing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {plants.reduce((acc, p) => acc + (p.streak?.current || 0), 0)}
            </p>
            <p className="text-xs text-text-muted">Total Streak Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">
              {plants.reduce((acc, p) => acc + (p.vocabulary?.filter(v => v.learned).length || 0), 0)}
            </p>
            <p className="text-xs text-text-muted">Leaves Grown</p>
          </div>
        </div>
      )}

      {/* Garden Grid */}
      {plants.length === 0 ? (
        <EmptyGarden onPlantNew={onPlantNew} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plants.map((plant, index) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              index={index}
              onClick={() => onSelectPlant(plant)}
            />
          ))}

          {/* Add New Plant Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlantNew}
            className="h-64 rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-3 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Plus size={24} className="text-emerald-500" />
            </div>
            <span className="text-text-muted group-hover:text-emerald-500 transition-colors">
              Plant New Skill
            </span>
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}

function EmptyGarden({ onPlantNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-6"
      >
        🌱
      </motion.div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Your garden is empty
      </h2>
      <p className="text-text-muted mb-6 text-center max-w-md">
        Plant your first skill seed and watch it grow as you learn.
        Add vocabulary, resources, and complete milestones to help it flourish.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlantNew}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25"
      >
        <Sparkles size={18} />
        Plant Your First Skill
      </motion.button>
    </div>
  )
}

function PlantCard({ plant, index, onClick }) {
  const progress = calculateProgress(plant)
  const stage = getGrowthStage(progress)
  const needsWater = checkNeedsWater(plant)

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="relative h-64 rounded-2xl bg-gradient-to-b from-sky-100/10 to-emerald-100/10 dark:from-sky-900/20 dark:to-emerald-900/20 border border-border overflow-hidden group"
    >
      {/* Sky/Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-transparent to-amber-900/20" />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-800/30 to-transparent" />

      {/* Needs Water Indicator */}
      {needsWater && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute top-3 right-3 text-blue-400"
        >
          <Droplets size={20} />
        </motion.div>
      )}

      {/* Plant Visualization */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <PlantVisualization stage={stage} progress={progress} />
      </div>

      {/* Plant Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/40 to-transparent">
        <h3 className="font-semibold text-white text-sm truncate">{plant.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-text-secondary">{stage.name}</span>
          <span className="text-xs text-text-secondary">{progress}%</span>
        </div>
        {/* Mini Progress Bar */}
        <div className="h-1 bg-bg-tertiary rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: stage.color }}
          />
        </div>
      </div>

      {/* Streak Badge */}
      {plant.streak?.current > 0 && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-orange-500/90 rounded-full">
          <span className="text-xs">🔥</span>
          <span className="text-xs text-white font-medium">{plant.streak.current}</span>
        </div>
      )}
    </motion.button>
  )
}

function PlantVisualization({ stage, progress }) {
  const stageIndex = GROWTH_STAGES.findIndex(s => s.name === stage.name)

  return (
    <motion.div
      key={stage.name}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative"
    >
      {/* Plant Icon based on stage */}
      <motion.span
        animate={{
          y: [0, -3, 0],
          rotate: stageIndex > 3 ? [0, 2, -2, 0] : 0
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-6xl block"
      >
        {stage.icon}
      </motion.span>

      {/* Sparkles for high progress */}
      {progress >= 85 && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 text-xl"
        >
          ✨
        </motion.div>
      )}
    </motion.div>
  )
}

// ============ PLANT DETAIL VIEW ============
function PlantDetailView({
  plant,
  onBack,
  onSettings,
  onWater,
  onAddVocabulary,
  onRemoveVocabulary,
  onToggleVocabulary,
  onAddResource,
  onRemoveResource,
  onToggleResource,
  onAddMilestone,
  onToggleMilestone,
  onRemoveMilestone
}) {
  const [activeSection, setActiveSection] = useState('growth')
  const progress = calculateProgress(plant)
  const stage = getGrowthStage(progress)
  const needsWater = checkNeedsWater(plant)

  const handleWater = () => {
    onWater(plant.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Garden</span>
        </button>
        <button
          onClick={onSettings}
          className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          <Settings size={20} className="text-text-muted" />
        </button>
      </div>

      {/* Plant Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-amber-500/10 rounded-2xl p-8 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-4xl opacity-20">☀️</div>
        <div className="absolute bottom-4 left-4 text-2xl opacity-20">🌿</div>

        <div className="flex items-center gap-8">
          {/* Plant Display */}
          <div className="relative">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-8xl"
            >
              {stage.icon}
            </motion.div>
            {needsWater && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-2 -right-2 text-2xl"
              >
                💧
              </motion.div>
            )}
          </div>

          {/* Plant Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary mb-1">{plant.name}</h1>
            <p className="text-text-muted mb-4">{plant.description || 'A growing skill...'}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                {stage.name}
              </div>
              <span className="text-text-muted text-sm">{stage.description}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">Growth Progress</span>
                <span className="font-medium" style={{ color: stage.color }}>{progress}%</span>
              </div>
              <div className="h-3 bg-bg-tertiary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${GROWTH_STAGES[0].color}, ${stage.color})` }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-orange-500">{plant.streak?.current || 0}</p>
                <p className="text-xs text-text-muted">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-500">
                  {plant.vocabulary?.filter(v => v.learned).length || 0}
                </p>
                <p className="text-xs text-text-muted">Leaves Grown</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-500">
                  {plant.resources?.filter(r => r.completed).length || 0}
                </p>
                <p className="text-xs text-text-muted">Nutrients</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-500">
                  {plant.milestones?.filter(m => m.completed).length || 0}
                </p>
                <p className="text-xs text-text-muted">Stages Complete</p>
              </div>
            </div>
          </div>

          {/* Water Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWater}
            disabled={!needsWater}
            className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${
              needsWater
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-bg-tertiary text-text-muted'
            }`}
          >
            <Droplets size={24} />
            <span className="text-sm font-medium">
              {needsWater ? 'Water Me!' : 'Watered ✓'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'growth', label: 'Growth Stages', icon: '🌱' },
          { id: 'leaves', label: 'Leaves (Vocabulary)', icon: '🍃' },
          { id: 'nutrients', label: 'Nutrients (Resources)', icon: '💧' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeSection === tab.id
                ? 'bg-accent-primary text-white'
                : 'bg-bg-secondary text-text-muted hover:bg-bg-tertiary'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'growth' && (
          <GrowthSection
            key="growth"
            plant={plant}
            onAddMilestone={onAddMilestone}
            onToggleMilestone={onToggleMilestone}
            onRemoveMilestone={onRemoveMilestone}
          />
        )}
        {activeSection === 'leaves' && (
          <LeavesSection
            key="leaves"
            plant={plant}
            onAdd={onAddVocabulary}
            onRemove={onRemoveVocabulary}
            onToggle={onToggleVocabulary}
          />
        )}
        {activeSection === 'nutrients' && (
          <NutrientsSection
            key="nutrients"
            plant={plant}
            onAdd={onAddResource}
            onRemove={onRemoveResource}
            onToggle={onToggleResource}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============ GROWTH SECTION (Milestones) ============
function GrowthSection({ plant, onAddMilestone, onToggleMilestone, onRemoveMilestone }) {
  const [newMilestone, setNewMilestone] = useState('')
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [filter, setFilter] = useState('all')
  const milestones = plant.milestones || []

  const filtered = filter === 'all' ? milestones
    : filter === 'pending' ? milestones.filter(m => !m.completed)
    : milestones.filter(m => m.completed)

  const handleAdd = () => {
    if (newMilestone.trim()) {
      onAddMilestone(plant.id, newMilestone.trim())
      setNewMilestone('')
    }
  }

  const handleOpenLesson = (milestone) => {
    if (milestone.lesson || milestone.exercises || milestone.scripts || milestone.quiz) {
      setSelectedLesson(milestone)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Growth Timeline Visual */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-border">
        <h3 className="font-semibold text-text-primary mb-4">Growth Timeline</h3>
        <div className="flex justify-between items-center">
          {GROWTH_STAGES.map((stg, i) => {
            const progress = calculateProgress(plant)
            const isReached = progress >= stg.minProgress
            const isCurrent = getGrowthStage(progress).name === stg.name

            return (
              <div key={stg.name} className="flex flex-col items-center">
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`text-2xl ${isReached ? '' : 'opacity-30 grayscale'}`}
                >
                  {stg.icon}
                </motion.div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-emerald-500 font-medium' : 'text-text-muted'}`}>
                  {stg.minProgress}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary">
            Milestones ({milestones.filter(m => m.completed).length}/{milestones.length})
          </h3>
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'To Do' },
              { id: 'done', label: 'Done' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  filter === f.id ? 'bg-emerald-500 text-white' : 'text-text-muted hover:bg-bg-tertiary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add Milestone */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="Add a milestone (e.g., Complete Chapter 1)"
            className="flex-1 px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!newMilestone.trim()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {/* Milestone List */}
        {filtered.length === 0 ? (
          <p className="text-center text-text-muted py-8">
            {filter === 'all' ? 'Add milestones to track your growth stages' : `No ${filter} milestones`}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((milestone) => (
              <MilestoneRow
                key={milestone.id}
                milestone={milestone}
                onOpenLesson={() => handleOpenLesson(milestone)}
                onToggleComplete={() => onToggleMilestone(plant.id, milestone.id)}
                onRemove={() => onRemoveMilestone(plant.id, milestone.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lesson Side Panel */}
      <LessonPanel
        lesson={selectedLesson}
        onClose={() => setSelectedLesson(null)}
      />
    </motion.div>
  )
}

// ============ MILESTONE ROW (Simple row that opens panel) ============
function MilestoneRow({ milestone, onOpenLesson, onToggleComplete, onRemove }) {
  const hasLesson = milestone.lesson || milestone.exercises || milestone.scripts || milestone.quiz
  const hasDetails = milestone.description || milestone.link || milestone.steps?.length > 0 || hasLesson

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        milestone.completed
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-bg-tertiary border-border hover:border-purple-500/50'
      }`}
    >
      <button
        onClick={onToggleComplete}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          milestone.completed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-text-muted hover:border-emerald-500'
        }`}
      >
        {milestone.completed && <Check size={14} />}
      </button>

      <button
        onClick={hasDetails ? onOpenLesson : undefined}
        className={`flex-1 text-left flex items-center gap-2 ${hasDetails ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`${milestone.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
          {milestone.title}
        </span>
        {hasLesson && (
          <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded font-medium">
            📖 Tutorial
          </span>
        )}
        {milestone.estimatedTime && !hasLesson && (
          <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded">
            {milestone.estimatedTime}
          </span>
        )}
      </button>

      {hasDetails && (
        <button
          onClick={onOpenLesson}
          className="p-1.5 text-purple-500 hover:bg-purple-500/10 rounded-lg transition-colors"
          title="Open lesson"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {milestone.link && (
        <a
          href={milestone.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
          title="Open resource"
        >
          <ExternalLink size={16} />
        </a>
      )}

      <button
        onClick={onRemove}
        className="p-1 text-text-muted hover:text-red-500 rounded transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

// ============ LESSON SIDE PANEL (70% width) ============
function LessonPanel({ lesson, onClose }) {
  const [activeTab, setActiveTab] = useState('lesson')

  if (!lesson) return null

  const hasLesson = lesson.lesson || lesson.exercises || lesson.scripts || lesson.quiz

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-[70%] bg-bg-primary border-l border-border z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary mb-1">{lesson.title}</h2>
            <div className="flex items-center gap-4">
              {lesson.estimatedTime && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} />
                  <span>{lesson.estimatedTime}</span>
                </div>
              )}
              {lesson.link && (
                <a
                  href={lesson.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                >
                  <ExternalLink size={12} />
                  <span>Open Resource</span>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        {hasLesson && (
          <div className="flex gap-1 p-3 border-b border-border bg-bg-secondary overflow-x-auto">
            {[
              { id: 'lesson', label: '📖 Lesson', show: lesson.lesson },
              { id: 'steps', label: '✅ Steps', show: lesson.steps?.length > 0 },
              { id: 'exercises', label: '🎯 Practice', show: lesson.exercises?.length > 0 },
              { id: 'scripts', label: '🎤 Scripts', show: lesson.scripts?.length > 0 },
              { id: 'quiz', label: '❓ Quiz', show: lesson.quiz?.length > 0 }
            ].filter(t => t.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-bg-tertiary text-text-muted hover:bg-bg-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'lesson' && (
              <motion.div
                key="lesson"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {lesson.description && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-text-primary leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>
                )}
                {lesson.lesson && (
                  <div className="prose prose-sm prose-invert max-w-none">
                    {lesson.lesson.split('\n\n').map((paragraph, i) => (
                      <div key={i} className="mb-4">
                        {paragraph.startsWith('##') ? (
                          <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3 flex items-center gap-2">
                            <span className="text-purple-500">▸</span>
                            {paragraph.replace('## ', '')}
                          </h3>
                        ) : paragraph.startsWith('**') ? (
                          <p className="text-base font-medium text-text-primary">
                            {paragraph.replace(/\*\*/g, '')}
                          </p>
                        ) : paragraph.startsWith('- ') ? (
                          <ul className="list-none space-y-2 ml-4">
                            {paragraph.split('\n').map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-text-muted">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{item.replace('- ', '')}</span>
                              </li>
                            ))}
                          </ul>
                        ) : paragraph.startsWith('>') ? (
                          <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-500/5 rounded-r-lg">
                            <p className="text-sm italic text-text-muted">
                              {paragraph.replace('> ', '')}
                            </p>
                          </blockquote>
                        ) : (
                          <p className="text-sm text-text-muted leading-relaxed">
                            {paragraph}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!lesson.lesson && !lesson.description && (
                  <p className="text-text-muted text-center py-8">No lesson content yet</p>
                )}
              </motion.div>
            )}

            {activeTab === 'steps' && (
              <motion.div
                key="steps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-medium text-text-muted mb-4">Follow these steps to complete this milestone:</h3>
                {lesson.steps?.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-bg-secondary border border-border">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-text-primary pt-1">{step}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'exercises' && (
              <motion.div
                key="exercises"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-medium text-text-muted mb-4">Practice these exercises to build your skills:</h3>
                {lesson.exercises?.map((exercise, i) => (
                  <div key={i} className="p-4 rounded-xl bg-bg-secondary border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{exercise.icon || '🎯'}</span>
                      <h4 className="text-base font-medium text-text-primary">{exercise.title}</h4>
                    </div>
                    <p className="text-sm text-text-muted mb-4">{exercise.instruction}</p>
                    {exercise.example && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 mb-2 font-medium">EXAMPLE:</p>
                        <p className="text-sm text-emerald-300 font-mono">{exercise.example}</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'scripts' && (
              <motion.div
                key="scripts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-medium text-text-muted mb-4">Practice saying these scripts out loud:</h3>
                {lesson.scripts?.map((script, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">🎤</span>
                      <h4 className="text-base font-medium text-text-primary">{script.situation}</h4>
                    </div>
                    <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                      <p className="text-base text-purple-300 font-medium leading-relaxed">
                        "{script.text}"
                      </p>
                    </div>
                    {script.tip && (
                      <p className="text-sm text-text-muted mt-3 flex items-start gap-2">
                        <span className="text-amber-500">💡</span>
                        <span><strong>Tip:</strong> {script.tip}</span>
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-sm font-medium text-text-muted mb-4">Test your understanding:</h3>
                <QuizSection questions={lesson.quiz || []} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-secondary flex items-center justify-between">
          {lesson.link && (
            <a
              href={lesson.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Target size={16} />
              Start This Task
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-muted hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ============ QUIZ SECTION ============
function QuizSection({ questions }) {
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  const handleAnswer = (qIndex, answer) => {
    setAnswers(prev => ({ ...prev, [qIndex]: answer }))
  }

  const score = Object.entries(answers).filter(
    ([qIndex, answer]) => questions[parseInt(qIndex)]?.correct === answer
  ).length

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">Test your understanding:</p>

      {questions.map((q, i) => (
        <div key={i} className="p-3 rounded-lg bg-bg-secondary">
          <p className="text-sm font-medium text-text-primary mb-3">{i + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((option, j) => (
              <button
                key={j}
                onClick={() => !showResults && handleAnswer(i, j)}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                  showResults
                    ? j === q.correct
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : answers[i] === j
                        ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                        : 'bg-bg-tertiary text-text-muted'
                    : answers[i] === j
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-bg-tertiary text-text-muted hover:bg-bg-primary'
                }`}
              >
                {String.fromCharCode(65 + j)}. {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowResults(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Check Answers
        </button>
        {showResults && (
          <span className={`text-sm font-medium ${score === questions.length ? 'text-emerald-500' : 'text-amber-500'}`}>
            Score: {score}/{questions.length} {score === questions.length && '🎉'}
          </span>
        )}
      </div>
    </div>
  )
}

// ============ LEAVES SECTION (Vocabulary) ============
function LeavesSection({ plant, onAdd, onRemove, onToggle }) {
  const [showForm, setShowForm] = useState(false)
  const [newWord, setNewWord] = useState({ word: '', meaning: '', example: '' })
  const [filter, setFilter] = useState('all')

  const vocabulary = plant.vocabulary || []
  const filtered = filter === 'all' ? vocabulary
    : filter === 'grown' ? vocabulary.filter(v => v.learned)
    : vocabulary.filter(v => !v.learned)

  const handleAdd = () => {
    if (newWord.word.trim() && newWord.meaning.trim()) {
      onAdd(plant.id, newWord)
      setNewWord({ word: '', meaning: '', example: '' })
      setShowForm(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { id: 'all', label: `All (${vocabulary.length})` },
            { id: 'growing', label: `Growing (${vocabulary.filter(v => !v.learned).length})` },
            { id: 'grown', label: `Grown (${vocabulary.filter(v => v.learned).length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-text-muted hover:bg-bg-tertiary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm"
        >
          <Leaf size={14} />
          Add Leaf
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
          <input
            type="text"
            value={newWord.word}
            onChange={(e) => setNewWord(prev => ({ ...prev, word: e.target.value }))}
            placeholder="Word or phrase"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
            autoFocus
          />
          <input
            type="text"
            value={newWord.meaning}
            onChange={(e) => setNewWord(prev => ({ ...prev, meaning: e.target.value }))}
            placeholder="Meaning"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={newWord.example}
            onChange={(e) => setNewWord(prev => ({ ...prev, example: e.target.value }))}
            placeholder="Example (optional)"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-emerald-500 text-white rounded-lg">
              Plant Leaf
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-text-muted hover:bg-bg-tertiary rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Leaves Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <span className="text-4xl mb-2 block">🍃</span>
          No leaves yet. Add vocabulary to grow leaves on your plant!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(word => (
            <motion.div
              key={word.id}
              layout
              className={`p-4 rounded-xl border transition-all ${
                word.learned
                  ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30'
                  : 'bg-bg-secondary border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={word.learned ? 'text-lg' : 'text-lg opacity-50'}>
                    {word.learned ? '🍃' : '🌱'}
                  </span>
                  <span className="font-medium text-text-primary">{word.word}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onToggle(plant.id, word.id)}
                    className={`p-1 rounded transition-colors ${
                      word.learned ? 'text-emerald-500' : 'text-text-muted hover:text-emerald-500'
                    }`}
                    title={word.learned ? 'Mark as growing' : 'Mark as grown'}
                  >
                    {word.learned ? <Check size={16} /> : <RotateCcw size={14} />}
                  </button>
                  <button
                    onClick={() => onRemove(plant.id, word.id)}
                    className="p-1 text-text-muted hover:text-red-500 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-text-muted">{word.meaning}</p>
              {word.example && (
                <p className="text-xs text-text-muted mt-1 italic">"{word.example}"</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ============ NUTRIENTS SECTION (Resources) ============
function NutrientsSection({ plant, onAdd, onRemove, onToggle }) {
  const [showForm, setShowForm] = useState(false)
  const [newResource, setNewResource] = useState({ title: '', type: 'book', url: '', notes: '' })
  const [markdownViewer, setMarkdownViewer] = useState({ isOpen: false, filePath: '', fileName: '' })

  const resources = plant.resources || []
  const types = { book: '📚', video: '🎬', article: '📰', course: '🎓', podcast: '🎙️', other: '📌' }

  // Helper to check if URL is a local .md file
  const isLocalMarkdownFile = (url) => url && url.startsWith('/') && url.endsWith('.md')

  // Open markdown viewer for local .md files
  const openMarkdownViewer = (resource) => {
    const fileName = resource.url.split('/').pop()
    setMarkdownViewer({ isOpen: true, filePath: resource.url, fileName })
  }

  const handleAdd = () => {
    if (newResource.title.trim()) {
      onAdd(plant.id, newResource)
      setNewResource({ title: '', type: 'book', url: '', notes: '' })
      setShowForm(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-text-muted">
          {resources.filter(r => r.completed).length} of {resources.length} absorbed
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm"
        >
          <Droplets size={14} />
          Add Nutrient
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-secondary rounded-xl p-4 border border-border space-y-3">
          <input
            type="text"
            value={newResource.title}
            onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Resource title"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={newResource.type}
              onChange={(e) => setNewResource(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            >
              {Object.entries(types).map(([key, icon]) => (
                <option key={key} value={key}>{icon} {key}</option>
              ))}
            </select>
            <input
              type="text"
              value={newResource.url}
              onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
              placeholder="URL (optional)"
              className="flex-1 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-text-muted hover:bg-bg-tertiary rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <span className="text-4xl mb-2 block">💧</span>
          No nutrients yet. Add resources to feed your plant!
        </div>
      ) : (
        <div className="space-y-2">
          {resources.map(resource => (
            <div
              key={resource.id}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                resource.completed
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-bg-secondary border-border'
              }`}
            >
              <button
                onClick={() => onToggle(plant.id, resource.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  resource.completed
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-text-muted hover:border-blue-500'
                }`}
              >
                {resource.completed && <Check size={14} />}
              </button>
              <span className="text-xl">{types[resource.type] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <span className={`block ${resource.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {resource.title}
                </span>
                {resource.notes && (
                  <span className="text-xs text-text-muted truncate block">{resource.notes}</span>
                )}
              </div>
              {isLocalMarkdownFile(resource.url) ? (
                <button
                  onClick={() => openMarkdownViewer(resource)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
              ) : resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-blue-500 text-sm hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <ExternalLink size={14} />
                  Open
                </a>
              )}
              <button
                onClick={() => onRemove(plant.id, resource.id)}
                className="p-1 text-text-muted hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Markdown Viewer Modal */}
      <MarkdownViewer
        isOpen={markdownViewer.isOpen}
        onClose={() => setMarkdownViewer({ isOpen: false, filePath: '', fileName: '' })}
        filePath={markdownViewer.filePath}
        fileName={markdownViewer.fileName}
      />
    </motion.div>
  )
}

// ============ MODALS ============
function PlantNewModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (name.trim()) {
      onCreate({ name: name.trim(), description: description.trim() })
      setName('')
      setDescription('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-primary rounded-2xl border border-border p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl block mb-2"
          >
            🌱
          </motion.span>
          <h2 className="text-xl font-bold text-text-primary">Plant a New Skill</h2>
          <p className="text-text-muted text-sm">Start your learning journey</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-2">Skill Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spanish, Python, Guitar"
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2">Goal (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={2}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-text-muted hover:bg-bg-tertiary rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium disabled:opacity-50"
          >
            🌱 Plant Seed
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function PlantSettingsModal({ isOpen, onClose, plant, onUpdate, onDelete, onReset }) {
  const [name, setName] = useState(plant?.name || '')

  if (!isOpen || !plant) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-primary rounded-2xl border border-border p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-text-primary mb-4">Plant Settings</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-text-muted mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-bg-tertiary border border-border rounded-xl text-text-primary"
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-amber-500 hover:bg-amber-500/10 rounded-xl"
          >
            <RotateCcw size={18} />
            Reset to Seed
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl"
          >
            <Trash2 size={18} />
            Uproot Plant
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-text-muted hover:bg-bg-tertiary rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => { onUpdate({ name }); onClose() }}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ============ HELPER FUNCTIONS ============
function calculateProgress(plant) {
  const vocab = plant.vocabulary || []
  const resources = plant.resources || []
  const milestones = plant.milestones || []

  const vocabProgress = vocab.length > 0 ? (vocab.filter(v => v.learned).length / vocab.length) * 30 : 0
  const resourceProgress = resources.length > 0 ? (resources.filter(r => r.completed).length / resources.length) * 30 : 0
  const milestoneProgress = milestones.length > 0 ? (milestones.filter(m => m.completed).length / milestones.length) * 40 : 0

  return Math.round(vocabProgress + resourceProgress + milestoneProgress)
}

function getGrowthStage(progress) {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (progress >= GROWTH_STAGES[i].minProgress) {
      return GROWTH_STAGES[i]
    }
  }
  return GROWTH_STAGES[0]
}

function checkNeedsWater(plant) {
  if (!plant.streak?.lastPracticeDate) return true
  const lastDate = new Date(plant.streak.lastPracticeDate).toDateString()
  const today = new Date().toDateString()
  return lastDate !== today
}

export default SkillMasteryView
