import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function RegisterForm() {
    const { register, error, clearError, loading } = useAuth()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [localError, setLocalError] = useState('')

    const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
        if (pw.length === 0) return { label: '', color: '', width: '0%' }
        if (pw.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' }
        if (pw.length < 8) return { label: 'Fair', color: 'bg-amber-500', width: '50%' }
        if (/(?=.*[A-Z])(?=.*[0-9])/.test(pw)) return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
        return { label: 'Good', color: 'bg-blue-500', width: '75%' }
    }

    const strength = getPasswordStrength(password)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()
        setLocalError('')

        if (password.length < 6) {
            setLocalError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match')
            return
        }

        const success = await register(name, email, password)
        if (success) {
            navigate('/')
        }
    }

    const displayError = localError || error

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-6 shadow-xl shadow-emerald-500/20"
                    >
                        <Sparkles size={28} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-text-primary tracking-tight">Create Account</h1>
                    <p className="text-text-secondary mt-2">Join Business Hub today</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {displayError && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium"
                        >
                            {displayError}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your name"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                className="w-full pl-12 pr-12 py-3.5 bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {password && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                    <div className={`h-full ${strength.color} rounded-full transition-all`} style={{ width: strength.width }} />
                                </div>
                                <span className="text-[10px] font-bold text-text-secondary uppercase">{strength.label}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Confirm Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repeat password"
                                required
                                className="w-full pl-12 pr-4 py-3.5 bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-shadow flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create Account
                            </>
                        )}
                    </motion.button>
                </form>

                <p className="text-center mt-8 text-text-secondary text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-emerald-500 font-bold hover:underline">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}

export default RegisterForm
