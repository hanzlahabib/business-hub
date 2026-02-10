// Centralized Framer Motion animation variants for consistent, premium animations
import { Variants } from "framer-motion";

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
}

export const fadeInUp: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
}

export const fadeInDown: Variants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 }
}

export const fadeInScale: Variants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
}

// ============================================================================
// STAGGER ANIMATIONS (for lists)
// ============================================================================

export const staggerContainer: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05
        }
    }
}

export const staggerContainerFast: Variants = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.02
        }
    }
}

export const staggerItem: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
}

export const staggerItemHorizontal: Variants = {
    initial: { opacity: 0, x: -20 },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
}

// ============================================================================
// PRESENTATION MODE (items appear with delays like speaking)
// ============================================================================

export const presentationReveal = (index: number, delay = 1.5): Variants => ({
    initial: { opacity: 0, x: -30, filter: 'blur(10px)' },
    animate: {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        transition: {
            delay: index * delay,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    }
})

export const presentationRevealUp = (index: number, delay = 1.5): Variants => ({
    initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            delay: index * delay,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
        }
    }
})

// ============================================================================
// GLOW AND PULSE EFFECTS
// ============================================================================

export const glowPulse: Variants = {
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(139, 92, 246, 0)",
            "0 0 30px 10px rgba(139, 92, 246, 0.4)",
            "0 0 0 0 rgba(139, 92, 246, 0)"
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

export const glowPulseSuccess: Variants = {
    animate: {
        boxShadow: [
            "0 0 0 0 rgba(34, 197, 94, 0)",
            "0 0 25px 8px rgba(34, 197, 94, 0.4)",
            "0 0 0 0 rgba(34, 197, 94, 0)"
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

export const scalePulse: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

// ============================================================================
// WIZARD STEP TRANSITIONS
// ============================================================================

export const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0
    })
}

export const slideTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
}

// ============================================================================
// MODAL ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
}

export const modalContent: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        filter: 'blur(10px)'
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            type: "spring",
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 10,
        filter: 'blur(5px)',
        transition: { duration: 0.2 }
    }
}

// ============================================================================
// TASK FLOW ANIMATIONS
// ============================================================================

export const flowNodeReveal = (index: number): Variants => ({
    initial: { opacity: 0, scale: 0, y: 20 },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            delay: index * 0.1,
            type: "spring",
            stiffness: 400,
            damping: 20
        }
    }
})

export const flowLineGrow: Variants = {
    initial: { scaleX: 0 },
    animate: {
        scaleX: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
}

export const progressFill = (percentage: number): Variants => ({
    initial: { width: 0 },
    animate: {
        width: `${percentage}%`,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
})

// ============================================================================
// HOVER AND TAP ANIMATIONS
// ============================================================================

export const buttonHover = {
    scale: 1.02,
    transition: { duration: 0.2 }
}

export const buttonTap = {
    scale: 0.98
}

export const cardHover = {
    y: -4,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    transition: { duration: 0.2 }
}

export const iconSpin = {
    rotate: 360,
    transition: { duration: 0.5, ease: "easeInOut" }
}

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const shimmer: Variants = {
    animate: {
        backgroundPosition: ["200% 0", "-200% 0"],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

export const bounce: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

export const rotate: Variants = {
    animate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

// ============================================================================
// SPRING PRESETS
// ============================================================================

export const springBouncy = {
    type: "spring",
    stiffness: 400,
    damping: 15
}

export const springSmooth = {
    type: "spring",
    stiffness: 300,
    damping: 30
}

export const springStiff = {
    type: "spring",
    stiffness: 500,
    damping: 35
}

// ============================================================================
// EASING PRESETS
// ============================================================================

export const easePremium = [0.22, 1, 0.36, 1]
export const easeSnappy = [0.87, 0, 0.13, 1]
export const easeSoft = [0.4, 0, 0.2, 1]
