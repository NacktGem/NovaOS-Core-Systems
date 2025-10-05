"use client";

import { useState } from "react";
import Link from "next/link";

interface Studio {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    memberCount: number;
    recentPosts: number;
    isNSFW: boolean;
}

interface StudioPost {
    id: string;
    studioId: string;
    creatorId: string;
    creatorName: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    isLocked: boolean;
    nsfwLevel: 0 | 1 | 2 | 3; // 0 = safe, 1 = suggestive, 2 = nudity, 3 = explicit
}

const STUDIOS: Studio[] = [
    {
        id: "scarlet",
        name: "Scarlet Desires",
        description: "Sensual artistry and intimate photography",
        icon: "💋",
        color: "text-red-400 border-red-400",
        memberCount: 1247,
        recentPosts: 23,
        isNSFW: true
    },
    {
        id: "lightbox",
        name: "Lightbox",
        description: "Professional photography and artistic nude studies",
        icon: "📸",
        color: "text-blue-400 border-blue-400",
        memberCount: 892,
        recentPosts: 18,
        isNSFW: true
    },
    {
        id: "ink_steel",
        name: "Ink & Steel",
        description: "Body art, tattoos, and alternative expression",
        icon: "⚡",
        color: "text-purple-400 border-purple-400",
        memberCount: 643,
        recentPosts: 15,
        isNSFW: false
    },
    {
        id: "expression",
        name: "Expression",
        description: "Cosplay, creativity, and character exploration",
        icon: "🎭",
        color: "text-green-400 border-green-400",
        memberCount: 1089,
        recentPosts: 31,
        isNSFW: false
    },
    {
        id: "cipher_core",
        name: "Cipher Core",
        description: "Tech, coding, and digital artistry",
        icon: "💻",
        color: "text-cyan-400 border-cyan-400",
        memberCount: 456,
        recentPosts: 12,
        isNSFW: false
    }
];

