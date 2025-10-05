'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProfileData {
    id: string;
    username: string;
    email: string;
    display_name: string;
    bio: string;
    location: string;
    website: string;
    profile_image_url: string | null;
    role: string;
    tier: string;
    created_at: string;
    updated_at: string;
}

export default function ProfileManagement() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        display_name: '',
        bio: '',
        location: '',
        website: ''
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setProfile(data.user);
                setFormData({
                    username: data.user.username,
                    email: data.user.email,
                    display_name: data.user.display_name || '',
                    bio: data.user.bio || '',
                    location: data.user.location || '',
                    website: data.user.website || ''
                });
            } else {
                setError('Failed to load profile');
            }
        } catch (err) {
            setError('Network error loading profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                setProfile(data.user);
                setIsEditing(false);
                setSuccess('Profile updated successfully');
            } else {
                setError(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('Network error updating profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        setImageUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/upload/profile-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, profile_image_url: data.file.url } : null);
                setSuccess('Profile image updated');
                setImageFile(null);
            } else {
                setError(data.message || 'Failed to upload image');
            }
        } catch (err) {
            setError('Network error uploading image');
        } finally {
            setImageUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/profile/image', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setProfile(prev => prev ? { ...prev, profile_image_url: null } : null);
                setSuccess('Profile image deleted');
            } else {
                setError(data.message || 'Failed to delete image');
            }
        } catch (err) {
            setError('Network error deleting image');
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setPasswordChanging(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Password changed successfully');
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                setShowPasswordForm(false);
            } else {
                setError(data.message || 'Failed to change password');
            }
        } catch (err) {
            setError('Network error changing password');
        } finally {
            setPasswordChanging(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white">Profile Management</h1>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/20 border border-green-500/50 text-green-300 p-4 rounded-lg mb-6">
                            {success}
                        </div>
                    )}

                    {/* Profile Image Section */}
                    <div className="flex items-center space-x-6 mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden">
                                {profile?.profile_image_url ? (
                                    <img
                                        src={profile.profile_image_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {imageUploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        handleImageUpload(file);
                                    }
                                }}
                                className="hidden"
                                id="profile-image"
                            />
                            <label
                                htmlFor="profile-image"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-all duration-200 inline-block"
                            >
                                Upload Photo
                            </label>
                            {profile?.profile_image_url && (
                                <button
                                    onClick={handleDeleteImage}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 ml-2"
                                >
                                    Delete Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.username}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.display_name || 'Not set'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.location || 'Not set'}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                            {isEditing ? (
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.website || 'Not set'}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            ) : (
                                <p className="text-white py-3">{profile?.bio || 'No bio set'}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="flex space-x-4 mt-8">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        username: profile?.username || '',
                                        email: profile?.email || '',
                                        display_name: profile?.display_name || '',
                                        bio: profile?.bio || '',
                                        location: profile?.location || '',
                                        website: profile?.website || ''
                                    });
                                }}
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Password Change Section */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-white">Security</h2>
                            {!showPasswordForm && (
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-all duration-200"
                                >
                                    Change Password
                                </button>
                            )}
                        </div>

                        {showPasswordForm && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={passwordChanging}
                                        className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all duration-200 disabled:opacity-50"
                                    >
                                        {passwordChanging ? 'Changing...' : 'Change Password'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                                        }}
                                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Account Info */}
                    <div className="mt-12 pt-8 border-t border-white/20">
                        <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Role:</span>
                                <span className="text-white ml-2 capitalize">{profile?.role}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Tier:</span>
                                <span className="text-white ml-2 capitalize">{profile?.tier}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Member since:</span>
                                <span className="text-white ml-2">
                                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">Last updated:</span>
                                <span className="text-white ml-2">
                                    {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
