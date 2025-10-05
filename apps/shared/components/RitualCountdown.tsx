import { useState, useEffect } from 'react';
import {
    Clock, Heart, Lock, Flame, Eye, Star, Zap, Crown, Users
} from 'lucide-react';

interface RitualCountdownProps {
    scheduledFor: string;
    title: string;
    description?: string;
    price?: number;
    previewImageUrl?: string;
    platform: 'black-rose' | 'gypsy-cove';
    variant?: 'feed' | 'profile' | 'modal' | 'widget';
    showPreview?: boolean;
    onRitualComplete?: () => void;
    creatorName?: string;
    isSubscriber?: boolean;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

const RitualCountdown: React.FC<RitualCountdownProps> = ({
    scheduledFor,
    title,
    description,
    price,
    previewImageUrl,
    platform,
    variant = 'feed',
    showPreview = false,
    onRitualComplete,
    creatorName,
    isSubscriber = false
}) => {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false
    });
    const [isHovered, setIsHovered] = useState(false);
    const [intensity, setIntensity] = useState(0);

    const platformConfig = {
        'black-rose': {
            name: 'Black Rose Collective',
            theme: 'scarletStudio', // Master Palette theme
            colors: {
                primary: 'from-rose-900 via-rose-800 to-red-900',
                secondary: 'from-rose-100 via-pink-50 to-rose-100',
                accent: 'from-red-600 to-rose-700',
                text: 'text-rose-100',
                textDark: 'text-rose-900',
                border: 'border-rose-300',
                glow: 'shadow-rose-500/25'
            }
        },
        'gypsy-cove': {
            name: 'GypsyCove',
            theme: 'blackRose', // Master Palette theme
            colors: {
                primary: 'from-purple-900 via-indigo-900 to-purple-900',
                secondary: 'from-purple-100 via-indigo-50 to-purple-100',
                accent: 'from-purple-600 to-indigo-700',
                text: 'text-purple-100',
                textDark: 'text-purple-900',
                border: 'border-purple-300',
                glow: 'shadow-purple-500/25'
            }
        }
    };

    const config = platformConfig[platform];

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const now = new Date().getTime();
            const target = new Date(scheduledFor).getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeRemaining({
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true
                });
                if (onRitualComplete) {
                    onRitualComplete();
                }
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Calculate intensity based on time remaining (for visual effects)
            const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
            let newIntensity = 0;
            if (totalMinutes <= 60) newIntensity = 3; // Ultra high intensity
            else if (totalMinutes <= 240) newIntensity = 2; // High intensity
            else if (totalMinutes <= 1440) newIntensity = 1; // Medium intensity

            setIntensity(newIntensity);
            setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
        };

        calculateTimeRemaining();
        const timer = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(timer);
    }, [scheduledFor, onRitualComplete]);

    const getIntensityClasses = () => {
        switch (intensity) {
            case 3:
                return {
                    container: `animate-pulse bg-gradient-to-br ${config.colors.primary} shadow-2xl ${config.colors.glow}`,
                    timer: 'animate-bounce text-red-100',
                    flame: 'animate-pulse text-red-300',
                    glow: 'shadow-red-500/50'
                };
            case 2:
                return {
                    container: `bg-gradient-to-br ${config.colors.primary} shadow-xl ${config.colors.glow}`,
                    timer: 'text-orange-100',
                    flame: 'animate-pulse text-orange-300',
                    glow: 'shadow-orange-500/30'
                };
            case 1:
                return {
                    container: `bg-gradient-to-br ${config.colors.primary} shadow-lg`,
                    timer: 'text-yellow-100',
                    flame: 'text-yellow-300',
                    glow: 'shadow-yellow-500/20'
                };
            default:
                return {
                    container: `bg-gradient-to-br ${config.colors.primary}`,
                    timer: config.colors.text,
                    flame: config.colors.text,
                    glow: ''
                };
        }
    };

    const intensityClasses = getIntensityClasses();

    const formatTimeUnit = (value: number) => {
        return value.toString().padStart(2, '0');
    };

    const getRitualMessage = () => {
        const { days, hours, minutes } = timeRemaining;

        if (timeRemaining.isExpired) return "🔥 RITUAL COMPLETE! 🔥";

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} until the ritual`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} until release`;
        if (minutes > 10) return `${minutes} minutes until unveiling`;
        if (minutes > 0) return "🔥 RITUAL IMMINENT 🔥";
        return "⚡ RELEASING NOW ⚡";
    };

    if (variant === 'widget') {
        return (
            <div className={`p-3 rounded-lg ${intensityClasses.container} ${intensityClasses.glow} border border-opacity-20`}>
                <div className="flex items-center space-x-2">
                    <Flame className={`h-4 w-4 ${intensityClasses.flame}`} />
                    <div className="flex-1">
                        <div className="text-xs font-medium text-white opacity-90 truncate">{title}</div>
                        <div className="flex items-center space-x-1 mt-1">
                            {!timeRemaining.isExpired ? (
                                <>
                                    <span className={`text-sm font-mono font-bold ${intensityClasses.timer}`}>
                                        {timeRemaining.days > 0 && `${formatTimeUnit(timeRemaining.days)}d `}
                                        {formatTimeUnit(timeRemaining.hours)}h {formatTimeUnit(timeRemaining.minutes)}m
                                    </span>
                                    <Clock className="h-3 w-3 text-white opacity-70" />
                                </>
                            ) : (
                                <span className="text-xs font-bold text-green-300 animate-pulse">LIVE NOW!</span>
                            )}
                        </div>
                    </div>
                    {price && (
                        <div className="text-right">
                            <div className="text-xs text-white opacity-70">Premium</div>
                            <div className="text-sm font-bold text-white">${price}</div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (variant === 'modal') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className={`max-w-md w-full rounded-2xl ${intensityClasses.container} ${intensityClasses.glow} border border-opacity-20 overflow-hidden`}>
                    {previewImageUrl && (
                        <div className="relative h-48 bg-black">
                            <img src={previewImageUrl} alt="Ritual preview" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-3 right-3">
                                <Crown className="h-6 w-6 text-yellow-400" />
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        <div className="text-center mb-6">
                            <Flame className={`h-8 w-8 mx-auto mb-3 ${intensityClasses.flame}`} />
                            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                            {creatorName && (
                                <p className="text-sm text-white opacity-70">by {creatorName}</p>
                            )}
                            {description && (
                                <p className="text-sm text-white opacity-80 mt-2">{description}</p>
                            )}
                        </div>

                        {!timeRemaining.isExpired ? (
                            <div className="text-center mb-6">
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {timeRemaining.days > 0 && (
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold font-mono ${intensityClasses.timer}`}>
                                                {formatTimeUnit(timeRemaining.days)}
                                            </div>
                                            <div className="text-xs text-white opacity-70">DAYS</div>
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold font-mono ${intensityClasses.timer}`}>
                                            {formatTimeUnit(timeRemaining.hours)}
                                        </div>
                                        <div className="text-xs text-white opacity-70">HOURS</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold font-mono ${intensityClasses.timer}`}>
                                            {formatTimeUnit(timeRemaining.minutes)}
                                        </div>
                                        <div className="text-xs text-white opacity-70">MINS</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold font-mono ${intensityClasses.timer}`}>
                                            {formatTimeUnit(timeRemaining.seconds)}
                                        </div>
                                        <div className="text-xs text-white opacity-70">SECS</div>
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-white opacity-90">
                                    {getRitualMessage()}
                                </p>
                            </div>
                        ) : (
                            <div className="text-center mb-6">
                                <Star className="h-12 w-12 mx-auto text-yellow-400 animate-spin mb-3" />
                                <p className="text-lg font-bold text-green-300 animate-pulse">
                                    🔥 RITUAL COMPLETE! 🔥
                                </p>
                                <p className="text-sm text-white opacity-80 mt-2">
                                    This exclusive content is now available
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            {price && (
                                <div className="flex items-center space-x-2">
                                    <Lock className="h-4 w-4 text-yellow-400" />
                                    <span className="text-white font-bold">${price}</span>
                                    <span className="text-xs text-white opacity-70">Premium Content</span>
                                </div>
                            )}

                            {!isSubscriber && (
                                <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
                                    Subscribe to Access
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Feed and Profile variants
    return (
        <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${intensityClasses.container} ${intensityClasses.glow} 
        ${isHovered ? 'scale-105 shadow-2xl' : ''} 
        ${variant === 'feed' ? 'max-w-md mx-auto' : 'w-full'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
            </div>

            {/* Preview Image */}
            {previewImageUrl && showPreview && (
                <div className="relative h-32 bg-black">
                    <img src={previewImageUrl} alt="Ritual preview" className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
            )}

            {/* Content */}
            <div className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <Flame className={`h-4 w-4 ${intensityClasses.flame}`} />
                            <span className="text-xs font-medium text-white opacity-80 uppercase tracking-wide">
                                Ritual {timeRemaining.isExpired ? 'Complete' : 'Countdown'}
                            </span>
                        </div>
                        <h3 className="font-bold text-white text-lg leading-tight mb-1">{title}</h3>
                        {creatorName && (
                            <p className="text-sm text-white opacity-70">by {creatorName}</p>
                        )}
                    </div>

                    {intensity >= 2 && (
                        <div className="flex items-center space-x-1">
                            <Zap className={`h-4 w-4 ${intensityClasses.flame} animate-pulse`} />
                            <span className="text-xs font-bold text-white">URGENT</span>
                        </div>
                    )}
                </div>

                {description && (
                    <p className="text-sm text-white opacity-90 mb-4 line-clamp-2">{description}</p>
                )}

                {!timeRemaining.isExpired ? (
                    <div className="mb-4">
                        <div className="flex items-center justify-center space-x-4 mb-2">
                            {timeRemaining.days > 0 && (
                                <div className="text-center">
                                    <div className={`text-xl font-bold font-mono ${intensityClasses.timer}`}>
                                        {formatTimeUnit(timeRemaining.days)}
                                    </div>
                                    <div className="text-xs text-white opacity-60">DAYS</div>
                                </div>
                            )}
                            <div className="text-center">
                                <div className={`text-xl font-bold font-mono ${intensityClasses.timer}`}>
                                    {formatTimeUnit(timeRemaining.hours)}
                                </div>
                                <div className="text-xs text-white opacity-60">HRS</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-bold font-mono ${intensityClasses.timer}`}>
                                    {formatTimeUnit(timeRemaining.minutes)}
                                </div>
                                <div className="text-xs text-white opacity-60">MIN</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-xl font-bold font-mono ${intensityClasses.timer}`}>
                                    {formatTimeUnit(timeRemaining.seconds)}
                                </div>
                                <div className="text-xs text-white opacity-60">SEC</div>
                            </div>
                        </div>

                        <p className="text-center text-xs font-medium text-white opacity-90">
                            {getRitualMessage()}
                        </p>
                    </div>
                ) : (
                    <div className="text-center mb-4">
                        <Star className="h-8 w-8 mx-auto text-yellow-400 animate-pulse mb-2" />
                        <p className="font-bold text-green-300 text-sm animate-pulse">
                            🔥 RITUAL COMPLETE! 🔥
                        </p>
                    </div>
                )}

                {/* Stats and Actions */}
                <div className="flex items-center justify-between text-xs text-white opacity-70">
                    <div className="flex items-center space-x-3">
                        {variant === 'feed' && (
                            <>
                                <span className="flex items-center space-x-1">
                                    <Eye className="h-3 w-3" />
                                    <span>247</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                    <Heart className="h-3 w-3" />
                                    <span>89</span>
                                </span>
                            </>
                        )}
                        <span className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>1.2k waiting</span>
                        </span>
                    </div>

                    {price && (
                        <div className="flex items-center space-x-1 text-yellow-400">
                            <Crown className="h-3 w-3" />
                            <span className="font-bold">${price}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {!timeRemaining.isExpired && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30">
                    <div
                        className={`h-full bg-gradient-to-r ${config.colors.accent} transition-all duration-1000`}
                        style={{
                            width: `${Math.max(5, Math.min(95, 100 - (
                                (timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes) / 1440 * 100
                            )))}%`
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default RitualCountdown;