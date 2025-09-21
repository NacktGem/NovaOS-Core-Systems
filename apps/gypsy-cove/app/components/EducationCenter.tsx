'use client'
import React, { useState, useEffect } from 'react';
import LessonPlayer from '../components/LessonPlayer';

// Simple icon components
const BookOpen = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const Plus = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const Play = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1.586a1 1 0 01-.293.707L12 14m-3-4v4a2 2 0 002 2h2a2 2 0 002-2v-1M9 10H4m15 0h-3" />
    </svg>
);

const Star = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const Search = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const Filter = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
    </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const Users = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
);

interface LessonTemplate {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    description: string;
    estimatedTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    safetyRating: 'all-ages' | 'supervision-recommended' | 'teen-plus';
    tags: string[];
}

interface Lesson {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    description: string;
    steps: Array<{
        id: string;
        title: string;
        type: 'reading' | 'activity' | 'quiz' | 'creative';
        content: string;
        completed: boolean;
        timeEstimate: number;
    }>;
    totalTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    safetyRating: 'all-ages' | 'supervision-recommended' | 'teen-plus';
}

interface CustomLessonForm {
    topic: string;
    subject: string;
    gradeLevel: string;
    duration: number;
    learningObjectives: string[];
    safetyLevel: 'all-ages' | 'supervision-recommended' | 'teen-plus';
}

