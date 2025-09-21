'use client'
import React, { useState, useEffect } from 'react';

// Simple icon components
const BookOpen = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const Play = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1.586a1 1 0 01-.293.707L12 14m-3-4v4a2 2 0 002 2h2a2 2 0 002-2v-1M9 10H4m15 0h-3" />
    </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Clock = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Star = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const Brain = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

interface LessonStep {
    id: string;
    title: string;
    type: 'reading' | 'activity' | 'quiz' | 'creative';
    content: string;
    completed: boolean;
    timeEstimate: number; // minutes
}

interface Lesson {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    description: string;
    steps: LessonStep[];
    totalTime: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    safetyRating: 'all-ages' | 'supervision-recommended' | 'teen-plus';
}

interface LessonPlayerProps {
    lesson: Lesson;
    onComplete?: () => void;
    onProgress?: (stepId: string, completed: boolean) => void;
}

export default function LessonPlayer({ lesson, onComplete, onProgress }: LessonPlayerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [stepProgress, setStepProgress] = useState<Record<string, boolean>>({});
    const [startTime] = useState(Date.now());
    const [timeSpent, setTimeSpent] = useState(0);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string>('');

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
        }, 60000);
        return () => clearInterval(interval);
    }, [startTime]);

    const currentStepData = lesson.steps[currentStep];
    const progress = (Object.keys(stepProgress).length / lesson.steps.length) * 100;

    const markStepComplete = async (stepId: string) => {
        const newProgress = { ...stepProgress, [stepId]: true };
        setStepProgress(newProgress);
        onProgress?.(stepId, true);

        // If all steps completed, call onComplete
        if (Object.keys(newProgress).length === lesson.steps.length) {
            onComplete?.();
        }
    };

    const generateAIContent = async () => {
        if (!currentStepData) return;

        setIsGeneratingContent(true);
        try {
            const response = await fetch('/api/agents/lyra', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: 'generate_lesson_content',
                    args: {
                        topic: currentStepData.title,
                        type: currentStepData.type,
                        grade: lesson.gradeLevel,
                        safety_level: lesson.safetyRating
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setGeneratedContent(data.output.content || 'Content generated successfully!');
                }
            }
        } catch (error) {
            console.error('Failed to generate AI content:', error);
            setGeneratedContent('Sorry, I had trouble generating content. Let me know if you need help!');
        } finally {
            setIsGeneratingContent(false);
        }
    };

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'reading': return BookOpen;
            case 'activity': return Play;
            case 'quiz': return CheckCircle;
            case 'creative': return Brain;
            default: return BookOpen;
        }
    };

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

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-3xl shadow-lg border border-indigo-100">
            {/* Lesson Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">{lesson.title}</h1>
                            <p className="text-sm text-gray-600">{lesson.subject} • {lesson.gradeLevel}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(lesson.difficulty)}`}>
                            {lesson.difficulty}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSafetyColor(lesson.safetyRating)}`}>
                            {lesson.safetyRating}
                        </span>
                    </div>
                </div>

                <p className="text-gray-700 mb-4">{lesson.description}</p>

                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Step {currentStep + 1} of {lesson.steps.length}</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {timeSpent}m spent
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {Math.round(progress)}% complete
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Step */}
            {currentStepData && (
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        {React.createElement(getStepIcon(currentStepData.type), {
                            className: "w-6 h-6 text-indigo-500"
                        })}
                        <h2 className="text-lg font-semibold text-gray-800">{currentStepData.title}</h2>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                            {currentStepData.type}
                        </span>
                    </div>

                    <div className="prose max-w-none mb-6">
                        <p className="text-gray-700 leading-relaxed">{currentStepData.content}</p>
                    </div>

                    {/* AI Enhancement Button */}
                    <div className="mb-6">
                        <button
                            onClick={generateAIContent}
                            disabled={isGeneratingContent}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            <Brain className="w-4 h-4" />
                            {isGeneratingContent ? 'Lyra is thinking...' : 'Ask Lyra for Help'}
                        </button>

                        {generatedContent && (
                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-5 h-5 text-indigo-500" />
                                    <span className="font-medium text-indigo-700">Lyra&apos;s Guidance:</span>
                                </div>
                                <p className="text-indigo-800 leading-relaxed">{generatedContent}</p>
                            </div>
                        )}
                    </div>

                    {/* Step Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                disabled={currentStep === 0}
                                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-500">
                                Estimated time: {currentStepData.timeEstimate} min
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {!stepProgress[currentStepData.id] && (
                                <button
                                    onClick={() => markStepComplete(currentStepData.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Complete
                                </button>
                            )}

                            {stepProgress[currentStepData.id] && (
                                <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <CheckCircle className="w-4 h-4" />
                                    Completed
                                </span>
                            )}

                            <button
                                onClick={() => setCurrentStep(Math.min(lesson.steps.length - 1, currentStep + 1))}
                                disabled={currentStep === lesson.steps.length - 1}
                                className="px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step Overview */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lesson.steps.map((step, index) => {
                    const StepIcon = getStepIcon(step.type);
                    const isCompleted = stepProgress[step.id];
                    const isCurrent = index === currentStep;

                    return (
                        <div
                            key={step.id}
                            onClick={() => setCurrentStep(index)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${isCurrent
                                    ? 'border-indigo-300 bg-indigo-50'
                                    : isCompleted
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isCurrent
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <StepIcon className="w-4 h-4" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-800">{step.title}</span>
                            </div>
                            <p className="text-xs text-gray-600 capitalize">{step.type} • {step.timeEstimate} min</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}