export default function HouseOfRoses() {
    const [user] = useState({
        id: "user_001",
        verified: false,
        role: "user" as "user" | "creator",
        studios: ["scarlet", "expression"]
    });
    const [selectedStudio, setSelectedStudio] = useState<string | null>(null);
    const [studioFeed, setStudioFeed] = useState<StudioPost[]>([]);
    const [showNSFWWarning, setShowNSFWWarning] = useState(false);

    const handleStudioClick = (studio: Studio) => {
        if (studio.isNSFW && !user.verified) {
            setShowNSFWWarning(true);
            return;
        }
        setSelectedStudio(studio.id);
        loadStudioFeed(studio.id);
    };

    const loadStudioFeed = (studioId: string) => {
        // Mock feed data - replace with actual API call
        const mockPosts: StudioPost[] = [
            {
                id: "post_001",
                studioId,
                creatorId: "creator_001",
                creatorName: "Velora",
                content: "Just finished a new photoshoot! Behind-the-scenes content available in my vault 📸✨",
                timestamp: "2h ago",
                likes: 156,
                comments: 23,
                isLocked: false,
                nsfwLevel: 0
            },
            {
                id: "post_002",
                studioId,
                creatorId: "creator_002",
                creatorName: "Nova Cosplay",
                content: "Working on a new character design. What do you think? 💭",
                timestamp: "4h ago",
                likes: 89,
                comments: 12,
                isLocked: true,
                nsfwLevel: 1
            },
            {
                id: "post_003",
                studioId,
                creatorId: "creator_003",
                creatorName: "Echo Dev",
                content: "Live coding session tonight at 8PM! Building something special 🖥️",
                timestamp: "6h ago",
                likes: 67,
                comments: 8,
                isLocked: false,
                nsfwLevel: 0
            }
        ];
        setStudioFeed(mockPosts);
    };

    const getPostVisibility = (post: StudioPost) => {
        if (!user.verified && post.nsfwLevel > 0) {
            return { hidden: true, reason: "Age verification required" };
        }
        if (post.isLocked) {
            return { hidden: true, reason: "Premium content - unlock in vault" };
        }
        return { hidden: false, reason: null };
    };

    if (showNSFWWarning) {
        return (
            <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg flex items-center justify-center">
                <div className="max-w-md mx-4 p-8 rounded-2xl border border-red-400 bg-blackRose-midnightNavy/80">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🔞</div>
                        <h2 className="text-2xl font-bold mb-4">Age Verification Required</h2>
                        <p className="text-blackRose-roseMauve/60 mb-6">
                            This studio contains adult content. Please verify your age to access.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowNSFWWarning(false)}
                                className="flex-1 px-4 py-2 rounded-xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/60"
                            >
                                Cancel
                            </button>
                            <Link
                                href="/blackrose/consent-upload"
                                className="flex-1 px-4 py-2 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-medium hover:bg-blackRose-roseMauve/90 text-center"
                            >
                                Verify Age
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
            {/* Navigation */}
            <nav className="border-b border-blackRose-bloodBrown bg-blackRose-midnightNavy/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/blackrose/home" className="text-xl font-bold text-blackRose-roseMauve">
                            🌹 House of Roses
                        </Link>
                        <div className="flex gap-4 text-sm">
                            <Link href="/blackrose/home" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Home</Link>
                            <Link href="/blackrose/explore" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Explore</Link>
                            <Link href="/blackrose/vault" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Vault</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!selectedStudio ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold text-blackRose-fg mb-4">
                                🌹 House of Roses
                            </h1>
                            <p className="text-lg text-blackRose-roseMauve/60 max-w-2xl mx-auto">
                                Explore our five specialized studios, each celebrating different forms of creativity and expression.
                            </p>
                        </div>

                        {/* Studios Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {STUDIOS.map((studio) => {
                                const isMember = user.studios.includes(studio.id);
                                const needsVerification = studio.isNSFW && !user.verified;

                                return (
                                    <button
                                        key={studio.id}
                                        onClick={() => handleStudioClick(studio)}
                                        disabled={needsVerification}
                                        className={`group p-6 rounded-2xl border transition-all text-left ${needsVerification
                                                ? 'border-blackRose-bloodBrown bg-blackRose-midnightNavy/20 opacity-60 cursor-not-allowed'
                                                : `${studio.color} bg-blackRose-midnightNavy/40 hover:bg-blackRose-midnightNavy/60`
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-3xl">{studio.icon}</div>
                                            <div className="flex flex-col items-end gap-2">
                                                {isMember && (
                                                    <span className="px-2 py-1 rounded text-xs bg-blackRose-roseMauve/20 text-blackRose-roseMauve">
                                                        Member
                                                    </span>
                                                )}
                                                {studio.isNSFW && (
                                                    <span className="px-2 py-1 rounded text-xs bg-red-900/40 text-red-400 border border-red-700">
                                                        18+
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-bold text-blackRose-fg mb-2">{studio.name}</h3>
                                        <p className="text-blackRose-roseMauve/60 mb-4 text-sm">{studio.description}</p>

                                        <div className="flex justify-between items-center text-xs text-blackRose-roseMauve/40">
                                            <span>{studio.memberCount.toLocaleString()} members</span>
                                            <span>{studio.recentPosts} posts today</span>
                                        </div>

                                        {needsVerification && (
                                            <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-700">
                                                <p className="text-xs text-red-400">
                                                    🔞 Age verification required to access this studio
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Membership Info */}
                        <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                            <h2 className="text-xl font-semibold text-blackRose-fg mb-4">Your Studio Memberships</h2>
                            <div className="flex flex-wrap gap-3">
                                {user.studios.map((studioId) => {
                                    const studio = STUDIOS.find(s => s.id === studioId);
                                    if (!studio) return null;

                                    return (
                                        <span key={studioId} className={`px-3 py-2 rounded-lg border ${studio.color} bg-blackRose-midnightNavy/60`}>
                                            {studio.icon} {studio.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Studio Feed View */}
                        <div className="mb-6">
                            <button
                                onClick={() => setSelectedStudio(null)}
                                className="mb-4 text-blackRose-roseMauve hover:text-blackRose-fg"
                            >
                                ← Back to Studios
                            </button>

                            {(() => {
                                const studio = STUDIOS.find(s => s.id === selectedStudio);
                                return studio ? (
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{studio.icon}</div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-blackRose-fg">{studio.name}</h1>
                                            <p className="text-blackRose-roseMauve/60">{studio.description}</p>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {/* Studio Feed */}
                        <div className="space-y-6">
                            {studioFeed.map((post) => {
                                const visibility = getPostVisibility(post);

                                return (
                                    <div
                                        key={post.id}
                                        className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blackRose-roseMauve/20 flex items-center justify-center">
                                                    {post.creatorName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-blackRose-fg">{post.creatorName}</p>
                                                    <p className="text-sm text-blackRose-roseMauve/40">{post.timestamp}</p>
                                                </div>
                                            </div>
                                            {post.nsfwLevel > 0 && (
                                                <span className="px-2 py-1 rounded text-xs bg-orange-900/40 text-orange-400">
                                                    NSFW
                                                </span>
                                            )}
                                        </div>

                                        {visibility.hidden ? (
                                            <div className="p-6 rounded-xl bg-blackRose-trueBlack/40 border border-blackRose-bloodBrown text-center">
                                                <div className="text-2xl mb-2">🔒</div>
                                                <p className="text-blackRose-roseMauve/60">{visibility.reason}</p>
                                                {post.isLocked && (
                                                    <Link
                                                        href="/blackrose/vault"
                                                        className="mt-3 inline-block px-4 py-2 rounded-lg border border-blackRose-roseMauve bg-blackRose-roseMauve/10 text-blackRose-roseMauve hover:bg-blackRose-roseMauve/20 text-sm"
                                                    >
                                                        Unlock in Vault
                                                    </Link>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-blackRose-fg mb-4">{post.content}</p>
                                                <div className="flex items-center gap-6 text-sm text-blackRose-roseMauve/60">
                                                    <span>❤️ {post.likes}</span>
                                                    <span>💬 {post.comments}</span>
                                                    <span>🔗 Share</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}