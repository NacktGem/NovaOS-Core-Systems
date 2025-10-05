export default function BlackRoseLanding() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/50 via-[#0a0a0a] to-[#0a0a0a]"></div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8">
                        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                            <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill="#8B4513"
                            />
                        </svg>
                    </div>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                    <a href="#about" className="text-[#d4af37]/90 hover:text-[#d4af37] transition-colors">About</a>
                    <a href="#features" className="text-[#d4af37]/90 hover:text-[#d4af37] transition-colors">Features</a>
                    <a href="#pricing" className="text-[#d4af37]/90 hover:text-[#d4af37] transition-colors">Pricing</a>
                    <a href="#terms" className="text-[#d4af37]/90 hover:text-[#d4af37] transition-colors">Terms</a>
                </div>

                <div className="flex items-center space-x-4">
                    <a
                        href="/login"
                        className="text-[#d4af37]/90 hover:text-[#d4af37] transition-colors font-medium"
                    >
                        Login
                    </a>
                    <a
                        href="/signup"
                        className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white px-6 py-2 rounded-full transition-all duration-300 font-medium"
                    >
                        Join Now
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
                {/* Rose Image */}
                <div className="mb-12 relative">
                    <div className="w-64 h-64 md:w-80 md:h-80 mx-auto relative">
                        {/* Main rose image placeholder - you'll replace this with your actual rose image */}
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#8B4513]/30 to-[#654321]/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIxLjM1TDEwLjU1IDIwLjAzQzUuNDAgMTUuMzYgMiAxMi4yOCAyIDguNUMyIDUuNDIgNC40MiAzIDcuNSAzQzkuMjQgMyAxMC45MSAzLjgxIDEyIDUuMDlDMTMuMDkgMy44MSAxNC43NiAzIDE2LjUgM0MxOS41OCAzIDIyIDUuNDIgMjIgOC41QzIyIDEyLjI4IDE4LjYgMTUuMzYgMTMuNDUgMjAuMDNMMTIgMjEuMzVaIiBmaWxsPSIjOEI0NTEzIiBmaWxsLW9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4K')] bg-center bg-no-repeat opacity-60"></div>

                            {/* Layered rose petals effect */}
                            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#A0522D]/40 to-[#8B4513]/60"></div>
                            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#CD853F]/30 to-[#A0522D]/50"></div>
                            <div className="absolute inset-12 rounded-full bg-gradient-to-br from-[#DEB887]/20 to-[#CD853F]/40"></div>
                            <div className="absolute inset-16 rounded-full bg-gradient-to-br from-[#F5DEB3]/10 to-[#DEB887]/30"></div>
                        </div>

                        {/* Glow effect */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#8B4513]/20 via-[#A0522D]/30 to-[#8B4513]/20 rounded-full blur-xl"></div>
                    </div>
                </div>

                {/* Brand Title */}
                <div className="mb-8">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-[0.2em] mb-4">
                        <span className="text-[#d4af37]">BLACK ROSE</span>
                    </h1>
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.15em] text-[#d4af37]/90">
                        COLLECTIVE
                    </h2>
                </div>

                {/* Tagline */}
                <p className="text-xl md:text-2xl text-[#d4af37]/70 mb-12 max-w-2xl leading-relaxed font-light">
                    Where creators bloom in shadows and elegance meets artistry
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <a
                        href="/signup"
                        className="bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] text-white px-8 py-4 rounded-full transition-all duration-300 font-medium text-lg tracking-wide shadow-2xl hover:scale-105"
                    >
                        Begin Your Journey
                    </a>
                    <a
                        href="#about"
                        className="border border-[#d4af37]/50 hover:border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 px-8 py-4 rounded-full transition-all duration-300 font-medium text-lg tracking-wide"
                    >
                        Discover More
                    </a>
                </div>

                {/* Social Proof */}
                <div className="mt-16 flex items-center space-x-8 text-[#d4af37]/60">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#d4af37]">10K+</div>
                        <div className="text-sm">Creators</div>
                    </div>
                    <div className="w-px h-8 bg-[#d4af37]/30"></div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#d4af37]">$2M+</div>
                        <div className="text-sm">Earned</div>
                    </div>
                    <div className="w-px h-8 bg-[#d4af37]/30"></div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#d4af37]">99%</div>
                        <div className="text-sm">Satisfaction</div>
                    </div>
                </div>
            </main>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#d4af37]/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 4}s`,
                        }}
                    />
                ))}
            </div>

            {/* Footer */}
            <footer className="relative z-10 mt-20 border-t border-[#d4af37]/20 py-8">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-[#d4af37]/60 text-sm mb-4 md:mb-0">
                        © 2025 Black Rose Collective. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                        <a href="/privacy" className="text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Privacy</a>
                        <a href="/terms" className="text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Terms</a>
                        <a href="/support" className="text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
