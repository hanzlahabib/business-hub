import { useState } from 'react'
import { motion } from 'framer-motion'
import { SKILL_TEMPLATES } from '../data/templates'

export function PlantNewModal({ isOpen, onClose, onCreate }) {
    const [selectedTemplateId, setSelectedTemplateId] = useState('blank')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    const selectedTemplate = SKILL_TEMPLATES.find(t => t.id === selectedTemplateId)

    const handleCreate = () => {
        if (name.trim()) {
            onCreate({
                name: name.trim(),
                description: description.trim(),
                templateId: selectedTemplateId
            })
            setName('')
            setDescription('')
            setSelectedTemplateId('blank') // Reset
            onClose()
        }
    }

    // Pre-fill description if switching to Brain Mastery and description is empty
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId)
        // Optional: could pre-fill name/desc here if we wanted
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-bg-primary rounded-[2rem] border border-border p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.span
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-6xl block mb-4"
                    >
                        {selectedTemplate?.icon || '🌱'}
                    </motion.span>
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Plant a New Seed</h2>
                    <p className="text-text-muted mt-2">Choose a path for your growth journey</p>
                </div>

                <div className="space-y-8">

                    {/* Template Selection */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Select Template</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {SKILL_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.id)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selectedTemplateId === template.id
                                            ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50'
                                            : 'border-border bg-bg-secondary hover:border-emerald-500/30'
                                        }`}
                                >
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform origin-left">{template.icon}</div>
                                    <h3 className={`font-bold mb-1 ${selectedTemplateId === template.id ? 'text-emerald-500' : 'text-text-primary'}`}>
                                        {template.name}
                                    </h3>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        {template.description}
                                    </p>

                                    {template.habits?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {template.habits.slice(0, 3).map(h => (
                                                <span key={h.id} className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">
                                                    {h.name}
                                                </span>
                                            ))}
                                            {template.habits.length > 3 && (
                                                <span className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">+{template.habits.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Skill Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={selectedTemplateId === 'brain-mastery' ? "My Hero Journey" : "e.g., Spanish, Python, Guitar"}
                                className="w-full px-5 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Goal / Motivation (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Why do you want to learn this?"
                                rows={2}
                                className="w-full px-5 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-4 text-text-muted hover:bg-bg-tertiary hover:text-text-primary rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="flex-[2] px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none hover:translate-y-[-2px] transition-all"
                    >
                        Plant Seed
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
