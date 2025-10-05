import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Check, AlertCircle, Shield, CreditCard } from 'lucide-react';

interface SignupFlowProps {
  platform: 'novaos' | 'black-rose' | 'gypsy-cove';
  onSignupComplete: (userData: any) => void;
  onCancel: () => void;
}

interface FormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  newsletterOptIn: boolean;
  creatorAccount: boolean;
}

const SignupFlow: React.FC<SignupFlowProps> = ({ platform, onSignupComplete, onCancel }) => {
  const [step, setStep] = useState<'details' | 'verification' | 'preferences' | 'complete'>('details');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    acceptTerms: false,
    acceptPrivacy: false,
    newsletterOptIn: true,
    creatorAccount: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const platformConfig = {
    'novaos': {
      name: 'NovaOS Console',
      description: 'AI Agent Management Platform',
      color: 'blue',
      requiresAge: false,
      features: ['Agent Monitoring', 'System Analytics', 'Administrative Controls']
    },
    'black-rose': {
      name: 'Black Rose Collective',
      description: 'Premium Adult Content Platform',
      color: 'rose',
      requiresAge: true,
      features: ['Content Creation', 'Monetization', 'Community']
    },
    'gypsy-cove': {
      name: 'GypsyCove',
      description: 'Social Media Platform',
      color: 'purple',
      requiresAge: false,
      features: ['Social Networking', 'Content Sharing', 'Community Building']
    }
  };

  const config = platformConfig[platform];

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength < 3) return 'weak';
    if (strength < 5) return 'medium';
    return 'strong';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength === 'weak') {
      newErrors.password = 'Password is too weak';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Age verification for adult platforms
    if (config.requiresAge && formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() -
        (today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);

      if (age < 18) {
        newErrors.birthDate = 'You must be 18 or older to join this platform';
      }
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the Terms of Service';
    }

    if (!formData.acceptPrivacy) {
      newErrors.acceptPrivacy = 'You must accept the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmitDetails = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Check if username/email already exists
      const response = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username
        })
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: result.message || 'Please try again' });
        }
        return;
      }

      // Proceed to verification step
      if (config.requiresAge) {
        setStep('verification');
      } else {
        setStep('preferences');
      }

    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platform,
          preferences: {
            newsletter: formData.newsletterOptIn,
            creator: formData.creatorAccount
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setStep('complete');
        setTimeout(() => {
          onSignupComplete(result.user);
        }, 2000);
      } else {
        setErrors({ general: result.message || 'Account creation failed' });
        setStep('details');
      }

    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
      setStep('details');
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClasses = (intensity: string = 'primary') => {
    const colors = {
      blue: {
        primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'text-blue-600 border-blue-200',
        bg: 'bg-blue-50'
      },
      rose: {
        primary: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
        secondary: 'text-rose-600 border-rose-200',
        bg: 'bg-rose-50'
      },
      purple: {
        primary: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
        secondary: 'text-purple-600 border-purple-200',
        bg: 'bg-purple-50'
      }
    };
    return colors[config.color][intensity];
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`mx-auto h-16 w-16 rounded-full ${getColorClasses('bg')} flex items-center justify-center mb-4`}>
          <User className={`h-8 w-8 ${getColorClasses('secondary').split(' ')[0]}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Join {config.name}
        </h2>
        <p className="text-gray-600 max-w-md mx-auto mb-4">
          {config.description}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {config.features.map((feature, index) => (
            <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses('bg')} ${getColorClasses('secondary').split(' ')[0]}`}>
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="your@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.username ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="username"
            />
          </div>
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`block w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all ${passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                          'bg-green-500 w-full'
                      }`}
                  />
                </div>
                <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-600' :
                    passwordStrength === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                  }`}>
                  {passwordStrength}
                </span>
              </div>
            </div>
          )}
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="Confirm your password"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>

        {config.requiresAge && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className={`block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.birthDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
            />
            <p className="mt-1 text-xs text-gray-500">You must be 18 or older to join this platform</p>
            {errors.birthDate && <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
            className={`mt-0.5 h-4 w-4 rounded border-gray-300 ${getColorClasses('primary').includes('blue') ? 'text-blue-600 focus:ring-blue-500' : getColorClasses('primary').includes('rose') ? 'text-rose-600 focus:ring-rose-500' : 'text-purple-600 focus:ring-purple-500'}`}
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <a href="/legal/terms-of-service" target="_blank" className={`${getColorClasses('secondary').split(' ')[0]} hover:underline`}>
              Terms of Service
            </a>
            {errors.acceptTerms && <span className="block text-red-600">{errors.acceptTerms}</span>}
          </span>
        </label>

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={formData.acceptPrivacy}
            onChange={(e) => handleInputChange('acceptPrivacy', e.target.checked)}
            className={`mt-0.5 h-4 w-4 rounded border-gray-300 ${getColorClasses('primary').includes('blue') ? 'text-blue-600 focus:ring-blue-500' : getColorClasses('primary').includes('rose') ? 'text-rose-600 focus:ring-rose-500' : 'text-purple-600 focus:ring-purple-500'}`}
          />
          <span className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <a href="/legal/privacy-policy" target="_blank" className={`${getColorClasses('secondary').split(' ')[0]} hover:underline`}>
              Privacy Policy
            </a>
            {errors.acceptPrivacy && <span className="block text-red-600">{errors.acceptPrivacy}</span>}
          </span>
        </label>
      </div>

      {errors.general && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-600">{errors.general}</span>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmitDetails}
          disabled={isLoading}
          className={`flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getColorClasses('primary')}`}
        >
          {isLoading ? 'Validating...' : 'Continue'}
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6 text-center">
      <Shield className={`mx-auto h-16 w-16 ${getColorClasses('secondary').split(' ')[0]}`} />
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Age Verification Required
        </h2>
        <p className="text-gray-600">
          As an adult platform, we need to verify that you're 18 or older before you can create your account.
        </p>
      </div>

      <div className={`p-4 ${getColorClasses('bg')} rounded-lg`}>
        <CreditCard className={`mx-auto h-8 w-8 ${getColorClasses('secondary').split(' ')[0]} mb-2`} />
        <h3 className="font-medium text-gray-900 mb-1">Quick Verification</h3>
        <p className="text-sm text-gray-600">
          We'll verify your age securely and continue with account creation.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setStep('details')}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep('preferences')}
          className={`flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${getColorClasses('primary')}`}
        >
          Verify Age
        </button>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Account Preferences
        </h2>
        <p className="text-gray-600">
          Customize your {config.name} experience
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Newsletter Updates</div>
            <div className="text-sm text-gray-500">Receive platform updates and new features</div>
          </div>
          <input
            type="checkbox"
            checked={formData.newsletterOptIn}
            onChange={(e) => handleInputChange('newsletterOptIn', e.target.checked)}
            className={`h-4 w-4 rounded border-gray-300 ${getColorClasses('primary').includes('blue') ? 'text-blue-600 focus:ring-blue-500' : getColorClasses('primary').includes('rose') ? 'text-rose-600 focus:ring-rose-500' : 'text-purple-600 focus:ring-purple-500'}`}
          />
        </label>

        {(platform === 'black-rose' || platform === 'gypsy-cove') && (
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Creator Account</div>
              <div className="text-sm text-gray-500">Enable content creation and monetization features</div>
            </div>
            <input
              type="checkbox"
              checked={formData.creatorAccount}
              onChange={(e) => handleInputChange('creatorAccount', e.target.checked)}
              className={`h-4 w-4 rounded border-gray-300 ${getColorClasses('primary').includes('blue') ? 'text-blue-600 focus:ring-blue-500' : getColorClasses('primary').includes('rose') ? 'text-rose-600 focus:ring-rose-500' : 'text-purple-600 focus:ring-purple-500'}`}
            />
          </label>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setStep(config.requiresAge ? 'verification' : 'details')}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleCreateAccount}
          disabled={isLoading}
          className={`flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getColorClasses('primary')}`}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className={`mx-auto h-16 w-16 rounded-full ${getColorClasses('bg')} flex items-center justify-center`}>
        <Check className={`h-8 w-8 ${getColorClasses('secondary').split(' ')[0]}`} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Welcome to {config.name}!
        </h2>
        <p className="text-gray-600">
          Your account has been created successfully. You'll be redirected to your dashboard shortly.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          {step === 'details' && renderDetailsStep()}
          {step === 'verification' && renderVerificationStep()}
          {step === 'preferences' && renderPreferencesStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default SignupFlow;