export default function EducationCenter() {
    const [currentView, setCurrentView] = useState<'browse' | 'create' | 'lesson'>('browse');
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [lessonTemplates, setLessonTemplates] = useState<LessonTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [customLessonForm, setCustomLessonForm] = useState<CustomLessonForm>({
        topic: '',
        subject: '',
        gradeLevel: '',
        duration: 30,
        learningObjectives: [''],
        safetyLevel: 'all-ages'
    });

    // Load lesson templates on component mount
    useEffect(() => {
        loadLessonTemplates();
    }, []);

    const loadLessonTemplates = async () => {
        try {
            const response = await fetch('/api/education/lessons');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setLessonTemplates(data.templates);
                }
            }
        } catch (error) {
            console.error('Failed to load lesson templates:', error);
        }
    };

    const createCustomLesson = async () => {
        if (!customLessonForm.topic || !customLessonForm.subject || !customLessonForm.gradeLevel) {
            alert('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/education/lessons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: customLessonForm.subject,
                    gradeLevel: customLessonForm.gradeLevel,
                    topic: customLessonForm.topic,
                    duration: customLessonForm.duration,
                    learningObjectives: customLessonForm.learningObjectives.filter(obj => obj.trim()),
                    safetyLevel: customLessonForm.safetyLevel
                })
            });

            const data = await response.json();

            if (data.success && data.lesson) {
                setSelectedLesson(data.lesson);
                setCurrentView('lesson');
            } else {
                // Use fallback lesson if available
                if (data.fallback) {
                    setSelectedLesson(data.fallback);
                    setCurrentView('lesson');
                } else {
                    alert('Failed to create lesson. Please try again.');
                }
            }
        } catch (error) {
            console.error('Failed to create custom lesson:', error);
            alert('Failed to create lesson. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateTemplateLesson = async (template: LessonTemplate) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/education/lessons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: template.subject,
                    gradeLevel: template.gradeLevel,
                    topic: template.title,
                    duration: template.estimatedTime,
                    safetyLevel: template.safetyRating
                })
            });

            const data = await response.json();

            if (data.success && data.lesson) {
                setSelectedLesson(data.lesson);
                setCurrentView('lesson');
            } else if (data.fallback) {
                setSelectedLesson(data.fallback);
                setCurrentView('lesson');
            }
        } catch (error) {
            console.error('Failed to generate lesson:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTemplates = lessonTemplates.filter(template => {
        const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSubject = !selectedSubject || template.subject === selectedSubject;
        const matchesGrade = !selectedGrade || template.gradeLevel.includes(selectedGrade);

        return matchesSearch && matchesSubject && matchesGrade;
    });

    const subjects = [...new Set(lessonTemplates.map(t => t.subject))];
    const gradeLevels = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'intermediate': return 'bg-amber-100 text-amber-700 border-amber-300';
            case 'advanced': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getSafetyColor = (rating: string) => {
        switch (rating) {
            case 'all-ages': return 'bg-emerald-100 text-emerald-700';
            case 'supervision-recommended': return 'bg-amber-100 text-amber-700';
            case 'teen-plus': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (currentView === 'lesson' && selectedLesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="mb-6">
                        <button
                            onClick={() => {
                                setCurrentView('browse');
                                setSelectedLesson(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Education Center
                        </button>
                    </div>

                    <LessonPlayer
                        lesson={selectedLesson}
                        onComplete={() => {
                            alert('Congratulations! You completed the lesson! 🎉');
                            setCurrentView('browse');
                            setSelectedLesson(null);
                        }}
                        onProgress={(stepId, completed) => {
                            console.log(`Step ${stepId} progress:`, completed);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-6">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">GypsyCove Education Center</h1>
                            <p className="text-gray-600">Family-friendly learning powered by Lyra AI</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{lessonTemplates.length}</p>
                                    <p className="text-sm text-gray-600">Lesson Templates</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{subjects.length}</p>
                                    <p className="text-sm text-gray-600">Subject Areas</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">All Ages</p>
                                    <p className="text-sm text-gray-600">Family Safe</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentView('browse')}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${currentView === 'browse'
                                    ? 'bg-indigo-500 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            Browse Templates
                        </button>
                        <button
                            onClick={() => setCurrentView('create')}
                            className={`px-6 py-3 rounded-xl font-medium transition-all ${currentView === 'create'
                                    ? 'bg-indigo-500 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            Create Custom Lesson
                        </button>
                    </div>
                </div>

                {currentView === 'browse' && (
                    <>
                        {/* Search and Filters */}
                        <div className="mb-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search lessons..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Subjects</option>
                                    {subjects.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>

                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Grades</option>
                                    {gradeLevels.map(grade => (
                                        <option key={grade} value={grade}>Grade {grade}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lesson Templates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map(template => (
                                <div key={template.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{template.title}</h3>
                                            <p className="text-sm text-gray-600">{template.subject}</p>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{template.description}</p>

                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(template.difficulty)}`}>
                                            {template.difficulty}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSafetyColor(template.safetyRating)}`}>
                                            {template.safetyRating}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                        <span>Grade {template.gradeLevel}</span>
                                        <span>{template.estimatedTime} min</span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {template.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => generateTemplateLesson(template)}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        {isLoading ? 'Creating...' : 'Start Lesson'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {currentView === 'create' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Create Custom Lesson</h2>
                                    <p className="text-gray-600">Let Lyra help design a personalized learning experience</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Topic *</label>
                                    <input
                                        type="text"
                                        value={customLessonForm.topic}
                                        onChange={(e) => setCustomLessonForm(prev => ({ ...prev, topic: e.target.value }))}
                                        placeholder="e.g., Solar System, Creative Writing, Plant Biology"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                                        <select
                                            value={customLessonForm.subject}
                                            onChange={(e) => setCustomLessonForm(prev => ({ ...prev, subject: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Select Subject</option>
                                            <option value="Science">Science</option>
                                            <option value="Math">Math</option>
                                            <option value="Language Arts">Language Arts</option>
                                            <option value="Social Studies">Social Studies</option>
                                            <option value="Art">Art</option>
                                            <option value="Music">Music</option>
                                            <option value="Physical Education">Physical Education</option>
                                            <option value="Life Skills">Life Skills</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level *</label>
                                        <select
                                            value={customLessonForm.gradeLevel}
                                            onChange={(e) => setCustomLessonForm(prev => ({ ...prev, gradeLevel: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="">Select Grade</option>
                                            <option value="K-2">Kindergarten - 2nd Grade</option>
                                            <option value="3-5">3rd - 5th Grade</option>
                                            <option value="6-8">6th - 8th Grade</option>
                                            <option value="9-12">9th - 12th Grade</option>
                                            <option value="K-12">All Ages</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            value={customLessonForm.duration}
                                            onChange={(e) => setCustomLessonForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                                            min="15"
                                            max="180"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Safety Level</label>
                                        <select
                                            value={customLessonForm.safetyLevel}
                                            onChange={(e) => setCustomLessonForm(prev => ({ ...prev, safetyLevel: e.target.value as any }))}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="all-ages">All Ages</option>
                                            <option value="supervision-recommended">Supervision Recommended</option>
                                            <option value="teen-plus">Teen Plus</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                                    {customLessonForm.learningObjectives.map((objective, index) => (
                                        <div key={index} className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={objective}
                                                onChange={(e) => {
                                                    const newObjectives = [...customLessonForm.learningObjectives];
                                                    newObjectives[index] = e.target.value;
                                                    setCustomLessonForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                                                }}
                                                placeholder={`Learning objective ${index + 1}`}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            {customLessonForm.learningObjectives.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        const newObjectives = customLessonForm.learningObjectives.filter((_, i) => i !== index);
                                                        setCustomLessonForm(prev => ({ ...prev, learningObjectives: newObjectives }));
                                                    }}
                                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setCustomLessonForm(prev => ({ ...prev, learningObjectives: [...prev.learningObjectives, ''] }))}
                                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                    >
                                        + Add objective
                                    </button>
                                </div>

                                <button
                                    onClick={createCustomLesson}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all font-medium"
                                >
                                    <Star className="w-5 h-5" />
                                    {isLoading ? 'Creating Your Lesson...' : 'Create Lesson with Lyra'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}