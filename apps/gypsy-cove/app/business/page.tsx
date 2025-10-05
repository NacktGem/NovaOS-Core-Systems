import Link from "next/link";

export default function BusinessIntelligence() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Business Intelligence
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                ← Back to Academy
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-12 px-4">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">⚖️</div>
                    <h1 className="text-4xl font-bold text-white mb-6">
                        Business & Entrepreneurship Intelligence
                    </h1>
                    <p className="text-xl text-white/80 max-w-3xl mx-auto">
                        Comprehensive competitive intelligence, market analysis, and financial modeling for family enterprises
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">📊</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Market Analysis Engine</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Real-time competitive monitoring, trend analysis, and market opportunity identification
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Automated competitor tracking</li>
                            <li>• Market trend analysis</li>
                            <li>• Pricing intelligence</li>
                            <li>• Revenue forecasting</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">💰</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Financial Modeling</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Advanced financial planning, risk assessment, and investment analysis tools
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Cash flow modeling</li>
                            <li>• Risk assessment</li>
                            <li>• ROI calculations</li>
                            <li>• Investment tracking</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🎯</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Strategy Optimizer</h3>
                        <p className="text-white/70 text-sm mb-4">
                            AI-powered strategic planning and business optimization recommendations
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Strategic planning</li>
                            <li>• Resource optimization</li>
                            <li>• Growth planning</li>
                            <li>• Risk mitigation</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🔍</div>
                        <h3 className="text-white font-semibold text-lg mb-3">OSINT Research</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Open-source intelligence gathering for competitive advantage and due diligence
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Company research</li>
                            <li>• Industry analysis</li>
                            <li>• Patent monitoring</li>
                            <li>• Regulatory tracking</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">📝</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Legal Automation</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Automated contract generation, compliance monitoring, and legal document management
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Contract templates</li>
                            <li>• Compliance tracking</li>
                            <li>• Legal research</li>
                            <li>• Document automation</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🌐</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Global Intelligence</h3>
                        <p className="text-white/70 text-sm mb-4">
                            International market analysis, regulatory monitoring, and global opportunity tracking
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• International markets</li>
                            <li>• Currency analysis</li>
                            <li>• Regulatory changes</li>
                            <li>• Trade opportunities</li>
                        </ul>
                    </div>
                </div>

                {/* AI Assistant */}
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🤖</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Business Intelligence AI</h2>
                        <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                            Your dedicated AI assistant for market research, competitive analysis, and strategic planning.
                            Ask me anything about business intelligence, market trends, or financial modeling.
                        </p>
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold">
                            Start Business Analysis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}