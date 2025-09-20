import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, FileText, ExternalLink, Wallet, AlertTriangle } from 'lucide-react';

interface AgeVerificationProps {
    onVerificationComplete: (verified: boolean, method: string) => void;
    onClose: () => void;
}

interface VerificationMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    processingTime: string;
    trustLevel: 'high' | 'medium' | 'low';
}

const AgeVerification: React.FC<AgeVerificationProps> = ({
    onVerificationComplete,
    onClose
}) => {
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [birthDate, setBirthDate] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [step, setStep] = useState<'method' | 'details' | 'processing'>('method');

    const verificationMethods: VerificationMethod[] = [
        {
            id: 'credit_card',
            name: 'Credit Card Verification',
            description: 'Verify your age instantly using a valid credit card',
            icon: CreditCard,
            processingTime: 'Instant',
            trustLevel: 'high'
        },
        {
            id: 'id_document',
            name: 'Government ID',
            description: 'Upload a government-issued photo ID for verification',
            icon: FileText,
            processingTime: '1-2 business days',
            trustLevel: 'high'
        },
        {
            id: 'third_party',
            name: 'Third-Party Service',
            description: 'Verify through trusted age verification partners',
            icon: ExternalLink,
            processingTime: 'Usually instant',
            trustLevel: 'medium'
        },
        {
            id: 'digital_wallet',
            name: 'Digital Wallet',
            description: 'Verify using your digital wallet or banking app',
            icon: Wallet,
            processingTime: 'Instant',
            trustLevel: 'high'
        }
    ];

    const calculateAge = (birthDateString: string): number => {
        const birth = new Date(birthDateString);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    const handleMethodSelect = (methodId: string) => {
        setSelectedMethod(methodId);
        setError('');
    };

    const handleProceedToDetails = () => {
        if (!selectedMethod) {
            setError('Please select a verification method');
            return;
        }
        setStep('details');
    };

    const handleSubmitVerification = async () => {
        if (!birthDate) {
            setError('Please enter your birth date');
            return;
        }

        const age = calculateAge(birthDate);
        if (age < 18) {
            setError('You must be 18 or older to access Black Rose Collective');
            return;
        }

        setIsSubmitting(true);
        setError('');
        setStep('processing');

        try {
            const response = await fetch('/api/compliance/age-verification/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: selectedMethod,
                    birth_date: birthDate,
                    verification_data: {},
                    ip_address: '', // This would be populated by the backend
                    user_agent: navigator.userAgent
                })
            });

            const result = await response.json();

            if (result.success) {
                if (result.status === 'verified') {
                    onVerificationComplete(true, selectedMethod);
                } else {
                    // Show pending status
                    setTimeout(() => {
                        onVerificationComplete(true, selectedMethod);
                    }, 3000);
                }
            } else {
                setError(result.message || 'Verification failed. Please try again.');
                setStep('details');
            }
        } catch (error) {
            setError('Network error. Please check your connection and try again.');
            setStep('details');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTrustBadgeColor = (level: 'high' | 'medium' | 'low'): string => {
        switch (level) {
            case 'high': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const renderMethodSelection = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Shield className="mx-auto h-16 w-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Age Verification Required
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                    Black Rose Collective is an adult platform. Please verify that you are 18 or older to continue.
                </p>
            </div>

            <div className="space-y-3">
                {verificationMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                        <div
                            key={method.id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedMethod === method.id
                                    ? 'border-rose-500 bg-rose-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            onClick={() => handleMethodSelect(method.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <Icon className={`h-6 w-6 mt-1 ${selectedMethod === method.id ? 'text-rose-500' : 'text-gray-400'
                                    }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {method.name}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrustBadgeColor(method.trustLevel)
                                            }`}>
                                            {method.trustLevel} trust
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {method.description}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Processing time: {method.processingTime}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{error}</span>
                </div>
            )}

            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleProceedToDetails}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                    Continue
                </button>
            </div>
        </div>
    );

    const renderDetailsForm = () => (
        <div className="space-y-6">
            <div className="text-center">
                <Shield className="mx-auto h-12 w-12 text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Verification Details
                </h2>
                <p className="text-gray-600">
                    Please provide your birth date to complete verification
                </p>
            </div>

            <div>
                <label htmlFor="birth-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date
                </label>
                <input
                    id="birth-date"
                    name="birth-date"
                    type="date"
                    required
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                    You must be 18 or older to access this platform
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                    <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Privacy Protection
                        </h3>
                        <p className="mt-1 text-sm text-blue-700">
                            Your personal information is encrypted and securely stored. We use your data only for age verification and comply with all privacy regulations.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{error}</span>
                </div>
            )}

            <div className="flex space-x-3">
                <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Verifying...' : 'Verify Age'}
                </button>
            </div>
        </div>
    );

    const renderProcessing = () => (
        <div className="space-y-6 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-rose-500 mx-auto" />
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Processing Verification
                </h2>
                <p className="text-gray-600">
                    Please wait while we verify your information...
                </p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    {step === 'method' && renderMethodSelection()}
                    {step === 'details' && renderDetailsForm()}
                    {step === 'processing' && renderProcessing()}

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            By continuing, you acknowledge that you are 18 or older and agree to our{' '}
                            <a href="/legal/terms-of-service" className="text-rose-600 hover:text-rose-500">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="/legal/privacy-policy" className="text-rose-600 hover:text-rose-500">
                                Privacy Policy
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgeVerification;
