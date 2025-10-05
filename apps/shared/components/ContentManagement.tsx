import React, { useState, useCallback } from 'react';
import {
  Upload, Image, Video, FileText, Music, X, Eye, EyeOff,
  Tag, DollarSign, Calendar, Lock, Globe, Heart, MessageCircle,
  MoreHorizontal, Edit, Trash2, Share, BarChart3
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'text' | 'audio';
  thumbnail?: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'private' | 'subscribers' | 'premium';
  price?: number;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  status: 'published' | 'draft' | 'scheduled' | 'review';
  isNSFW: boolean;
}

interface ContentManagementProps {
  platform: 'black-rose' | 'gypsy-cove' | 'novaos';
  userRole: 'creator' | 'admin' | 'moderator';
  onContentAction: (action: string, contentId: string) => void;
}

const ContentManagement: React.FC<ContentManagementProps> = ({
  platform,
  userRole,
  onContentAction
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'scheduled' | 'analytics'>('all');
  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'earnings'>('newest');

  // Mock content data
  const [content, setContent] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Summer Sunset Photography',
      type: 'image',
      thumbnail: '/api/placeholder/300/200',
      description: 'Beautiful sunset captured during summer vacation',
      tags: ['photography', 'sunset', 'nature'],
      visibility: 'public',
      likes: 124,
      comments: 18,
      views: 2340,
      createdAt: '2024-09-15T10:30:00Z',
      status: 'published',
      isNSFW: false
    },
    {
      id: '2',
      title: 'Creative Process Behind the Scenes',
      type: 'video',
      thumbnail: '/api/placeholder/300/200',
      description: 'Exclusive behind-the-scenes content for subscribers',
      tags: ['bts', 'creative', 'exclusive'],
      visibility: 'subscribers',
      price: 15,
      likes: 89,
      comments: 32,
      views: 1580,
      createdAt: '2024-09-14T15:20:00Z',
      status: 'published',
      isNSFW: platform === 'black-rose'
    },
    {
      id: '3',
      title: 'Upcoming Project Announcement',
      type: 'text',
      description: 'Draft post about upcoming collaboration project',
      tags: ['announcement', 'collaboration'],
      visibility: 'public',
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: '2024-09-16T09:15:00Z',
      status: 'draft',
      isNSFW: false
    }
  ]);

  const platformConfig = {
    'black-rose': {
      name: 'Black Rose Collective',
      color: 'rose',
      contentTypes: ['image', 'video', 'text', 'audio'],
      monetization: true,
      nsfwContent: true
    },
    'gypsy-cove': {
      name: 'GypsyCove',
      color: 'purple',
      contentTypes: ['image', 'video', 'text'],
      monetization: false,
      nsfwContent: false
    },
    'novaos': {
      name: 'NovaOS Console',
      color: 'blue',
      contentTypes: ['text'],
      monetization: false,
      nsfwContent: false
    }
  };

  const config = platformConfig[platform];

  const handleContentUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Simulate file processing
      const newContent: ContentItem = {
        id: Date.now().toString(),
        title: file.name.split('.')[0],
        type: file.type.startsWith('image/') ? 'image' :
          file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' : 'text',
        description: '',
        tags: [],
        visibility: 'draft' as const,
        likes: 0,
        comments: 0,
        views: 0,
        createdAt: new Date().toISOString(),
        status: 'draft' as const,
        isNSFW: false
      };

      setContent(prev => [newContent, ...prev]);
    });

    setIsUploadModalOpen(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleContentUpload(e.dataTransfer.files);
  }, [handleContentUpload]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'subscribers': return <Heart className="h-4 w-4" />;
      case 'premium': return <DollarSign className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredContent = content.filter(item => {
    if (activeTab !== 'all' && activeTab !== 'analytics' && item.status !== activeTab) return false;
    if (filterTags.length > 0 && !filterTags.some(tag => item.tags.includes(tag))) return false;
    return true;
  });

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return (b.likes + b.comments + b.views) - (a.likes + a.comments + a.views);
      case 'earnings':
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });

  const renderUploadModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsUploadModalOpen(false)} />

        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Content</h3>
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  accept={config.contentTypes.includes('image') ? 'image/*,video/*,audio/*' : 'text/*'}
                  onChange={(e) => handleContentUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: {config.contentTypes.join(', ')}
            </p>
          </div>

          {config.nsfwContent && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-xs text-amber-800">
                <strong>Content Guidelines:</strong> All uploaded content will be reviewed for compliance with our community guidelines and age verification requirements.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContentCard = (item: ContentItem) => (
    <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Content Preview */}
      <div className="relative">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            {getContentTypeIcon(item.type)}
          </div>
        )}

        {/* Overlay Icons */}
        <div className="absolute top-2 left-2 flex space-x-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          {item.isNSFW && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              18+
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 flex space-x-1">
          {getVisibilityIcon(item.visibility)}
          {item.price && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              ${item.price}
            </span>
          )}
        </div>

        {/* Action Menu */}
        <div className="absolute bottom-2 right-2">
          <button className="p-1 bg-white rounded-full shadow-sm hover:shadow-md">
            <MoreHorizontal className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1">{item.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{item.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {item.views.toLocaleString()}
            </span>
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {item.likes}
            </span>
            <span className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {item.comments}
            </span>
          </div>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <button className="text-xs text-gray-600 hover:text-gray-800 flex items-center">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </button>
            <button className="text-xs text-gray-600 hover:text-gray-800 flex items-center">
              <Share className="h-3 w-3 mr-1" />
              Share
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </button>
            <button className="text-xs text-red-600 hover:text-red-800">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'all', name: 'All Content', count: content.length },
    { id: 'published', name: 'Published', count: content.filter(item => item.status === 'published').length },
    { id: 'drafts', name: 'Drafts', count: content.filter(item => item.status === 'draft').length },
    { id: 'scheduled', name: 'Scheduled', count: content.filter(item => item.status === 'scheduled').length },
    { id: 'analytics', name: 'Analytics', count: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage and organize your {config.name} content</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${config.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
              config.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          <Upload className="h-4 w-4 mr-2 inline" />
          Upload Content
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                  ? `border-${config.color}-500 text-${config.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                    ? `bg-${config.color}-100 text-${config.color}-600`
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
            {config.monetization && <option value="earnings">Highest Earnings</option>}
          </select>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current"></div>
                <div className="bg-current"></div>
                <div className="bg-current"></div>
                <div className="bg-current"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <div className="w-4 h-4 flex flex-col justify-between">
                <div className="h-0.5 bg-current"></div>
                <div className="h-0.5 bg-current"></div>
                <div className="h-0.5 bg-current"></div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {sortedContent.length} item{sortedContent.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'analytics' ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Track your content performance with detailed analytics and insights
          </p>
          <button className={`px-4 py-2 rounded-md text-sm font-medium text-white ${config.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
              config.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                'bg-blue-600 hover:bg-blue-700'
            }`}>
            View Detailed Analytics
          </button>
        </div>
      ) : sortedContent.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {sortedContent.map(renderContentCard)}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
          <p className="text-gray-600 mb-4">
            Get started by uploading your first piece of content
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${config.color === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                config.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            <Upload className="h-4 w-4 mr-2 inline" />
            Upload Content
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && renderUploadModal()}
    </div>
  );
};

export default ContentManagement;