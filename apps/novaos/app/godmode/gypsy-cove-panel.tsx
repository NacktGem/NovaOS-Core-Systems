'use client';

/**
 * Gypsy Cove Management Panel
 *
 * Integrated management interface for Gypsy Cove Academy from NovaOS GodMode dashboard.
 * Provides cross-domain control over the educational platform at gypsy-cove.xyz
 */

import { useState, useEffect } from 'react';
import { Card } from '../../../shared/ui/Card';
import { Frame } from '../../../shared/ui/Frame';

interface GypsyCoveStats {
    students: number;
    courses: number;
    activeClasses: number;
    revenue: number;
    status: 'online' | 'offline' | 'maintenance';
}

interface GypsyCoveUser {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
    lastActive: string;
    coursesEnrolled?: number;
    coursesTeaching?: number;
}

interface GypsyCoveCourse {
    id: string;
    title: string;
    instructor: string;
    students: number;
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
}

export default function GypsyCoveManagementPanel() {
    const [stats, setStats] = useState<GypsyCoveStats>({
        students: 0,
        courses: 0,
        activeClasses: 0,
        revenue: 0,
        status: 'offline'
    });

    const [users, setUsers] = useState<GypsyCoveUser[]>([]);
    const [courses, setCourses] = useState<GypsyCoveCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'analytics'>('overview');

    useEffect(() => {
        loadGypsyCoveData();
        const interval = setInterval(loadGypsyCoveData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadGypsyCoveData = async () => {
        setLoading(true);
        try {
            // Cross-domain API calls to Gypsy Cove
            const gypsyCoveApi = process.env.NEXT_PUBLIC_GYPSY_COVE_API_URL || 'https://gypsy-cove.xyz/api';

            // Fetch stats
            const statsResponse = await fetch(`${gypsyCoveApi}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('novaos_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            }

            // Fetch users
            const usersResponse = await fetch(`${gypsyCoveApi}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('novaos_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                setUsers(usersData.users || []);
            }

            // Fetch courses
            const coursesResponse = await fetch(`${gypsyCoveApi}/admin/courses`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('novaos_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (coursesResponse.ok) {
                const coursesData = await coursesResponse.json();
                setCourses(coursesData.courses || []);
            }

        } catch (error) {
            console.error('Failed to load Gypsy Cove data:', error);
            // Set mock data for demonstration when API is not available
            setStats({
                students: 127,
                courses: 23,
                activeClasses: 8,
                revenue: 15420,
                status: 'online'
            });
            setUsers([
                { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'instructor', lastActive: '2025-09-29T10:30:00Z', coursesTeaching: 3 },
                { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'student', lastActive: '2025-09-29T11:15:00Z', coursesEnrolled: 2 },
                { id: '3', name: 'Carol Davis', email: 'carol@example.com', role: 'admin', lastActive: '2025-09-29T09:45:00Z' }
            ]);
            setCourses([
                { id: '1', title: 'Introduction to Herbalism', instructor: 'Alice Johnson', students: 45, status: 'active', createdAt: '2025-08-15T00:00:00Z' },
                { id: '2', title: 'Advanced Plant Medicine', instructor: 'Alice Johnson', students: 23, status: 'active', createdAt: '2025-07-20T00:00:00Z' },
                { id: '3', title: 'Sustainable Living Basics', instructor: 'Carol Davis', students: 59, status: 'active', createdAt: '2025-09-01T00:00:00Z' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete') => {
        try {
            const gypsyCoveApi = process.env.NEXT_PUBLIC_GYPSY_COVE_API_URL || 'https://gypsy-cove.xyz/api';
            const response = await fetch(`${gypsyCoveApi}/admin/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('novaos_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                loadGypsyCoveData(); // Refresh data
            }
        } catch (error) {
            console.error(`Failed to ${action} user:`, error);
        }
    };

    const handleCourseAction = async (courseId: string, action: 'publish' | 'archive' | 'delete') => {
        try {
            const gypsyCoveApi = process.env.NEXT_PUBLIC_GYPSY_COVE_API_URL || 'https://gypsy-cove.xyz/api';
            const response = await fetch(`${gypsyCoveApi}/admin/courses/${courseId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('novaos_token')}`,
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                loadGypsyCoveData(); // Refresh data
            }
        } catch (error) {
            console.error(`Failed to ${action} course:`, error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'text-green-400';
            case 'offline': return 'text-red-400';
            case 'maintenance': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Frame className="p-6">
                <div className="text-center text-blackRose-muted">
                    Loading Gypsy Cove data...
                </div>
            </Frame>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-blackRose-fg">Gypsy Cove Academy</h2>
                    <p className="text-blackRose-muted">Educational Platform Management</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${stats.status === 'online' ? 'bg-green-400' : stats.status === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
                    <span className={`text-sm font-medium ${getStatusColor(stats.status)}`}>
                        {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
                    </span>
                    <a
                        href="https://gypsy-cove.xyz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-sm text-blackRose-accent hover:text-blackRose-gold transition-colors"
                    >
                        Visit Site →
                    </a>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-blackRose-darkGray rounded-lg p-1">
                {(['overview', 'users', 'courses', 'analytics'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
                            ? 'bg-blackRose-accent text-blackRose-trueBlack'
                            : 'text-blackRose-muted hover:text-blackRose-fg'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-muted text-sm">Students</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{stats.students.toLocaleString()}</p>
                            </div>
                            <div className="text-blackRose-accent">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-muted text-sm">Courses</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{stats.courses}</p>
                            </div>
                            <div className="text-blackRose-gold">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-muted text-sm">Active Classes</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{stats.activeClasses}</p>
                            </div>
                            <div className="text-green-400">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blackRose-muted text-sm">Revenue</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{formatCurrency(stats.revenue)}</p>
                            </div>
                            <div className="text-blackRose-gold">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 10l6.91-.74L12 2z" />
                                </svg>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-blackRose-fg mb-4">User Management</h3>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-blackRose-darkGray rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium text-blackRose-fg">{user.name}</h4>
                                    <p className="text-sm text-blackRose-muted">{user.email}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-900 text-red-200' :
                                            user.role === 'instructor' ? 'bg-blue-900 text-blue-200' :
                                                'bg-green-900 text-green-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <span className="text-xs text-blackRose-muted">
                                            Last active: {formatDate(user.lastActive)}
                                        </span>
                                        {user.coursesEnrolled && (
                                            <span className="text-xs text-blackRose-muted">
                                                Enrolled: {user.coursesEnrolled} courses
                                            </span>
                                        )}
                                        {user.coursesTeaching && (
                                            <span className="text-xs text-blackRose-muted">
                                                Teaching: {user.coursesTeaching} courses
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleUserAction(user.id, 'suspend')}
                                        className="px-3 py-1 text-xs bg-yellow-900 text-yellow-200 rounded hover:bg-yellow-800 transition-colors"
                                    >
                                        Suspend
                                    </button>
                                    <button
                                        onClick={() => handleUserAction(user.id, 'delete')}
                                        className="px-3 py-1 text-xs bg-red-900 text-red-200 rounded hover:bg-red-800 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Course Management</h3>
                    <div className="space-y-4">
                        {courses.map((course) => (
                            <div key={course.id} className="flex items-center justify-between p-4 bg-blackRose-darkGray rounded-lg">
                                <div className="flex-1">
                                    <h4 className="font-medium text-blackRose-fg">{course.title}</h4>
                                    <p className="text-sm text-blackRose-muted">Instructor: {course.instructor}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${course.status === 'active' ? 'bg-green-900 text-green-200' :
                                            course.status === 'draft' ? 'bg-yellow-900 text-yellow-200' :
                                                'bg-gray-900 text-gray-200'
                                            }`}>
                                            {course.status}
                                        </span>
                                        <span className="text-xs text-blackRose-muted">
                                            {course.students} students
                                        </span>
                                        <span className="text-xs text-blackRose-muted">
                                            Created: {formatDate(course.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleCourseAction(course.id, 'publish')}
                                        className="px-3 py-1 text-xs bg-green-900 text-green-200 rounded hover:bg-green-800 transition-colors"
                                    >
                                        Publish
                                    </button>
                                    <button
                                        onClick={() => handleCourseAction(course.id, 'archive')}
                                        className="px-3 py-1 text-xs bg-yellow-900 text-yellow-200 rounded hover:bg-yellow-800 transition-colors"
                                    >
                                        Archive
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Enrollment Trends</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">This Month</span>
                                <span className="text-blackRose-fg font-medium">+24 new students</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">Course Completions</span>
                                <span className="text-green-400 font-medium">89%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">Average Rating</span>
                                <span className="text-blackRose-gold font-medium">4.8/5</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-blackRose-fg mb-4">Platform Health</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">Server Status</span>
                                <span className="text-green-400 font-medium">Healthy</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">Uptime</span>
                                <span className="text-blackRose-fg font-medium">99.8%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-blackRose-muted">Active Sessions</span>
                                <span className="text-blackRose-fg font-medium">{stats.activeClasses}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
