import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Flag, Shield, Clock } from 'lucide-react';

interface ContentModerationProps {
    contentId: string;
    contentType: 'image' | 'video' | 'text' | 'audio';
    contentUrl?: string;
    creatorId: string;
    isNSFW?: boolean;
    onModerationComplete?: (approved: boolean, rating: string) => void;
}

interface ModerationResult {
    rating: 'safe' | 'suggestive' | 'adult' | 'explicit';
    confidence: number;
    flags: string[];
    approved: boolean;
}

const ContentModeration: React.FC<ContentModerationProps> = ({
    contentId,
    contentType,
    contentUrl,
    creatorId,
    isNSFW = false,
    onModerationComplete
}) => {
    const [isReporting, setIsReporting] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [moderationStatus, setModerationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
    const [isContentHidden, setIsContentHidden] = useState(isNSFW);
    const [error, setError] = useState<string>('');

    const reportReasons = [
        { id: 'inappropriate', label: 'Inappropriate Content', description: 'Content not suitable for the platform' },
        { id: 'harassment', label: 'Harassment or Abuse', description: 'Content that harasses or abuses others' },
        { id: 'spam', label: 'Spam or Misleading', description: 'Spam content or misleading information' },
        { id: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
        { id: 'underage', label: 'Underage Content', description: 'Content involving minors' },
        { id: 'non_consensual', label: 'Non-Consensual', description: 'Content shared without consent' },
        { id: 'illegal', label: 'Illegal Activity', description: 'Content depicting illegal activities' },
        { id: 'other', label: 'Other', description: 'Other policy violations' }
    ];

    const handleSubmitForModeration = async () => {
        try {
            const response = await fetch('/api/compliance/content-moderation/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content_id: contentId,
                    content_type: contentType,
                    content_url: contentUrl,
                    creator_id: creatorId,
                    metadata: {
                        user_flagged: false,
                        automatic_submission: true
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                setModerationStatus('pending');
                // Simulate moderation result (in real implementation, this would come from the backend)
                setTimeout(() => {
                    const mockResult: ModerationResult = {
                        rating: isNSFW ? 'adult' : 'safe',
                        confidence: 0.95,
                        flags: [],
                        approved: true
                    };
                    setModerationStatus('approved');
                    onModerationComplete?.(mockResult.approved, mockResult.rating);
                }, 2000);
            } else {
                setError(result.message || 'Moderation submission failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const handleReportContent = async () => {
        if (!reportReason) {
            setError('Please select a reason for reporting');
            return;
        }

        try {
            const response = await fetch('/api/compliance/content-moderation/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content_id: contentId,
                    reason: reportReason,
                    description: reportDescription,
                    reporter_id: 'current_user' // This would be the actual user ID
                })
            });

            const result = await response.json();

            if (result.success) {
                setIsReporting(false);
                setReportReason('');
                setReportDescription('');
                alert('Thank you for your report. We will review this content promptly.');
            } else {
                setError(result.message || 'Report submission failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    const getModerationStatusIcon = () => {
        switch (moderationStatus) {
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'approved':
                return <Shield className="h-4 w-4 text-green-500" />;
            case 'rejected':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
    };

    const getModerationStatusText = () => {
        switch (moderationStatus) {
            case 'pending':
                return 'Under Review';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
        }
    };

    const getModerationStatusColor = () => {
        switch (moderationStatus) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200';
        }
    };

    if (isReporting) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-full p-4">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsReporting(false)} />

                    <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center mb-4">
                            <Flag className="h-6 w-6 text-red-500 mr-2" />
                            <h3 className="text-lg font-medium text-gray-900">Report Content</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for reporting
                                </label>
                                <div className="space-y-2">
                                    {reportReasons.map((reason) => (
                                        <label key={reason.id} className="flex items-start">
                                            <input
                                                type="radio"
                                                name="report-reason"
                                                value={reason.id}
                                                checked={reportReason === reason.id}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                className="mt-1 h-4 w-4 text-rose-600 border-gray-300 focus:ring-rose-500"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{reason.label}</div>
                                                <div className="text-xs text-gray-500">{reason.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional details (optional)
                                </label>
                                <textarea
                                    id="report-description"
                                    rows={3}
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                                    placeholder="Provide any additional context about this report..."
                                />
                            </div>

                            {error && (
                                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <span className="text-sm text-red-600">{error}</span>
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsReporting(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReportContent}
                                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Moderation Status Badge */}
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getModerationStatusColor()}`}>
                {getModerationStatusIcon()}
                <span className="ml-1">{getModerationStatusText()}</span>
            </div>

            {/* Content Warning for NSFW */}
            {isNSFW && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-amber-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">
                                Adult Content Warning
                            </h3>
                            <p className="mt-1 text-sm text-amber-700">
                                This content contains adult material and is intended for mature audiences only.
                            </p>
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsContentHidden(!isContentHidden)}
                                    className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-500"
                                >
                                    {isContentHidden ? (
                                        <>
                                            <Eye className="h-4 w-4 mr-1" />
                                            Show Content
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="h-4 w-4 mr-1" />
                                            Hide Content
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Display */}
            {!isContentHidden && (
                <div className="relative">
                    {contentType === 'image' && contentUrl && (
                        <img
                            src={contentUrl}
                            alt="User content"
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                    {contentType === 'video' && contentUrl && (
                        <video
                            src={contentUrl}
                            controls
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                    {contentType === 'text' && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-800">Text content would be displayed here</p>
                        </div>
                    )}
                    {contentType === 'audio' && contentUrl && (
                        <audio
                            src={contentUrl}
                            controls
                            className="w-full"
                        />
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
                <button
                    type="button"
                    onClick={handleSubmitForModeration}
                    disabled={moderationStatus === 'pending'}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Shield className="h-4 w-4 mr-1" />
                    {moderationStatus === 'pending' ? 'Processing...' : 'Re-moderate'}
                </button>

                <button
                    type="button"
                    onClick={() => setIsReporting(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                    <Flag className="h-4 w-4 mr-1" />
                    Report
                </button>
            </div>

            {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-600">{error}</span>
                </div>
            )}
        </div>
    );
};

export default ContentModeration;
