import { memo, useState } from 'react'
import { Modal } from '../ui/modal'
import { Monitor, Pencil, User, FileText, Check, ChevronDown, LucideIcon } from 'lucide-react'

interface VariantGuide {
    name: string
    icon: LucideIcon
    color: string
    vibe: string
    description: string
    checklist: string[]
    recordingFlow: string[]
    bestFor: string[]
    tools: string[]
    musicResources?: string[]
    drawingTips?: string[]
    obsSetup?: string[]
    slideDesign?: string[]
    notionSetup?: string[]
    pageStructure?: string[]
    tips: string[]
}

const VARIANT_GUIDES: Record<string, VariantGuide> = {
    'cozy-screen': {
        name: 'Cozy Screen Recording',
        icon: Monitor,
        color: '#3B82F6',
        vibe: 'Late night coding session, calm, focused',
        description: 'Faceless voiceover with VS Code and lo-fi music',
        checklist: [
            'OBS Studio installed',
            'VS Code with dark theme (One Dark Pro / Tokyo Night)',
            'Font size: 18-20px (readable on mobile)',
            'Lo-fi music playlist ready',
            'Mic setup (audio clear hona chahiye)'
        ],
        recordingFlow: [
            'Lo-fi music start karo (volume 10-15%)',
            'VS Code open karo',
            'Code likhte jao, explain karte jao',
            'Mistakes bhi rakho (real feel)'
        ],
        bestFor: ['Coding tutorials', 'Bug fixing', 'Live problem solving', '"Mere saath code karo" style'],
        tools: ['OBS Studio', 'VS Code', 'Lo-fi playlist'],
        musicResources: [
            'Lofi Girl YouTube (released tracks)',
            'chosic.com/free-music/lofi/',
            'YouTube Audio Library'
        ],
        tips: [
            'Dark theme use karo',
            'Font size 18-20px for mobile readability',
            'Music volume 10-15% of voice',
            'Natural mistakes rakho - real feel'
        ]
    },
    'whiteboard': {
        name: 'Whiteboard Explainer',
        icon: Pencil,
        color: '#F59E0B',
        vibe: 'Teacher explaining concept, hand-drawn feel',
        description: 'Hand-drawn style diagrams with voiceover',
        checklist: [
            'Excalidraw.com open (FREE, no login)',
            'Drawing tablet (optional, mouse bhi chalega)',
            'Screen recorder ready',
            'Clean white/dark canvas'
        ],
        recordingFlow: [
            'Blank canvas se start',
            'Baat karte hue draw karo',
            'Arrows, boxes, connections banao',
            'Ek concept = ek drawing'
        ],
        bestFor: ['Concepts explain karna', 'Architecture diagrams', 'Roadmaps', 'Comparisons (X vs Y)'],
        tools: ['Excalidraw', 'Screen recorder', 'Drawing tablet (optional)'],
        drawingTips: [
            'Left se right flow rakho',
            'Pehle heading likho',
            'Boxes mein key points',
            'Arrows se flow dikhao',
            '3-4 colors max (Purple, Orange, Green, White)'
        ],
        tips: [
            'Hand-drawn style ON rakho',
            'Simple shapes use karo',
            'Ek time pe ek concept',
            'Slowly draw karo for effect'
        ]
    },
    'slides-face': {
        name: 'Minimal Slides + Face',
        icon: User,
        color: '#10B981',
        vibe: 'Professional, podcast feel, personal connection',
        description: 'Clean slides with your face in corner',
        checklist: [
            'OBS Studio setup',
            'Webcam ready (phone bhi chalega - DroidCam)',
            'Minimal slides ready',
            'Good lighting (face pe)',
            'Clean background'
        ],
        recordingFlow: [
            'Slide dikhao',
            'Camera dekh ke baat karo',
            'Natural explain karo',
            'Next slide smoothly'
        ],
        bestFor: ['Tips & opinions', 'Career advice', 'Reviews', '"My thoughts on X"', 'Q&A style'],
        tools: ['OBS Studio', 'Slides app', 'Webcam/Phone'],
        obsSetup: [
            'Layer 1 (Bottom): Slides (Display/Window capture)',
            'Layer 2 (Top): Webcam',
            'Webcam Size: 250x250 px',
            'Position: Bottom right corner',
            'Optional: Circle crop with mask'
        ],
        slideDesign: [
            'Background: Dark (#1a1a2e) ya Light (#FFFBF5)',
            'Font: Inter / SF Pro / Clean sans-serif',
            'Max 5-6 words per point',
            'No clutter - one idea per slide'
        ],
        tips: [
            'Face pe good lighting',
            'Clean background',
            'Camera se eye contact',
            'Natural baat karo'
        ]
    },
    'notion-doc': {
        name: 'Notion/Aesthetic Doc',
        icon: FileText,
        color: '#3B82F6',
        vibe: '"Mere personal notes share kar raha hoon", cozy, authentic',
        description: 'Scrolling through aesthetic Notion page with voiceover',
        checklist: [
            'Notion page ready',
            'Clean page template',
            'Screen recorder ready',
            'Calm voiceover prepared'
        ],
        recordingFlow: [
            'Page top se start',
            'Slowly scroll karo',
            'Har section pe ruk ke explain',
            'Mouse se subtle pointing'
        ],
        bestFor: ['Resource lists', 'Checklists', '"My setup/stack"', 'Study guides', 'Curated lists'],
        tools: ['Notion (free)', 'Screen recorder'],
        notionSetup: [
            'Cover image: Aesthetic/gradient',
            'Icon: Relevant emoji',
            'Font: Default (clean)',
            'Width: Centered (not full width)'
        ],
        pageStructure: [
            '# Main Title',
            '## Sections with clear headings',
            '- Bullet points for lists',
            '> Quotes/callouts for highlights',
            'Tables for comparisons',
            'Dividers (---) between sections'
        ],
        tips: [
            'Aesthetic cover image',
            'Slow scroll speed',
            'Natural pace explanation',
            'Use callouts for highlights'
        ]
    }
}

