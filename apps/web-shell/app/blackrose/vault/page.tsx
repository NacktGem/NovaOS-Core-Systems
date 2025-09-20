"use client";

import { useState } from "react";
import Link from "next/link";

interface VaultItem {
    id: string;
    creatorId: string;
    creatorName: string;
    studio: string;
    title: string;
    description: string;
    contentType: "photo_set" | "video" | "audio" | "text" | "bundle";
    price: number;
    nsfwLevel: 0 | 1 | 2 | 3; // 0 = safe, 1 = suggestive, 2 = nudity, 3 = explicit
    unlocked: boolean;
    thumbnail: string;
    itemCount?: number; // For bundles/sets
    duration?: string; // For videos/audio
    createdAt: string;
    tags: string[];
}

interface UserVault {
    balance: number;
    unlockedItems: VaultItem[];
    lockedItems: VaultItem[];
    totalSpent: number;
    verified: boolean;
}

const MOCK_VAULT_DATA: UserVault = {
    balance: 125.50,
    totalSpent: 347.80,
    verified: false,
    unlockedItems: [
        {
            id: "vault_001",
            creatorId: "creator_velora",
            creatorName: "Velora",
            studio: "scarlet",
            title: "Behind the Scenes Collection",
            description: "Exclusive backstage moments from my latest photoshoot",
            contentType: "photo_set",
            price: 15.99,
            nsfwLevel: 1,
            unlocked: true,
            thumbnail: "/api/placeholder/thumb/velora_bts",
            itemCount: 12,
            createdAt: "2025-01-02",
            tags: ["backstage", "photography", "exclusive"]
        },
        {
            id: "vault_002",
            creatorId: "creator_echo",
            creatorName: "Echo Dev",
            studio: "cipher_core",
            title: "Coding Tutorial Bundle",
            description: "Complete React & TypeScript masterclass",
            contentType: "bundle",
            price: 29.99,
            nsfwLevel: 0,
            unlocked: true,
            thumbnail: "/api/placeholder/thumb/echo_tutorial",
            itemCount: 8,
            createdAt: "2024-12-15",
            tags: ["tutorial", "coding", "react", "typescript"]
        }
    ],
    lockedItems: [
        {
            id: "vault_003",
            creatorId: "creator_velora",
            creatorName: "Velora",
            studio: "scarlet",
            title: "Intimate Moments",
            description: "Personal and sensual photography collection",
            contentType: "photo_set",
            price: 34.99,
            nsfwLevel: 3,
            unlocked: false,
            thumbnail: "/api/placeholder/thumb/velora_intimate",
            itemCount: 24,
            createdAt: "2025-01-10",
            tags: ["intimate", "artistic", "exclusive", "nsfw"]
        },
        {
            id: "vault_004",
            creatorId: "creator_nova",
            creatorName: "Nova Cosplay",
            studio: "expression",
            title: "Character Study Video",
            description: "In-depth costume creation and character development",
            contentType: "video",
            price: 19.99,
            nsfwLevel: 0,
            unlocked: false,
            thumbnail: "/api/placeholder/thumb/nova_character",
            duration: "45:32",
            createdAt: "2025-01-08",
            tags: ["cosplay", "tutorial", "character", "costume"]
        }
    ]
};

