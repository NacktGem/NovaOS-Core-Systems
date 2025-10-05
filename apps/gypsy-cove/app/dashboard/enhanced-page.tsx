'use client'
import React, { useState, useEffect } from 'react';
import EducationCenter from '../components/EducationCenter';

// Simple icon components for GypsyCove
const BookOpen = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const Users = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

const Shield = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const Heart = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const Star = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const Clock = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Award = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
);

interface LessonProgress {
    id: string;
    title: string;
    subject: string;
    progress: number;
    completed: boolean;
    timeSpent: number;
}

interface FamilyMember {
    id: string;
    name: string;
    role: 'parent' | 'child' | 'educator';
    age: number;
    avatar: string;
    onlineStatus: 'online' | 'offline' | 'studying';
}

interface SafetyMetric {
    category: string;
    status: 'safe' | 'warning' | 'blocked';
    count: number;
    lastUpdate: string;
}

export default function EnhancedGypsyCoveDashboard() {
    const [activeTab, setActiveTab] = useState<'learning' | 'family' | 'safety' | 'activities' | 'education'>('education');
    const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [safetyMetrics, setSafetyMetrics] = useState<SafetyMetric[]>([]);
    const [isParentalMode, setIsParentalMode] = useState(false);

    // Mock data - in production this would come from APIs
    useEffect(() => {
        setLessonProgress([
            {
                id: '1',
                title: 'Introduction to Creative Writing',
                subject: 'English',
                progress: 75,
                completed: false,
                timeSpent: 45
            },
            {
                id: '2',
                title: 'Basic Herbalism: Garden Plants',
                subject: 'Science',
                progress: 100,
                completed: true,
                timeSpent: 60
            },
            {
                id: '3',
                title: 'Family History Project',
                subject: 'History',
                progress: 30,
                completed: false,
                timeSpent: 20
            }
        ]);

        setFamilyMembers([
            {
                id: '1',
                name: 'Mom',
                role: 'parent',
                age: 42,
                avatar: '👩‍💼',
                onlineStatus: 'online'
            },
            {
                id: '2',
                name: 'Emma',
                role: 'child',
                age: 12,
                avatar: '🧒',
                onlineStatus: 'studying'
            },
            {
                id: '3',
                name: 'Dad',
                role: 'parent',
                age: 45,
                avatar: '👨‍💻',
                onlineStatus: 'offline'
            }
        ]);

        setSafetyMetrics([
            {
                category: 'Content Filtering',
                status: 'safe',
                count: 0,
                lastUpdate: '2 minutes ago'
            },
            {
                category: 'Chat Monitoring',
                status: 'safe',
                count: 0,
                lastUpdate: '5 minutes ago'
            },
            {
                category: 'Screen Time',
                status: 'warning',
                count: 3,
                lastUpdate: '1 hour ago'
            }
        ]);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'safe': case 'online': case 'studying': return 'text-emerald-500';
            case 'warning': return 'text-amber-500';
            case 'blocked': case 'offline': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'safe': case 'online': case 'studying': return 'bg-emerald-100 border-emerald-300';
            case 'warning': return 'bg-amber-100 border-amber-300';
            case 'blocked': case 'offline': return 'bg-red-100 border-red-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            GC
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">GypsyCove Academy</h1>
                            <p className="text-sm text-gray-600">Family Learning & Safety Platform</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsParentalMode(!isParentalMode)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isParentalMode
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {isParentalMode ? 'Parent Mode' : 'Family Mode'}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-semibold">
                            U
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Main Content */}
                <div className="flex-1 p-6">
                    {/* Tab Navigation */}
                    <div className="flex gap-1 mb-6 bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-indigo-100">
                        {[
                            { key: 'education', icon: BookOpen, label: 'Education' },
                            { key: 'learning', icon: TrendingUp, label: 'Progress' },
                            { key: 'family', icon: Users, label: 'Family' },
                            { key: 'safety', icon: Shield, label: 'Safety' },
                            { key: 'activities', icon: Heart, label: 'Activities' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as 'learning' | 'family' | 'safety' | 'activities' | 'education')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.key
                                    ? 'bg-indigo-500 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-white/70'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Education Center Tab */}
                    {activeTab === 'education' && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-indigo-100">
                            <EducationCenter />
                        </div>
                    )}

                    {/* Learning Tab */}
                    {activeTab === 'learning' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Current Lessons */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-indigo-500" />
                                    Current Lessons
                                </h2>
                                <div className="space-y-4">
                                    {lessonProgress.map(lesson => (
                                        <div key={lesson.id} className="p-4 bg-white/50 rounded-2xl border border-indigo-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-gray-800">{lesson.title}</h3>
                                                {lesson.completed && <Award className="w-5 h-5 text-yellow-500" />}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">{lesson.subject}</p>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-2"
                                                        style={{ width: `${lesson.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{lesson.progress}%</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {lesson.timeSpent} min
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {lesson.completed ? 'Completed' : 'In Progress'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Stats */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-indigo-500" />
                                    Learning Progress
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl">
                                        <div className="text-2xl font-bold text-emerald-600 mb-1">5</div>
                                        <div className="text-sm text-emerald-700">Lessons Completed</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                                        <div className="text-2xl font-bold text-blue-600 mb-1">125</div>
                                        <div className="text-sm text-blue-700">Minutes Today</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                                        <div className="text-2xl font-bold text-purple-600 mb-1">3</div>
                                        <div className="text-sm text-purple-700">Subjects</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl">
                                        <div className="text-2xl font-bold text-amber-600 mb-1">12</div>
                                        <div className="text-sm text-amber-700">Achievements</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Family Tab */}
                    {activeTab === 'family' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Family Members */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Family Members
                                </h2>
                                <div className="space-y-3">
                                    {familyMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-4 p-3 bg-white/50 rounded-2xl border border-indigo-100">
                                            <div className="text-2xl">{member.avatar}</div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-800">{member.name}</h3>
                                                <p className="text-sm text-gray-600 capitalize">{member.role} • Age {member.age}</p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(member.onlineStatus)}`}>
                                                <span className={getStatusColor(member.onlineStatus)}>
                                                    {member.onlineStatus}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Family Activities */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-indigo-500" />
                                    Recent Activities
                                </h2>
                                <div className="space-y-3">
                                    <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100">
                                        <p className="text-sm font-medium text-gray-800">Emma completed &ldquo;Basic Herbalism&rdquo;</p>
                                        <p className="text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                    <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100">
                                        <p className="text-sm font-medium text-gray-800">Family chat session started</p>
                                        <p className="text-xs text-gray-500">3 hours ago</p>
                                    </div>
                                    <div className="p-3 bg-white/50 rounded-2xl border border-indigo-100">
                                        <p className="text-sm font-medium text-gray-800">Creative writing project shared</p>
                                        <p className="text-xs text-gray-500">1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Safety Tab */}
                    {activeTab === 'safety' && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Safety Metrics */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                    Safety Status
                                </h2>
                                <div className="space-y-4">
                                    {safetyMetrics.map((metric, index) => (
                                        <div key={index} className="p-4 bg-white/50 rounded-2xl border border-indigo-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-gray-800">{metric.category}</h3>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(metric.status)}`}>
                                                    <span className={getStatusColor(metric.status)}>
                                                        {metric.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-600">
                                                <span>{metric.count} incidents</span>
                                                <span>{metric.lastUpdate}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Parental Controls */}
                            {isParentalMode && (
                                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-indigo-500" />
                                        Parental Controls
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/50 rounded-2xl border border-indigo-100">
                                            <h3 className="font-medium text-gray-800 mb-2">Content Filtering</h3>
                                            <p className="text-sm text-gray-600 mb-3">Automatically filter inappropriate content</p>
                                            <button className="w-full bg-emerald-500 text-white py-2 rounded-xl font-medium">
                                                Active
                                            </button>
                                        </div>
                                        <div className="p-4 bg-white/50 rounded-2xl border border-indigo-100">
                                            <h3 className="font-medium text-gray-800 mb-2">Screen Time Limits</h3>
                                            <p className="text-sm text-gray-600 mb-3">Set daily learning time limits</p>
                                            <button className="w-full bg-amber-500 text-white py-2 rounded-xl font-medium">
                                                3h remaining
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Activities Tab */}
                    {activeTab === 'activities' && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h3 className="font-semibold text-gray-800 mb-4">Creative Writing</h3>
                                <p className="text-sm text-gray-600 mb-4">Start a new creative writing project with Lyra</p>
                                <button className="w-full bg-indigo-500 text-white py-2 rounded-xl font-medium">
                                    Begin Story
                                </button>
                            </div>

                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h3 className="font-semibold text-gray-800 mb-4">Herbalism Garden</h3>
                                <p className="text-sm text-gray-600 mb-4">Learn about plants and their properties</p>
                                <button className="w-full bg-emerald-500 text-white py-2 rounded-xl font-medium">
                                    Explore Plants
                                </button>
                            </div>

                            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-indigo-100">
                                <h3 className="font-semibold text-gray-800 mb-4">Family Project</h3>
                                <p className="text-sm text-gray-600 mb-4">Collaborative family learning activities</p>
                                <button className="w-full bg-purple-500 text-white py-2 rounded-xl font-medium">
                                    Join Project
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Sidebar */}
                <div className="w-96 border-l border-indigo-100 bg-white/30 backdrop-blur-sm">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">GypsyCove Learning Chat</h3>
                        <div className="text-center text-gray-500 py-8">
                            <p>Chat widget coming soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
