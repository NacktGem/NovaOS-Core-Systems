"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
    id: string;
    username: string;
    displayName: string;
    role: "creator" | "user";
    studios: string[];
    theme: "light" | "dark";
    verified: boolean;
}

interface CreatorSpotlight {
    id: string;
    username: string;
    displayName: string;
    studio: string;
    avatar: string;
    previewImage: string;
    followers: number;
}

const QUICK_ACCESS_TILES = [
    { id: "explore", name: "Explore", icon: "🌍", href: "/blackrose/explore", description: "Discover new creators" },
    { id: "vault", name: "Vault", icon: "🔐", href: "/blackrose/vault", description: "Your content library" },
    { id: "dashboard", name: "Dashboard", icon: "📊", href: "/blackrose/dashboard", description: "Analytics & earnings" },
    { id: "creator-studio", name: "Creator Studio", icon: "🎨", href: "/blackrose/creator", description: "Create & manage content" },
    { id: "house", name: "House of Roses", icon: "🌹", href: "/blackrose/house", description: "Studio communities" },
    { id: "feedback", name: "Feedback", icon: "💬", href: "/blackrose/feedback", description: "Share your thoughts" }
];

export default function BlackRoseHome() {
    const [user, setUser] = useState<User | null>(null);
    const [spotlightCreators, setSpotlightCreators] = useState<CreatorSpotlight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock user data - replace with actual auth
        setUser({
            id: "user_001",
            username: "demo_user",
            displayName: "Demo User",
            role: "user",
            studios: ["scarlet", "lightbox"],
            theme: "dark",
            verified: false
        });

        // Mock spotlight creators - replace with actual API call
        setSpotlightCreators([
            {
                id: "creator_001",
                username: "velora_scarlet",
                displayName: "Velora",
                studio: "scarlet",
                avatar: "/api/placeholder/avatar/velora",
                previewImage: "/api/placeholder/preview/velora",
                followers: 1250
            },
            {
                id: "creator_002",
                username: "nova_expression",
                displayName: "Nova Cosplay",
                studio: "expression",
                avatar: "/api/placeholder/avatar/nova",
                previewImage: "/api/placeholder/preview/nova",
                followers: 890
            },
            {
                id: "creator_003",
                username: "echo_cipher",
                displayName: "Echo Dev",
                studio: "cipher_core",
                avatar: "/api/placeholder/avatar/echo",
                previewImage: "/api/placeholder/preview/echo",
                followers: 567
            }
        ]);

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-blackRose-trueBlack flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🌹</div>
                    <p className="text-blackRose-roseMauve">Loading Black Rose Collective...</p>
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
                        <div className="flex items-center gap-8">
                            <Link href="/blackrose/home" className="text-xl font-bold text-blackRose-roseMauve">
                                🌹 Black Rose Collective
                            </Link>
                            <div className="hidden md:flex space-x-6 text-sm">
                                <Link href="/blackrose/home" className="text-blackRose-fg hover:text-blackRose-roseMauve">Home</Link>
                                <Link href="/blackrose/explore" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Explore</Link>
                                <Link href="/blackrose/vault" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Vault</Link>
                                <Link href="/blackrose/profile" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Profile</Link>
                                {user?.role === "creator" && (
                                    <>
                                        <Link href="/blackrose/creator" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Creator Studio</Link>
                                        <Link href="/blackrose/dashboard" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Dashboard</Link>
                                    </>
                                )}
                                <Link href="/blackrose/house" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">House of Roses</Link>
                                <Link href="/blackrose/inbox" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Petal Talk</Link>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-blackRose-roseMauve/60">@{user?.displayName}</span>
                            <div className="w-8 h-8 rounded-full bg-blackRose-roseMauve/20 flex items-center justify-center text-sm">
                                {user?.displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Banner */}
                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-8 mb-8 shadow-[0_45px_120px_rgba(0,0,0,0.55)]">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-blackRose-fg mb-2">
                                Welcome back, {user?.displayName}! 🌹
                            </h1>
                            <p className="text-blackRose-roseMauve/60">
                                {user?.role === "creator" ? "Ready to create something beautiful?" : "Discover amazing creators in the House of Roses"}
                            </p>
                            {!user?.verified && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-400">
                                    <span>⚠️</span>
                                    <span>Account not verified - NSFW content restricted.</span>
                                    <Link href="/blackrose/consent-upload" className="text-blackRose-roseMauve hover:underline">
                                        Verify Now
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="hidden lg:block">
                            <div className="text-6xl opacity-20">🌹</div>
                        </div>
                    </div>
                </div>

                {/* Creator Spotlight Carousel */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-blackRose-fg">Creator Spotlight</h2>
                        <Link href="/blackrose/explore" className="text-sm text-blackRose-roseMauve hover:underline">
                            View All →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {spotlightCreators.map((creator) => (
                            <Link
                                key={creator.id}
                                href={`/blackrose/profile/${creator.username}`}
                                className="group rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 overflow-hidden hover:border-blackRose-roseMauve/50 transition-colors"
                            >
                                <div className="aspect-video bg-blackRose-trueBlack/60 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-blackRose-trueBlack/80 to-transparent z-10" />
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <p className="font-semibold text-blackRose-fg">{creator.displayName}</p>
                                        <p className="text-sm text-blackRose-roseMauve/60">@{creator.username}</p>
                                        <p className="text-xs text-blackRose-roseMauve/40">{creator.followers} followers</p>
                                    </div>
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="px-2 py-1 rounded text-xs bg-blackRose-roseMauve/20 text-blackRose-roseMauve border border-blackRose-roseMauve">
                                            {creator.studio}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Access Tiles */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-blackRose-fg mb-6">Quick Access</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {QUICK_ACCESS_TILES.map((tile) => {
                            // Hide creator-specific tiles for regular users
                            if ((tile.id === "dashboard" || tile.id === "creator-studio") && user?.role !== "creator") {
                                return null;
                            }

                            return (
                                <Link
                                    key={tile.id}
                                    href={tile.href}
                                    className="group p-6 rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/60 transition-all text-center"
                                >
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{tile.icon}</div>
                                    <h3 className="font-semibold text-blackRose-fg text-sm mb-1">{tile.name}</h3>
                                    <p className="text-xs text-blackRose-roseMauve/60">{tile.description}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Feedback Prompt */}
                <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-blackRose-fg mb-1">Help Us Improve</h3>
                            <p className="text-sm text-blackRose-roseMauve/60">
                                Share your thoughts on the Black Rose Collective experience
                            </p>
                        </div>
                        <Link
                            href="/blackrose/feedback"
                            className="px-4 py-2 rounded-xl border border-blackRose-roseMauve bg-blackRose-roseMauve/10 text-blackRose-roseMauve hover:bg-blackRose-roseMauve/20 text-sm"
                        >
                            Give Feedback
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-blackRose-roseMauve/60">
                            © 2025 Black Rose Collective. Part of the NovaOS ecosystem.
                        </div>
                        <div className="flex gap-6 text-sm">
                            <Link href="/blackrose/terms" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">
                                Terms
                            </Link>
                            <Link href="/blackrose/privacy" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">
                                Privacy
                            </Link>
                            <Link href="/4le" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">
                                4LE Portal
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