export default function BlackRoseVault() {
    const [vault, setVault] = useState<UserVault>(MOCK_VAULT_DATA);
    const [activeTab, setActiveTab] = useState<"unlocked" | "locked">("unlocked");
    const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
    const [showNSFWWarning, setShowNSFWWarning] = useState(false);

    const handleItemClick = (item: VaultItem) => {
        if (item.nsfwLevel > 0 && !vault.verified) {
            setShowNSFWWarning(true);
            return;
        }
        setSelectedItem(item);
    };

    const handleUnlock = async (item: VaultItem) => {
        if (vault.balance < item.price) {
            alert("Insufficient balance. Please add funds to your wallet.");
            return;
        }

        // Mock unlock - replace with actual API call
        const updatedVault = { ...vault };
        updatedVault.balance -= item.price;
        updatedVault.totalSpent += item.price;
        updatedVault.lockedItems = updatedVault.lockedItems.filter(i => i.id !== item.id);
        updatedVault.unlockedItems.push({ ...item, unlocked: true });

        setVault(updatedVault);
        setSelectedItem(null);
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case "photo_set": return "📸";
            case "video": return "🎥";
            case "audio": return "🎵";
            case "text": return "📝";
            case "bundle": return "📦";
            default: return "📄";
        }
    };

    const getNSFWLabel = (level: number) => {
        switch (level) {
            case 0: return null;
            case 1: return { label: "Suggestive", color: "text-yellow-400 bg-yellow-900/40" };
            case 2: return { label: "Nudity", color: "text-orange-400 bg-orange-900/40" };
            case 3: return { label: "Explicit", color: "text-red-400 bg-red-900/40" };
            default: return null;
        }
    };

    if (showNSFWWarning) {
        return (
            <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg flex items-center justify-center">
                <div className="max-w-md mx-4 p-8 rounded-2xl border border-red-400 bg-blackRose-midnightNavy/80">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🔞</div>
                        <h2 className="text-2xl font-bold mb-4">Age Verification Required</h2>
                        <p className="text-blackRose-roseMauve/60 mb-6">
                            This content contains adult material. Please verify your age to access.
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

    if (selectedItem) {
        const nsfwLabel = getNSFWLabel(selectedItem.nsfwLevel);

        return (
            <div className="min-h-screen bg-blackRose-trueBlack text-blackRose-fg">
                <nav className="border-b border-blackRose-bloodBrown bg-blackRose-midnightNavy/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link href="/blackrose/home" className="text-xl font-bold text-blackRose-roseMauve">
                                🔐 Vault
                            </Link>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-blackRose-roseMauve hover:text-blackRose-fg"
                            >
                                ← Back to Vault
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-8">
                        <div className="flex items-start gap-6 mb-6">
                            <div className="text-6xl">{getContentIcon(selectedItem.contentType)}</div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-blackRose-fg">{selectedItem.title}</h1>
                                    {nsfwLabel && (
                                        <span className={`px-2 py-1 rounded text-xs ${nsfwLabel.color}`}>
                                            {nsfwLabel.label}
                                        </span>
                                    )}
                                </div>
                                <p className="text-blackRose-roseMauve/60 mb-4">{selectedItem.description}</p>
                                <div className="flex items-center gap-4 text-sm text-blackRose-roseMauve/40">
                                    <span>By @{selectedItem.creatorName}</span>
                                    <span>•</span>
                                    <span>{selectedItem.studio}</span>
                                    <span>•</span>
                                    <span>${selectedItem.price}</span>
                                    {selectedItem.itemCount && (
                                        <>
                                            <span>•</span>
                                            <span>{selectedItem.itemCount} items</span>
                                        </>
                                    )}
                                    {selectedItem.duration && (
                                        <>
                                            <span>•</span>
                                            <span>{selectedItem.duration}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {selectedItem.unlocked ? (
                            <div className="p-6 rounded-xl bg-green-900/20 border border-green-700">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-semibold text-green-400">Content Unlocked</p>
                                        <p className="text-sm text-blackRose-roseMauve/60">You have access to this content</p>
                                    </div>
                                </div>
                                <button className="px-6 py-3 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-medium hover:bg-blackRose-roseMauve/90">
                                    View Content
                                </button>
                            </div>
                        ) : (
                            <div className="p-6 rounded-xl bg-blackRose-trueBlack/40 border border-blackRose-bloodBrown">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="font-semibold text-blackRose-fg mb-1">Unlock this content</p>
                                        <p className="text-sm text-blackRose-roseMauve/60">
                                            Your balance: ${vault.balance.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blackRose-roseMauve">${selectedItem.price}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleUnlock(selectedItem)}
                                        disabled={vault.balance < selectedItem.price}
                                        className={`px-6 py-3 rounded-xl font-medium ${vault.balance >= selectedItem.price
                                                ? "bg-blackRose-roseMauve text-blackRose-trueBlack hover:bg-blackRose-roseMauve/90"
                                                : "bg-blackRose-bloodBrown/40 text-blackRose-roseMauve/40 cursor-not-allowed"
                                            }`}
                                    >
                                        {vault.balance >= selectedItem.price ? "Unlock Content" : "Insufficient Balance"}
                                    </button>
                                    <Link
                                        href="/blackrose/wallet/add-funds"
                                        className="px-4 py-3 rounded-xl border border-blackRose-roseMauve bg-blackRose-roseMauve/10 text-blackRose-roseMauve hover:bg-blackRose-roseMauve/20"
                                    >
                                        Add Funds
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div className="mt-6">
                            <p className="text-sm text-blackRose-roseMauve/60 mb-2">Tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedItem.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-full text-xs border border-blackRose-bloodBrown bg-blackRose-midnightNavy/60 text-blackRose-roseMauve/80"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
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
                            🔐 Vault
                        </Link>
                        <div className="flex gap-4 text-sm">
                            <Link href="/blackrose/home" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Home</Link>
                            <Link href="/blackrose/house" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">House</Link>
                            <Link href="/blackrose/wallet" className="text-blackRose-roseMauve/60 hover:text-blackRose-roseMauve">Wallet</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Wallet Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">💰</div>
                            <div>
                                <p className="text-sm text-blackRose-roseMauve/60">Current Balance</p>
                                <p className="text-2xl font-bold text-blackRose-fg">${vault.balance.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">🔓</div>
                            <div>
                                <p className="text-sm text-blackRose-roseMauve/60">Unlocked Items</p>
                                <p className="text-2xl font-bold text-blackRose-fg">{vault.unlockedItems.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 p-6">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">💸</div>
                            <div>
                                <p className="text-sm text-blackRose-roseMauve/60">Total Spent</p>
                                <p className="text-2xl font-bold text-blackRose-fg">${vault.totalSpent.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Age Verification Alert */}
                {!vault.verified && (
                    <div className="rounded-2xl border border-orange-700 bg-orange-900/20 p-6 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl">🔞</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-400 mb-1">Age Verification Required</h3>
                                <p className="text-blackRose-roseMauve/60 text-sm">
                                    Some content is restricted until you verify your age. Upload valid ID to access all content.
                                </p>
                            </div>
                            <Link
                                href="/blackrose/consent-upload"
                                className="px-4 py-2 rounded-xl border border-orange-400 bg-orange-900/40 text-orange-400 hover:bg-orange-900/60"
                            >
                                Verify Now
                            </Link>
                        </div>
                    </div>
                )}

                {/* Content Tabs */}
                <div className="flex gap-1 mb-6">
                    <button
                        onClick={() => setActiveTab("unlocked")}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === "unlocked"
                                ? "bg-blackRose-roseMauve text-blackRose-trueBlack"
                                : "border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/60"
                            }`}
                    >
                        Unlocked ({vault.unlockedItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("locked")}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${activeTab === "locked"
                                ? "bg-blackRose-roseMauve text-blackRose-trueBlack"
                                : "border border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 text-blackRose-roseMauve hover:bg-blackRose-midnightNavy/60"
                            }`}
                    >
                        Available ({vault.lockedItems.length})
                    </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(activeTab === "unlocked" ? vault.unlockedItems : vault.lockedItems).map((item) => {
                        const nsfwLabel = getNSFWLabel(item.nsfwLevel);
                        const isHidden = item.nsfwLevel > 0 && !vault.verified;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`group p-6 rounded-2xl border text-left transition-all ${isHidden
                                        ? "border-blackRose-bloodBrown bg-blackRose-midnightNavy/20 opacity-60"
                                        : "border-blackRose-bloodBrown bg-blackRose-midnightNavy/40 hover:border-blackRose-roseMauve/50 hover:bg-blackRose-midnightNavy/60"
                                    }`}
                                disabled={isHidden}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-3xl">{getContentIcon(item.contentType)}</div>
                                    <div className="flex flex-col items-end gap-2">
                                        {item.unlocked && (
                                            <span className="px-2 py-1 rounded text-xs bg-green-900/40 text-green-400">
                                                Unlocked
                                            </span>
                                        )}
                                        {nsfwLabel && (
                                            <span className={`px-2 py-1 rounded text-xs ${nsfwLabel.color}`}>
                                                {nsfwLabel.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isHidden ? (
                                    <div className="text-center py-4">
                                        <div className="text-2xl mb-2">🔞</div>
                                        <p className="text-sm text-blackRose-roseMauve/60">Age verification required</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-semibold text-blackRose-fg mb-2">{item.title}</h3>
                                        <p className="text-sm text-blackRose-roseMauve/60 mb-3 line-clamp-2">{item.description}</p>
                                        <p className="text-sm text-blackRose-roseMauve/40 mb-3">by @{item.creatorName}</p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-blackRose-roseMauve/40">
                                                {item.itemCount && <span>{item.itemCount} items</span>}
                                                {item.duration && <span>{item.duration}</span>}
                                            </div>
                                            <div className="text-blackRose-roseMauve font-bold">${item.price}</div>
                                        </div>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>

                {(activeTab === "unlocked" ? vault.unlockedItems : vault.lockedItems).length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">
                            {activeTab === "unlocked" ? "🔓" : "🔐"}
                        </div>
                        <p className="text-blackRose-roseMauve/60">
                            {activeTab === "unlocked"
                                ? "No unlocked content yet. Browse the House of Roses to discover creators!"
                                : "No content available for purchase right now."
                            }
                        </p>
                        <Link
                            href="/blackrose/house"
                            className="inline-block mt-4 px-6 py-3 rounded-xl border border-blackRose-roseMauve bg-blackRose-roseMauve/10 text-blackRose-roseMauve hover:bg-blackRose-roseMauve/20"
                        >
                            Explore House of Roses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}