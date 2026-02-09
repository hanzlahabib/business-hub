import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
            <div className="max-w-md w-full text-center space-y-6">
                {/* 404 Graphic */}
                <div className="relative">
                    <div className="text-[120px] font-black text-bg-secondary leading-none select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[60px] font-black bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                            404
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-text-primary">Page Not Found</h1>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
                    >
                        Go Home
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-bg-secondary border border-border text-text-primary rounded-xl font-bold text-sm hover:bg-bg-tertiary transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NotFoundPage