interface VariantGuideModalProps {
    isOpen: boolean
    onClose: () => void
    selectedVariant?: string | null
}

const VariantGuideModal = memo(function VariantGuideModal({
    isOpen,
    onClose,
    selectedVariant = null
}: VariantGuideModalProps) {
    const variantKeys = selectedVariant ? [selectedVariant] : Object.keys(VARIANT_GUIDES)
    const [openVariant, setOpenVariant] = useState<string | null>(selectedVariant || variantKeys[0])

    const toggleVariant = (key: string) => {
        setOpenVariant(openVariant === key ? null : key)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Video Variants Guide"
            size="lg"
        >
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {variantKeys.map((key) => {
                    const guide = VARIANT_GUIDES[key]
                    if (!guide) return null

                    const IconComponent = guide.icon
                    const isOpen = openVariant === key

                    return (
                        <div
                            key={key}
                            className="border border-border rounded-xl overflow-hidden"
                            style={{ borderColor: isOpen ? guide.color : undefined }}
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleVariant(key)}
                                className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-bg-tertiary/50"
                                style={{ backgroundColor: isOpen ? `${guide.color}10` : undefined }}
                            >
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${guide.color}20` }}
                                >
                                    <IconComponent size={20} style={{ color: guide.color }} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="font-semibold text-text-primary">{guide.name}</h3>
                                    <p className="text-xs text-text-muted">{guide.description}</p>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Accordion Content */}
                            {isOpen && (
                                <div className="p-4 pt-0 space-y-4 border-t border-border">
                                    {/* Vibe */}
                                    <p className="text-sm text-text-muted italic pt-3">"{guide.vibe}"</p>

                                    {/* Best For */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Best For</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {guide.bestFor.map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 rounded-full text-xs"
                                                    style={{ backgroundColor: `${guide.color}15`, color: guide.color }}
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Checklist */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 flex items-center gap-2">
                                            <Check size={12} style={{ color: guide.color }} />
                                            Setup Checklist
                                        </h4>
                                        <div className="space-y-1.5">
                                            {guide.checklist.map((item, i) => (
                                                <label key={i} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer group">
                                                    <input type="checkbox" className="rounded border-border accent-current" style={{ accentColor: guide.color }} />
                                                    <span className="group-hover:text-text-primary transition-colors">{item}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tools */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Tools</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {guide.tools.map((tool, i) => (
                                                <span key={i} className="px-2 py-1 bg-bg-tertiary rounded text-xs text-text-secondary">
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recording Flow */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Recording Flow</h4>
                                        <ol className="space-y-1">
                                            {guide.recordingFlow.map((step, i) => (
                                                <li key={i} className="text-sm text-text-secondary flex gap-2">
                                                    <span className="font-medium" style={{ color: guide.color }}>{i + 1}.</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>

                                    {/* Extra sections */}
                                    {guide.musicResources && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Music (Copyright Free)</h4>
                                            <ul className="space-y-1">
                                                {guide.musicResources.map((res, i) => (
                                                    <li key={i} className="text-sm text-text-secondary">• {res}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {guide.drawingTips && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Drawing Tips</h4>
                                            <ul className="space-y-1">
                                                {guide.drawingTips.map((tip, i) => (
                                                    <li key={i} className="text-sm text-text-secondary">• {tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {guide.obsSetup && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">OBS Setup</h4>
                                            <ul className="space-y-1">
                                                {guide.obsSetup.map((item, i) => (
                                                    <li key={i} className="text-sm text-text-secondary">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {guide.slideDesign && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Slide Design</h4>
                                            <ul className="space-y-1">
                                                {guide.slideDesign.map((item, i) => (
                                                    <li key={i} className="text-sm text-text-secondary">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {guide.notionSetup && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Notion Setup</h4>
                                            <ul className="space-y-1">
                                                {guide.notionSetup.map((item, i) => (
                                                    <li key={i} className="text-sm text-text-secondary">• {item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {guide.pageStructure && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Page Structure</h4>
                                            <div className="bg-bg-tertiary rounded-lg p-3 font-mono text-xs text-text-secondary">
                                                {guide.pageStructure.map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pro Tips */}
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${guide.color}10` }}>
                                        <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: guide.color }}>
                                            Pro Tips
                                        </h4>
                                        <ul className="space-y-1">
                                            {guide.tips.map((tip, i) => (
                                                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                                                    <span style={{ color: guide.color }}>✓</span>
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </Modal>
    )
})

export default VariantGuideModal
