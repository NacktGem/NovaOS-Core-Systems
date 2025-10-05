import Link from "next/link";

export default function EducationTutoring() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Navigation */}
            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Education & Tutoring
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
                    <div className="text-6xl mb-4">📚</div>
                    <h1 className="text-4xl font-bold text-white mb-6">
                        Adaptive Learning & AI Tutoring
                    </h1>
                    <p className="text-xl text-white/80 max-w-3xl mx-auto">
                        Personalized education pathways, AI-powered tutoring, and comprehensive curriculum design for all family members
                    </p>
                </div>

                {/* Learning Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🧠</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Adaptive Learning Engine</h3>
                        <p className="text-white/70 text-sm mb-4">
                            AI-powered personalized learning paths that adapt to each student's pace and learning style
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Personalized curricula</li>
                            <li>• Progress tracking</li>
                            <li>• Difficulty adjustment</li>
                            <li>• Learning analytics</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🏫</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Homeschool Curriculum</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Complete K-12 curriculum covering all core subjects with hands-on projects and assessments
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Math & Science</li>
                            <li>• Literature & History</li>
                            <li>• Critical thinking</li>
                            <li>• Project-based learning</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🔬</div>
                        <h3 className="text-white font-semibold text-lg mb-3">STEM Laboratory</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Interactive science, technology, engineering, and mathematics with virtual experiments
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Virtual labs</li>
                            <li>• Coding tutorials</li>
                            <li>• Engineering projects</li>
                            <li>• Math visualization</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🌍</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Language Learning</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Comprehensive language learning with AI conversation partners and cultural immersion
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Multi-language support</li>
                            <li>• AI conversation practice</li>
                            <li>• Cultural studies</li>
                            <li>• Progress tracking</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">🎨</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Creative Arts</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Art, music, writing, and creative expression with AI-assisted guidance and feedback
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Digital art tutorials</li>
                            <li>• Music composition</li>
                            <li>• Creative writing</li>
                            <li>• Portfolio building</li>
                        </ul>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <div className="text-3xl mb-4">📊</div>
                        <h3 className="text-white font-semibold text-lg mb-3">Assessment & Analytics</h3>
                        <p className="text-white/70 text-sm mb-4">
                            Comprehensive assessment tools with detailed analytics and progress reporting
                        </p>
                        <ul className="text-white/60 text-sm space-y-1">
                            <li>• Automated grading</li>
                            <li>• Progress reports</li>
                            <li>• Skill assessments</li>
                            <li>• Parent dashboards</li>
                        </ul>
                    </div>
                </div>

                {/* Age Groups */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-white/10">
                        <div className="text-center">
                            <div className="text-2xl mb-2">👶</div>
                            <h4 className="text-white font-semibold">Early Learning</h4>
                            <p className="text-white/70 text-xs">Ages 3-6</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-white/10">
                        <div className="text-center">
                            <div className="text-2xl mb-2">🧒</div>
                            <h4 className="text-white font-semibold">Elementary</h4>
                            <p className="text-white/70 text-xs">Ages 6-11</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-white/10">
                        <div className="text-center">
                            <div className="text-2xl mb-2">👦</div>
                            <h4 className="text-white font-semibold">Middle School</h4>
                            <p className="text-white/70 text-xs">Ages 11-14</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-xl p-4 border border-white/10">
                        <div className="text-center">
                            <div className="text-2xl mb-2">👨‍🎓</div>
                            <h4 className="text-white font-semibold">High School</h4>
                            <p className="text-white/70 text-xs">Ages 14-18</p>
                        </div>
                    </div>
                </div>

                {/* AI Tutor */}
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                    <div className="text-center">
                        <div className="text-4xl mb-4">👨‍🏫</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Lyra AI Tutor</h2>
                        <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                            Your personalized AI tutor adapts to your learning style, provides instant feedback, and creates
                            custom lesson plans for any subject. Available 24/7 for family education support.
                        </p>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold">
                            Start Learning Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}