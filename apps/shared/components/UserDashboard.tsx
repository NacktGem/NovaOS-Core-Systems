import React, { useState, useEffect } from 'react';
import {
  User, Settings, Bell, Shield, CreditCard, BarChart3,
  Upload, Eye, Heart, MessageCircle, DollarSign, Calendar,
  TrendingUp, Users, FileText, Download, Zap
} from 'lucide-react';
import CreatorProductivity from './CreatorProductivity';

interface UserDashboardProps {
  platform: 'novaos' | 'black-rose' | 'gypsy-cove';
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    avatar?: string;
    verified: boolean;
    createdAt: string;
  };
}

interface DashboardStats {
  followers?: number;
  following?: number;
  posts?: number;
  likes?: number;
  earnings?: number;
  views?: number;
  subscribers?: number;
  agentsManaged?: number;
  systemUptime?: number;
  alertsActive?: number;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ platform, user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'settings' | 'earnings' | 'productivity'>('overview');
  const [stats, setStats] = useState<DashboardStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    time: string;
  }>>([]);

  const platformConfig = {
    'novaos': {
      name: 'NovaOS Console',
      color: 'blue',
      primaryMetric: 'agentsManaged',
      features: ['Agent Monitoring', 'System Analytics', 'Administrative Controls']
    },
    'black-rose': {
      name: 'Black Rose Collective',
      color: 'rose',
      primaryMetric: 'earnings',
      features: ['Content Creation', 'Monetization', 'Community']
    },
    'gypsy-cove': {
      name: 'GypsyCove',
      color: 'purple',
      primaryMetric: 'followers',
      features: ['Social Networking', 'Content Sharing', 'Community Building']
    }
  };

  const config = platformConfig[platform];

  useEffect(() => {
    fetchDashboardData();
  }, [platform, user.id]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with actual endpoint
      const response = await fetch(`/api/dashboard/${platform}/${user.id}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats || {});
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set mock data for demonstration
      setStats(getMockStats());
      setNotifications(getMockNotifications());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockStats = (): DashboardStats => {
    switch (platform) {
      case 'novaos':
        return {
          agentsManaged: 7,
          systemUptime: 99.8,
          alertsActive: 3,
          posts: 45
        };
      case 'black-rose':
        return {
          followers: 1250,
          subscribers: 890,
          earnings: 3420,
          views: 15680,
          posts: 127
        };
      case 'gypsy-cove':
        return {
          followers: 2140,
          following: 890,
          posts: 234,
          likes: 5670,
          views: 12340
        };
      default:
        return {};
    }
  };

  const getMockNotifications = () => [
    {
      id: 1,
      type: 'info',
      title: 'Welcome to your dashboard',
      message: 'Explore your new dashboard features',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'success',
      title: 'Profile verified',
      message: 'Your account has been successfully verified',
      time: '1 day ago'
    }
  ];

  const getColorClasses = (intensity: string = 'primary') => {
    const colors = {
      blue: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'text-blue-600 bg-blue-50',
        border: 'border-blue-200',
        light: 'bg-blue-50'
      },
      rose: {
        primary: 'bg-rose-600 hover:bg-rose-700 text-white',
        secondary: 'text-rose-600 bg-rose-50',
        border: 'border-rose-200',
        light: 'bg-rose-50'
      },
      purple: {
        primary: 'bg-purple-600 hover:bg-purple-700 text-white',
        secondary: 'text-purple-600 bg-purple-50',
        border: 'border-purple-200',
        light: 'bg-purple-50'
      }
    };
    return colors[config.color][intensity];
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ComponentType<any>, trend?: string) => {
    const Icon = icon;
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {trend} from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${getColorClasses('light')}`}>
            <Icon className={`h-6 w-6 ${getColorClasses('secondary').split(' ')[0]}`} />
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    const getStatsForPlatform = () => {
      switch (platform) {
        case 'novaos':
          return [
            { title: 'Agents Managed', value: stats.agentsManaged || 0, icon: Users, trend: '+2 this month' },
            { title: 'System Uptime', value: `${stats.systemUptime || 0}%`, icon: BarChart3, trend: '+0.2%' },
            { title: 'Active Alerts', value: stats.alertsActive || 0, icon: Bell, trend: '-1 from last week' },
            { title: 'Reports Generated', value: stats.posts || 0, icon: FileText, trend: '+12 this month' }
          ];
        case 'black-rose':
          return [
            { title: 'Total Earnings', value: `$${stats.earnings || 0}`, icon: DollarSign, trend: '+$420 this month' },
            { title: 'Subscribers', value: stats.subscribers || 0, icon: Users, trend: '+45 this month' },
            { title: 'Content Views', value: stats.views || 0, icon: Eye, trend: '+2.1k this week' },
            { title: 'Content Posts', value: stats.posts || 0, icon: Upload, trend: '+8 this week' }
          ];
        case 'gypsy-cove':
          return [
            { title: 'Followers', value: stats.followers || 0, icon: Users, trend: '+127 this month' },
            { title: 'Following', value: stats.following || 0, icon: Heart, trend: '+23 this month' },
            { title: 'Total Posts', value: stats.posts || 0, icon: Upload, trend: '+15 this week' },
            { title: 'Likes Received', value: stats.likes || 0, icon: Heart, trend: '+340 this week' }
          ];
        default:
          return [];
      }
    };

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className={`${getColorClasses('light')} p-6 rounded-lg`}>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
              <User className={`h-6 w-6 ${getColorClasses('secondary').split(' ')[0]}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {user.username}!
              </h2>
              <p className="text-gray-600">
                {config.name} • Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStatsForPlatform().map((stat, index) => (
            <div key={index}>
              {renderStatCard(stat.title, stat.value, stat.icon, stat.trend)}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platform === 'novaos' && (
              <>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Manage Agents</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">View Analytics</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Bell className="h-4 w-4" />
                  <span className="text-sm font-medium">Check Alerts</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">Export Data</span>
                </button>
              </>
            )}
            {platform === 'black-rose' && (
              <>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload Content</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">View Earnings</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Manage Fans</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Promotions</span>
                </button>
              </>
            )}
            {platform === 'gypsy-cove' && (
              <>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Create Post</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Messages</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Discover People</span>
                </button>
                <button className={`flex items-center justify-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Trending</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100' :
                    notification.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                    <Bell className={`h-3 w-3 ${notification.type === 'success' ? 'text-green-600' :
                      notification.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent notifications</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Content Management</h2>
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${getColorClasses('primary')}`}>
          <Upload className="h-4 w-4 mr-2 inline" />
          {platform === 'black-rose' ? 'Upload Content' : platform === 'novaos' ? 'Generate Report' : 'Create Post'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Content Management</h3>
        <p className="text-gray-600 mb-4">
          {platform === 'black-rose'
            ? 'Upload and manage your premium content'
            : platform === 'novaos'
              ? 'Create and manage system reports'
              : 'Create and share your posts'
          }
        </p>
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${getColorClasses('primary')}`}>
          Get Started
        </button>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>

      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
        <p className="text-gray-600 mb-4">
          Track your performance with detailed analytics and insights
        </p>
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${getColorClasses('primary')}`}>
          View Analytics
        </button>
      </div>
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Earnings</h2>

      {platform === 'black-rose' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStatCard('Total Earnings', `$${stats.earnings || 0}`, DollarSign, '+$420 this month')}
          {renderStatCard('This Month', '$420', Calendar, '+15% vs last month')}
          {renderStatCard('Pending Payout', '$120', CreditCard, 'Available in 2 days')}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Earnings</h3>
          <p className="text-gray-600 mb-4">
            {platform === 'novaos' ? 'Enterprise billing and usage metrics' : 'Monetization features coming soon'}
          </p>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Profile Settings</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Update your profile information and preferences</p>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Edit Profile →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Security</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Manage your account security and privacy settings</p>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Security Settings →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Notifications</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Control what notifications you receive</p>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Notification Settings →
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Billing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Manage your subscription and payment methods</p>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Billing Settings →
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'content', name: 'Content', icon: Upload },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    ...(platform === 'black-rose' ? [{ id: 'earnings', name: 'Earnings', icon: DollarSign }] : []),
    ...((platform === 'black-rose' || platform === 'gypsy-cove') &&
      (user.role === 'creator' || user.role === 'admin') ?
      [{ id: 'productivity', name: 'Creator Tools', icon: Zap }] : []),
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">{config.name}</h1>
              {user.verified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <nav className="flex space-x-8 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                  ? `${getColorClasses('primary')}`
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="pb-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'content' && renderContent()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'earnings' && renderEarnings()}
          {activeTab === 'productivity' && (
            <CreatorProductivity
              platform={platform as 'black-rose' | 'gypsy-cove'}
              userRole={user.role}
              userId={user.id}
            />
          )}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;