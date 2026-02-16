// @ts-nocheck
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ArrowLeft, Settings, Droplets, Sun, Leaf, BookOpen,
  Sparkles, Trophy, X, Check, RotateCcw, Trash2, ChevronRight,
  ChevronDown, ExternalLink, ListChecks, Clock, Target, Search, Eye
} from 'lucide-react'
import { useSkillMastery } from '../hooks/useSkillMastery'
import { MarkdownViewer } from '../../../shared/components/MarkdownViewer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, useNodesState, useEdgesState, addEdge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { PlantNewModal } from './PlantNewModal'
import { RoutineSection } from './RoutineSection'
import { JournalSection } from './JournalSection'

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
    resetProgress,
    logDailyActivity
  } = useSkillMastery()

  // Get selected plant from URL params
  const selectedPlant = useMemo(() => {
    if (!pathId) return null
    return paths.find(p => p.id === pathId) || null
  }, [pathId, paths])

  const [showPlantModal, setShowPlantModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('skillGardenView') || 'grid') // 'grid', 'compact', or 'tree'

  useEffect(() => {
    localStorage.setItem('skillGardenView', viewMode)
  }, [viewMode])

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
            onLog={logDailyActivity}
          />
        ) : (
          <GardenView
            key="garden"
            plants={paths}
            onSelectPlant={(plant) => navigate(`/skills/${plant.id}`)}
            onPlantNew={() => setShowPlantModal(true)}
            viewMode={viewMode}
            onToggleView={setViewMode}
            onToggleMilestone={toggleMilestone}
            onToggleVocabulary={toggleVocabularyLearned}
            onToggleResource={toggleResourceCompleted}
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
function GardenView({ plants, onSelectPlant, onPlantNew, viewMode, onToggleView, onToggleMilestone, onToggleVocabulary, onToggleResource }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Stitch Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Leaf className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">Skill Garden</h1>
                <p className="text-sm text-text-muted">Nurture your skills into mastery</p>
              </div>
            </div>
          </div>

          {/* Stitch View Tabs */}
          <div className="flex items-center border-b border-border">
            {[
              { id: 'grid', label: 'Grid' },
              { id: 'compact', label: 'Compact' },
              { id: 'tree', label: 'Tree' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => onToggleView(mode.id)}
                className={`flex items-center gap-1.5 px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${viewMode === mode.id
                  ? 'text-emerald-500 border-emerald-500'
                  : 'text-text-muted border-transparent hover:text-text-secondary hover:border-border'
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Garden Stats */}
      {plants.length > 0 && (
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{plants.length}</p>
            <p className="text-xs text-text-secondary">Plants Growing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">
              {plants.reduce((acc, p) => acc + (p.streak?.current || 0), 0)}
            </p>
            <p className="text-xs text-text-secondary">Total Streak Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">
              {plants.reduce((acc, p) => acc + (p.vocabulary?.filter(v => v.learned).length || 0), 0)}
            </p>
            <p className="text-xs text-text-secondary">Leaves Grown</p>
          </div>
        </div>
      )}

      {/* Garden Content Area */}
      {plants.length === 0 ? (
        <EmptyGarden onPlantNew={onPlantNew} />
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
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
                className="h-72 rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 flex flex-col items-center justify-center gap-4 transition-all group hover:bg-emerald-500/5"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={32} className="text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="font-black text-text-primary text-xs tracking-widest uppercase">Plant New</p>
                  <p className="text-[10px] text-text-secondary uppercase">Expand your garden</p>
                </div>
              </motion.button>
            </motion.div>
          )}

          {viewMode === 'compact' && (
            <CompactView key="compact" plants={plants} onSelect={onSelectPlant} onPlantNew={onPlantNew} />
          )}

          {viewMode === 'tree' && (
            <GardenTreeView
              key="tree"
              plants={plants}
              onSelect={onSelectPlant}
              onToggleMilestone={onToggleMilestone}
              onToggleVocabulary={onToggleVocabulary}
              onToggleResource={onToggleResource}
            />
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}

// ============ COMPACT CLUSTER VIEW ============
function CompactView({ plants, onSelect, onPlantNew }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-12 bg-bg-secondary rounded-[2.5rem] border border-border min-h-[500px] relative overflow-hidden"
    >
      <div className="flex flex-wrap justify-center gap-8 relative z-10">
        {plants.map((plant, i) => {
          const progress = calculateProgress(plant)
          const stage = getGrowthStage(progress)

          return (
            <motion.button
              key={plant.id}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(plant)}
              className="flex flex-col items-center group"
            >
              <div
                className="w-24 h-24 rounded-[2rem] bg-bg-primary border-4 border-bg-tertiary flex items-center justify-center text-4xl shadow-xl transition-all group-hover:border-emerald-500 relative"
                style={{ boxShadow: `0 10px 30px -10px ${stage.color}20` }}
              >
                {plant.icon || stage.icon}

                {/* Micro Progress Ring */}
                <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity scale-110" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] font-black text-text-primary uppercase tracking-widest truncate max-w-[120px]">
                  {plant.name}
                </p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <p className="text-[8px] font-bold text-text-secondary uppercase">{progress}%</p>
                </div>
              </div>
            </motion.button>
          )
        })}

        <motion.button
          onClick={onPlantNew}
          whileHover={{ scale: 1.1 }}
          className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center text-text-secondary hover:text-emerald-500 hover:border-emerald-500/50 transition-all"
        >
          <Plus size={32} />
        </motion.button>
      </div>

      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Leaf size={16} className="text-emerald-500" />
        <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">Cluster Visualization</span>
      </div>
    </motion.div>
  )
}

// ============ NODE CONTEXT MENU ============
function NodeContextMenu({ id, top, left, right, bottom, onNavigate, onClose }) {
  return (
    <div
      style={{ top, left, right, bottom }}
      className="absolute z-50 bg-bg-primary border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px] py-1 flex flex-col"
    >
      <button
        onClick={() => { onNavigate(); onClose() }}
        className="text-left px-4 py-2.5 text-sm hover:bg-bg-secondary flex items-center gap-2 text-text-primary transition-colors"
      >
        <ExternalLink size={14} className="text-emerald-500" />
        Open Project
      </button>
    </div>
  )
}


// ============ GARDEN TREE VIEW (REACT FLOW) ============
function GardenTreeView({ plants, onSelect, onToggleMilestone, onToggleVocabulary, onToggleResource }) {
  // Track expanded state: { [plantId]: { isExpanded: boolean, categories: { [catId]: boolean } } }
  const [expandedState, setExpandedState] = useState<Record<string, any>>({})
  const [menu, setMenu] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const ref = useRef<any>(null)

  const togglePlant = (plantId) => {
    setExpandedState(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        isExpanded: !prev[plantId]?.isExpanded
      }
    }))
  }

  const toggleCategory = (plantId, catId) => {
    setExpandedState(prev => ({
      ...prev,
      [plantId]: {
        ...prev[plantId],
        categories: {
          ...prev[plantId]?.categories,
          [catId]: !prev[plantId]?.categories?.[catId]
        }
      }
    }))
  }

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = [
      {
        id: 'garden-root',
        type: 'skill',
        position: { x: 0, y: 300 },
        data: { label: 'SKILL GARDEN', icon: '🌿', isRoot: true, description: 'The central hub of all your growing skills.' }
      }
    ]

    const edges = []

    const filteredPlants = plants.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    filteredPlants.forEach((plant, plantIdx) => {
      const progress = calculateProgress(plant)
      const stage = getGrowthStage(progress)
      const plantNodeId = `garden-${plant.id}`

      const plantState = expandedState[plant.id] || {}
      const isPlantExpanded = plantState.isExpanded

      // Position plants vertically spread out
      // Dynamic spacing based on expansion could be complex, for now strict vertical layout
      const yPos = (plantIdx - (plants.length - 1) / 2) * (isPlantExpanded ? 800 : 150)

      nodes.push({
        id: plantNodeId,
        type: 'skill',
        position: { x: 400, y: yPos },
        data: {
          label: plant.name.toUpperCase(),
          icon: plant.icon || stage.icon,
          progress,
          isCategory: true, // Reuse category styling for expand toggle
          isExpanded: isPlantExpanded,
          onToggleExpand: () => togglePlant(plant.id),
          description: plant.description || `A growing skill in the ${stage.name} stage.`,
          plantId: plant.id
        }
      })

      edges.push({
        id: `ge-${plantNodeId}`,
        source: 'garden-root',
        target: plantNodeId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2, opacity: isPlantExpanded ? 1 : 0.5 }
      })

      // If Plant is Expanded, show Categories
      if (isPlantExpanded) {
        const categories = [
          { id: 'milestones', label: 'Milestones', icon: '🎯', data: plant.milestones || [], color: stage.color, type: 'milestone' },
          { id: 'vocab', label: 'Knowledge', icon: '📚', data: plant.vocabulary || [], color: '#3b82f6', type: 'vocab' },
          { id: 'resources', label: 'Resources', icon: '🔗', data: plant.resources || [], color: '#f59e0b', type: 'resource' }
        ]

        categories.forEach((cat, catIdx) => {
          const catNodeId = `${plantNodeId}-cat-${cat.id}`
          const isCatExpanded = plantState.categories?.[cat.id]
          const catYPos = yPos + (catIdx - 1) * 200

          nodes.push({
            id: catNodeId,
            type: 'skill',
            position: { x: 800, y: catYPos },
            data: {
              label: cat.label,
              icon: cat.icon,
              isCategory: true,
              isExpanded: isCatExpanded,
              onToggleExpand: () => toggleCategory(plant.id, cat.id),
              description: `Collection of ${cat.label} for ${plant.name}.`
            }
          })

          edges.push({
            id: `e-${plantNodeId}-${catNodeId}`,
            source: plantNodeId,
            target: catNodeId,
            animated: true,
            style: { stroke: stage.color, strokeWidth: 1.5 }
          })

          // If Category is Expanded, show Items
          if (isCatExpanded) {
            cat.data.forEach((item, itemIdx) => {
              const itemId = `${catNodeId}-item-${itemIdx}`
              const isDone = item.completed || item.learned
              // Use item.word for Vocab, item.title for others
              const label = item.title || item.term || item.word || 'Unknown'

              nodes.push({
                id: itemId,
                type: 'leaf',
                position: { x: 1200, y: catYPos + (itemIdx - (cat.data.length / 2)) * 80 },
                data: {
                  label: label,
                  icon: isDone ? '✅' : (item.icon || '○'),
                  color: cat.color,
                  isDone,
                  onToggle: () => {
                    if (cat.type === 'milestone') onToggleMilestone(plant.id, item.id)
                    if (cat.type === 'vocab') onToggleVocabulary(plant.id, item.id)
                    if (cat.type === 'resource') onToggleResource(plant.id, item.id)
                  }
                }
              })

              edges.push({
                id: `e-${catNodeId}-${itemId}`,
                source: catNodeId,
                target: itemId,
                style: { stroke: cat.color, strokeWidth: 1, opacity: 0.5 }
              })
            })
          }
        })
      }
    })
    return { nodes, edges }
  }, [plants, expandedState, searchQuery, onToggleMilestone, onToggleVocabulary, onToggleResource])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Layout synchronization
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const onNodeClick = (event, node) => {
    if (node.id === 'garden-root') return

    // If leaf node (Milestone/Vocab/Resource), navigate to project
    // Also if Category node, maybe navigate? User said "last node click"
    if (node.type === 'leaf' || node.id.includes('-cat-')) {
      const match = node.id.match(/^garden-([^-]+)/)
      if (match) {
        onSelect({ id: match[1] })
      }
    }
  }

  // Handle Context Menu
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault()
      // Use client coordinates relative to pane if possible, or just client for fixed
      // The menu is absolute positioned in the container.
      // We need offset relative to the container.
      const pane = ref.current.getBoundingClientRect()

      setMenu({
        id: node.id,
        top: event.clientY - pane.top,
        left: event.clientX - pane.left,
        data: node.data
      })
    },
    []
  )

  const onPaneClick = useCallback(() => setMenu(null), [])

  const handleNavigate = () => {
    if (menu?.data?.plantId) {
      onSelect({ id: menu.data.plantId })
    } else if (menu?.id.startsWith('garden-') && !menu.id.includes('-cat-')) {
      const plantId = menu.id.replace('garden-', '')
      onSelect({ id: plantId })
    }
    setMenu(null)
  }



  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-[85vh] w-full bg-bg-tertiary/20 rounded-[2.5rem] border border-border overflow-hidden relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.05}
        maxZoom={10}
        className="bg-bg-tertiary/10"
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Background gap={20} size={1} color="currentColor" className="opacity-[0.03] dark:opacity-[0.07]" />
        <Controls className="!bg-bg-primary !border-border !shadow-2xl !text-text-primary dark:!text-white border-2" />

        {menu && (
          <NodeContextMenu
            onClick={onPaneClick}
            {...menu}
            onNavigate={handleNavigate}
            onClose={() => setMenu(null)}
          />
        )}
      </ReactFlow>

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none group/controls">
        <div className="flex items-center gap-4 bg-bg-primary/40 backdrop-blur-md border border-border p-2 px-4 rounded-2xl pointer-events-auto shadow-sm">
          <Search size={14} className="text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search architecture..."
            className="bg-transparent border-none outline-none text-[10px] font-black tracking-widest text-text-primary placeholder:text-text-muted w-32 focus:w-48 transition-all uppercase"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-bg-tertiary rounded">
              <X size={12} className="text-text-muted" />
            </button>
          )}
        </div>

        <div className="p-3 px-5 rounded-2xl bg-bg-primary/40 backdrop-blur-md border border-border shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Project Mapping Active</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-bg-primary/80 backdrop-blur-md border border-border shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Mastery Network</span>
        </div>
        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-tighter">Right-click nodes for options</p>
      </div>

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
      <p className="text-text-secondary mb-6 text-center max-w-md">
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
      className="relative h-72 rounded-2xl bg-bg-secondary border border-border hover:border-accent-primary transition-all overflow-hidden group shadow-sm hover:shadow-md"
    >
      {/* Stage Color Accent Top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: stage.color }}
      />

      {/* Main Content Area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-16">
        <PlantVisualization stage={stage} progress={progress} />
      </div>

      {/* Floating Indicators */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        {plant.streak?.current > 0 ? (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-bold border border-orange-500/20">
            <span>🔥</span> {plant.streak.current}
          </div>
        ) : <div />}

        {needsWater && (
          <div className="text-blue-500 animate-bounce">
            <Droplets size={18} />
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-tertiary/50 backdrop-blur-sm border-t border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{plant.icon || '🌱'}</span>
          <h3 className="font-bold text-text-primary text-sm truncate uppercase tracking-tight">
            {plant.name}
          </h3>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1.5 py-0.5 bg-bg-secondary rounded">
            {stage.name}
          </span>
          <span className="text-xs font-black text-text-primary">{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-border/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full"
            style={{ backgroundColor: stage.color }}
          />
        </div>
      </div>
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
          y: [0, -4, 0],
          rotate: stageIndex > 3 ? [0, 1, -1, 0] : 0,
          scale: [1, 1.02, 1]
        }}
        transition={{
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="text-7xl block drop-shadow-2xl filter brightness-110"
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
  onRemoveMilestone,
  onLog
}) {
  const [activeSection, setActiveSection] = useState('growth')
  const [showTreeView, setShowTreeView] = useState(false)

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTreeView(!showTreeView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${showTreeView
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border'
              }`}
          >
            <Eye size={14} />
            {showTreeView ? 'HIDE TREE' : 'VIEW TREE'}
          </button>
          <button
            onClick={onSettings}
            className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            <Settings size={20} className="text-text-muted" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showTreeView ? (
          <PathTreeView
            key="tree"
            plant={plant}
            onToggleMilestone={onToggleMilestone}
            onToggleVocabulary={onToggleVocabulary}
            onToggleResource={onToggleResource}
          />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
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
                  className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all ${needsWater
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-bg-tertiary text-text-secondary'
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
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {[
                { id: 'growth', label: 'Growth Stages', icon: '🌱' },
                { id: 'routine', label: 'Daily Routine', icon: '📅' },
                { id: 'journal', label: 'Journal', icon: '📓' },
                { id: 'leaves', label: 'Leaves (Vocabulary)', icon: '🍃' },
                { id: 'nutrients', label: 'Nutrients (Resources)', icon: '💧' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${activeSection === tab.id
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
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
              {activeSection === 'routine' && (
                <RoutineSection
                  key="routine"
                  plant={plant}
                  onLog={(date, activity) => onLog(plant.id, date, activity)}
                />
              )}
              {activeSection === 'journal' && (
                <JournalSection
                  key="journal"
                  plant={plant}
                  onLog={(date, activity) => onLog(plant.id, date, activity)}
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
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============ CUSTOM NODES FOR REACT FLOW ============
const SkillNode = ({ data }) => (
  <div
    className={`p-4 rounded-2xl border-2 bg-bg-primary shadow-xl min-w-[200px] transition-all ${data.isRoot ? 'border-emerald-500 shadow-emerald-500/10' : 'border-border'
      } ${data.isCategory ? 'cursor-pointer hover:border-emerald-500/50' : ''}`}
    onClick={data.isCategory ? data.onToggleExpand : undefined}
  >
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-emerald-500" />
    <div className="flex items-center gap-3">
      <div className="text-3xl">{data.icon}</div>
      <div className="flex-1">
        <div className="text-[10px] font-black tracking-tighter text-text-primary uppercase break-words">{data.label}</div>
        {data.progress !== undefined && (
          <div className="text-[8px] font-bold text-emerald-500">{data.progress}% Growth</div>
        )}
        {data.isCategory && (
          <div className="text-[8px] text-text-secondary mt-1 font-bold uppercase tracking-widest flex items-center gap-1">
            {data.isExpanded ? '▼ COLLAPSE' : '▶ EXPAND'}
          </div>
        )}
      </div>
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500" />
  </div>
)

const LeafNode = ({ data }) => (
  <div
    className={`p-3 rounded-xl border bg-bg-secondary shadow-lg min-w-[160px] border-l-4 transition-all hover:scale-105`}
    style={{ borderLeftColor: data.color }}
  >
    <Handle type="target" position={Position.Left} className="w-2 h-2 opacity-50" />
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="text-sm shrink-0">{data.icon}</div>
        <div className="text-[9px] font-bold text-text-primary uppercase tracking-tight truncate">
          {data.label}
        </div>
      </div>
      {data.onToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            data.onToggle()
          }}
          className={`p-1 rounded-md transition-colors ${data.isDone ? 'bg-emerald-500/20 text-emerald-500' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
        >
          <Check size={10} />
        </button>
      )}
    </div>
  </div>
)

const nodeTypes = {
  skill: SkillNode,
  leaf: LeafNode
}

// ============ PATH TREE VIEW (DETAIL LEVEL - REACT FLOW) ============
// ============ PATH TREE VIEW (DETAIL LEVEL - REACT FLOW) ============
function PathTreeView({ plant, onToggleMilestone, onToggleVocabulary, onToggleResource }) {
  const [expandedCategories, setExpandedCategories] = useState({
    milestones: true,
    vocab: true,
    resources: true
  })

  // Use a ref to track the current plant ID to detect project switches
  const lastPlantId = useRef(plant.id)

  const initialData = useMemo(() => {
    const progress = calculateProgress(plant)
    const stage = getGrowthStage(progress)

    const nodes = [
      {
        id: 'root',
        type: 'skill',
        position: { x: 0, y: 300 },
        data: { label: plant.name, icon: plant.icon || stage.icon, progress, isRoot: true }
      }
    ]

    const edges = []

    const categories = [
      { id: 'milestones', label: 'Milestones', icon: '🎯', data: plant.milestones || [], color: stage.color, type: 'milestone' },
      { id: 'vocab', label: 'Knowledge', icon: '📚', data: plant.vocabulary || [], color: '#3b82f6', type: 'vocab' },
      { id: 'resources', label: 'Resources', icon: '🔗', data: plant.resources || [], color: '#f59e0b', type: 'resource' }
    ]

    categories.forEach((cat, idx) => {
      const catId = `cat-${cat.id}`
      const isExpanded = expandedCategories[cat.id]
      const yPos = idx * 600 // High spacing to prevent category overlap

      nodes.push({
        id: catId,
        type: 'skill',
        position: { x: 400, y: yPos },
        data: {
          label: cat.label,
          icon: cat.icon,
          isCategory: true,
          isExpanded,
          onToggleExpand: () => setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))
        }
      })

      edges.push({
        id: `e-root-${catId}`,
        source: 'root',
        target: catId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2, opacity: isExpanded ? 1 : 0.2 }
      })

      if (isExpanded) {
        cat.data.slice(0, 15).forEach((item, itemIdx) => {
          const itemId = `${catId}-item-${itemIdx}`
          const isDone = item.completed || item.learned

          nodes.push({
            id: itemId,
            type: 'leaf',
            position: { x: 800, y: yPos + (itemIdx - 4.5) * 100 }, // Absolute position, high vertical gap
            data: {
              label: item.title || item.term || item.word,
              icon: isDone ? '✅' : (item.icon || '⏳'),
              color: cat.color,
              isDone,
              onToggle: () => {
                if (cat.type === 'milestone') onToggleMilestone(plant.id, item.id)
                if (cat.type === 'vocab') onToggleVocabulary(plant.id, item.id)
                if (cat.type === 'resource') onToggleResource(plant.id, item.id)
              }
            }
          })

          edges.push({
            id: `e-${catId}-${itemId}`,
            source: catId,
            target: itemId,
            style: { stroke: cat.color, strokeWidth: 1, opacity: 0.4 }
          })
        })
      }
    })

    return { nodes, edges }
  }, [plant, expandedCategories, onToggleMilestone, onToggleVocabulary, onToggleResource])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (lastPlantId.current !== plant.id) {
      // Full switch: reset everything to initial calculated positions
      setNodes(initialData.nodes)
      setEdges(initialData.edges)
      lastPlantId.current = plant.id
    } else {
      // Internal update (toggle/expand): SYNC data/metadata, but KEEP current positions
      setNodes(nds => {
        // 1. Identify what should exist now based on initialData (considering expand/collapse)
        return initialData.nodes.map(newNode => {
          const existingNode = nds.find(n => n.id === newNode.id)
          if (existingNode) {
            // Persist the user-dragged position
            return {
              ...newNode,
              position: existingNode.position,
              data: { ...newNode.data }
            }
          }
          return newNode // New node (e.g. from expanding)
        })
      })
      setEdges(initialData.edges)
    }
  }, [initialData, plant.id, setNodes, setEdges])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-[600px] w-full bg-bg-secondary rounded-[2.5rem] border border-border overflow-hidden relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={10}
        className="bg-bg-tertiary/20"
        snapToGrid={true}
        snapGrid={[20, 20]}
      >
        <Background gap={20} size={1} color="currentColor" className="opacity-[0.03] dark:opacity-[0.07]" />
        <Controls className="!bg-bg-primary !border-border !shadow-2xl !text-text-primary dark:!text-white border-2" />
      </ReactFlow>

      <div className="absolute top-8 left-8 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-emerald-500" />
          <p className="text-xl font-black text-text-primary uppercase tracking-tighter">Neural Path Architecture</p>
        </div>
        <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Reactive Map of Potential</p>
      </div>
    </motion.div>
  )
}

// ============ GROWTH SECTION (Milestones) ============
function GrowthSection({ plant, onAddMilestone, onToggleMilestone, onRemoveMilestone }) {
  const [newMilestone, setNewMilestone] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
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
                <span className={`text-xs mt-1 ${isCurrent ? 'text-emerald-500 font-medium' : 'text-text-secondary'}`}>
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
                className={`px-2 py-1 rounded text-xs transition-colors ${filter === f.id ? 'bg-emerald-500 text-white' : 'text-text-secondary hover:bg-bg-tertiary'
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
          <p className="text-center text-text-secondary py-8">
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
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${milestone.completed
        ? 'bg-emerald-500/10 border-emerald-500/30'
        : 'bg-bg-tertiary border-border hover:border-purple-500/50'
        }`}
    >
      <button
        onClick={onToggleComplete}
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${milestone.completed
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

// ============ LESSON SIDE PANEL ============
function LessonPanel({ lesson, onClose }) {
  const [activeTab, setActiveTab] = useState('lesson')

  if (!lesson) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 px-4"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full md:w-[70%] bg-bg-primary z-50 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] border-l border-border/50"
      >
        {/* Header - High End */}
        <div className="flex items-center justify-between p-8 border-b border-border/50">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Milestone Lesson
              </span>
              {lesson.estimatedTime && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium">
                  <Clock size={12} className="text-emerald-500" />
                  <span>{lesson.estimatedTime}</span>
                </div>
              )}
            </div>
            <h2 className="text-3xl font-black text-text-primary tracking-tight leading-tight">{lesson.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center hover:bg-bg-secondary rounded-full transition-all group"
          >
            <X size={24} className="text-text-secondary group-hover:text-text-primary transition-colors" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 bg-bg-secondary/30 backdrop-blur-md border-b border-border/50">
          <div className="flex gap-10">
            {[
              { id: 'lesson', label: 'THE LESSON', icon: '📖' },
              { id: 'practice', label: 'PRACTICE', icon: '🎯' },
              { id: 'quiz', label: 'KNOWLEDGE CHECK', icon: '❓' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-5 text-xs font-black tracking-[0.2em] transition-all relative ${activeTab === tab.id
                  ? 'text-emerald-500'
                  : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="lessonActiveBar"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Immersive Focus Mode */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-bg-primary via-bg-secondary/10 to-bg-primary">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <AnimatePresence mode="wait">
              {activeTab === 'lesson' && (
                <motion.div
                  key="lesson"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="prose prose-emerald dark:prose-invert max-w-none prose-headings:font-black prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-text-primary"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.lesson || lesson.description || 'No lesson content available.'}
                  </ReactMarkdown>
                </motion.div>
              )}

              {activeTab === 'practice' && (
                <motion.div
                  key="practice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Steps */}
                  {lesson.steps && lesson.steps.length > 0 && (
                    <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                      <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-3">
                        <ListChecks size={24} /> Steps to Complete
                      </h3>
                      <div className="space-y-3">
                        {lesson.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-bg-primary/50">
                            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-text-secondary leading-relaxed text-sm">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exercises */}
                  {lesson.exercises && lesson.exercises.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
                        <Sparkles size={24} className="text-amber-500" /> Practice Exercises
                      </h3>
                      <div className="space-y-4">
                        {lesson.exercises.map((exercise, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-bg-secondary border border-border hover:border-amber-500/30 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">{exercise.icon}</span>
                              <h4 className="font-bold text-text-primary">{exercise.title}</h4>
                            </div>
                            <p className="text-text-secondary text-sm leading-relaxed mb-3">{exercise.instruction}</p>
                            {exercise.example && (
                              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Example</p>
                                <pre className="text-text-secondary text-sm font-mono whitespace-pre-wrap">{exercise.example}</pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scripts */}
                  {lesson.scripts && lesson.scripts.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black text-text-primary mb-6 flex items-center gap-3">
                        <BookOpen size={24} className="text-blue-500" /> Practice Scripts
                      </h3>
                      <div className="space-y-4">
                        {lesson.scripts.map((script, i) => (
                          <div key={i} className="p-6 rounded-2xl bg-bg-secondary border border-border hover:border-blue-500/30 transition-all">
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">{script.situation}</p>
                            <p className="text-text-primary leading-relaxed mb-3 italic border-l-2 border-blue-500/30 pl-4">"{script.text}"</p>
                            {script.tip && (
                              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                <span className="text-blue-500 text-xs font-bold uppercase mt-0.5">💡 Tip:</span>
                                <p className="text-text-secondary text-sm">{script.tip}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state - only when no content exists */}
                  {(!lesson.steps || lesson.steps.length === 0) &&
                    (!lesson.exercises || lesson.exercises.length === 0) &&
                    (!lesson.scripts || lesson.scripts.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <Target size={48} className="text-border" />
                        <p className="text-text-secondary">No practice content available for this milestone yet.</p>
                      </div>
                    )}
                </motion.div>
              )}

              {activeTab === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <QuizSection questions={lesson.quiz || []} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-border/50 bg-bg-primary flex items-center justify-between">
          <div className="flex items-center gap-4">
            {lesson.link && (
              <a
                href={lesson.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
              >
                <ExternalLink size={18} />
                Expand Knowledge
              </a>
            )}
            <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
              <Check size={18} />
              Complete Milestone
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
          >
            Close Study
          </button>
        </div>
      </motion.div>
    </>
  )
}

// ============ QUIZ SECTION ============
function QuizSection({ questions }) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
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
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${showResults
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
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f.id
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
              className={`p-4 rounded-xl border transition-all ${word.learned
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
                    className={`p-1 rounded transition-colors ${word.learned ? 'text-emerald-500' : 'text-text-muted hover:text-emerald-500'
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
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${resource.completed
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-bg-secondary border-border'
                }`}
            >
              <button
                onClick={() => onToggle(plant.id, resource.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${resource.completed
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

// Internal Update Modal (kept here for now or extract later)

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
