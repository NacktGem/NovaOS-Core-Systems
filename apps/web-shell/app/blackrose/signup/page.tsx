"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SignupData {
    email: string;
    password: string;
    displayName: string;
    role: "creator" | "user";
    studios: string[];
    theme: "light" | "dark";
    tosAgreed: boolean;
    verificationCode: string;
}

const STUDIOS = [
    { id: "scarlet", name: "Scarlet Studio", description: "Elegant, sensual, NSFW content" },
    { id: "lightbox", name: "Lightbox Studio", description: "Visual storytelling, cinematic photo/video" },
    { id: "ink_steel", name: "Ink & Steel", description: "Tattoos, piercings, studio culture" },
    { id: "expression", name: "Expression Studio", description: "Fashion, cosplay, kink-lite aesthetics" },
    { id: "cipher_core", name: "Cipher Core", description: "Coders, hackers, devlog projects" }
];

export default function BlackRoseSignup() {
    const [step, setStep] = useState(1);
    const [signupData, setSignupData] = useState<SignupData>({
        email: "",
        password: "",
        displayName: "",
        role: "user",
        studios: [],
        theme: "dark",
        tosAgreed: false,
        verificationCode: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);
    const router = useRouter();

    const updateData = (field: keyof SignupData, value: any) => {
        setSignupData(prev => ({ ...prev, [field]: value }));
    };

    const toggleStudio = (studioId: string) => {
        setSignupData(prev => ({
            ...prev,
            studios: prev.studios.includes(studioId)
                ? prev.studios.filter(id => id !== studioId)
                : [...prev.studios, studioId]
        }));
    };

    const sendVerificationCode = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: signupData.email }),
            });

            if (response.ok) {
                setVerificationSent(true);
            } else {
                setError('Failed to send verification code');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const completeSignup = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupData),
            });

            if (response.ok) {
                router.push('/blackrose/home');
            } else {
                const data = await response.json();
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && (!signupData.email || !signupData.password || !signupData.displayName)) {
            setError('Please fill in all fields');
            return;
        }
        if (step === 3 && signupData.studios.length === 0) {
            setError('Please select at least one studio');
            return;
        }
        if (step === 5 && !signupData.tosAgreed) {
            setError('You must agree to the Terms of Service');
            return;
        }
        setError(null);
        setStep(step + 1);
    };

    return (
        <div className="min-h-screen bg-blackRose-trueBlack flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-blackRose-fg mb-2">🌹 Black Rose Collective</h1>
                    <p className="text-blackRose-roseMauve/60">Join the House of Roses</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className={`h-2 w-8 rounded ${i <= step ? 'bg-blackRose-roseMauve' : 'bg-blackRose-bloodBrown/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-blackRose-bloodBrown bg-blackRose-midnightNavy/80 p-8">
                    {/* Step 1: Basic Account Info */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Create Account</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-blackRose-roseMauve mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={signupData.email}
                                        onChange={(e) => updateData('email', e.target.value)}
                                        className="w-full rounded-xl border border-blackRose-bloodBrown bg-blackRose-trueBlack/60 px-4 py-3 text-blackRose-fg focus:border-blackRose-roseMauve focus:outline-none"
                                        placeholder="your@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blackRose-roseMauve mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={signupData.password}
                                        onChange={(e) => updateData('password', e.target.value)}
                                        className="w-full rounded-xl border border-blackRose-bloodBrown bg-blackRose-trueBlack/60 px-4 py-3 text-blackRose-fg focus:border-blackRose-roseMauve focus:outline-none"
                                        placeholder="Create a strong password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blackRose-roseMauve mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={signupData.displayName}
                                        onChange={(e) => updateData('displayName', e.target.value)}
                                        className="w-full rounded-xl border border-blackRose-bloodBrown bg-blackRose-trueBlack/60 px-4 py-3 text-blackRose-fg focus:border-blackRose-roseMauve focus:outline-none"
                                        placeholder="How others will see you"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Role Choice */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Choose Your Role</h2>
                            <div className="grid gap-4">
                                {[
                                    { id: 'creator', title: 'Creator', description: 'Share content, earn revenue, build your following', icon: '🎨' },
                                    { id: 'user', title: 'User', description: 'Discover content, support creators, join communities', icon: '👤' }
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => updateData('role', role.id)}
                                        className={`p-6 rounded-xl border text-left transition-colors ${signupData.role === role.id
                                                ? 'border-blackRose-roseMauve bg-blackRose-roseMauve/10'
                                                : 'border-blackRose-bloodBrown bg-blackRose-trueBlack/30 hover:border-blackRose-roseMauve/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{role.icon}</span>
                                            <div>
                                                <h3 className="text-lg font-semibold text-blackRose-fg">{role.title}</h3>
                                                <p className="text-sm text-blackRose-roseMauve/60">{role.description}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Studio Selection */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Studio Interests</h2>
                            <p className="text-blackRose-roseMauve/60">Choose 1-5 studios that interest you:</p>
                            <div className="grid gap-3">
                                {STUDIOS.map((studio) => (
                                    <button
                                        key={studio.id}
                                        onClick={() => toggleStudio(studio.id)}
                                        disabled={!signupData.studios.includes(studio.id) && signupData.studios.length >= 5}
                                        className={`p-4 rounded-xl border text-left transition-colors disabled:opacity-50 ${signupData.studios.includes(studio.id)
                                                ? 'border-blackRose-roseMauve bg-blackRose-roseMauve/10'
                                                : 'border-blackRose-bloodBrown bg-blackRose-trueBlack/30 hover:border-blackRose-roseMauve/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-blackRose-fg">{studio.name}</h3>
                                                <p className="text-sm text-blackRose-roseMauve/60">{studio.description}</p>
                                            </div>
                                            {signupData.studios.includes(studio.id) && (
                                                <span className="text-blackRose-roseMauve">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-blackRose-roseMauve/40">
                                Selected: {signupData.studios.length}/5 studios
                            </p>
                        </div>
                    )}

                    {/* Step 4: Customization */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Customization</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-blackRose-roseMauve mb-4">UI Theme</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'dark', name: 'Dark Theme', preview: 'bg-blackRose-trueBlack' },
                                            { id: 'light', name: 'Light Theme', preview: 'bg-white' }
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => updateData('theme', theme.id)}
                                                className={`p-4 rounded-xl border transition-colors ${signupData.theme === theme.id
                                                        ? 'border-blackRose-roseMauve'
                                                        : 'border-blackRose-bloodBrown hover:border-blackRose-roseMauve/50'
                                                    }`}
                                            >
                                                <div className={`h-16 rounded-lg mb-2 ${theme.preview}`}></div>
                                                <p className="text-sm text-blackRose-fg">{theme.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-blackRose-bloodBrown/20 border border-blackRose-bloodBrown">
                                    <p className="text-sm text-blackRose-roseMauve/80">
                                        📷 <strong>ID Upload:</strong> Optional now, required for NSFW content later
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Terms & Verification */}
                    {step === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Consent + TOS + Verification</h2>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-blackRose-bloodBrown/20 border border-blackRose-bloodBrown">
                                    <h3 className="font-semibold text-blackRose-fg mb-2">Terms of Service</h3>
                                    <div className="max-h-32 overflow-y-auto text-sm text-blackRose-roseMauve/80 space-y-2">
                                        <p>By joining Black Rose Collective, you agree to:</p>
                                        <p>• Respect all creators and community members</p>
                                        <p>• Follow House of Roses studio guidelines</p>
                                        <p>• Verify age for NSFW content (18+ required)</p>
                                        <p>• Accept 12% platform fee on creator earnings</p>
                                        <p>• Comply with content policies and local laws</p>
                                    </div>
                                </div>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={signupData.tosAgreed}
                                        onChange={(e) => updateData('tosAgreed', e.target.checked)}
                                        className="rounded border-blackRose-bloodBrown bg-blackRose-trueBlack/60 text-blackRose-roseMauve focus:ring-blackRose-roseMauve"
                                    />
                                    <span className="text-sm text-blackRose-roseMauve">
                                        I agree to the Terms of Service and Privacy Policy
                                    </span>
                                </label>
                                {!verificationSent ? (
                                    <button
                                        onClick={sendVerificationCode}
                                        disabled={!signupData.tosAgreed || loading}
                                        className="w-full py-3 px-6 rounded-xl border border-blackRose-roseMauve bg-blackRose-roseMauve/10 text-blackRose-roseMauve hover:bg-blackRose-roseMauve/20 disabled:opacity-50"
                                    >
                                        {loading ? 'Sending...' : 'Send Verification Code'}
                                    </button>
                                ) : (
                                    <div>
                                        <p className="text-sm text-green-400 mb-3">✓ Verification code sent to {signupData.email}</p>
                                        <input
                                            type="text"
                                            value={signupData.verificationCode}
                                            onChange={(e) => updateData('verificationCode', e.target.value)}
                                            placeholder="Enter verification code"
                                            className="w-full rounded-xl border border-blackRose-bloodBrown bg-blackRose-trueBlack/60 px-4 py-3 text-blackRose-fg focus:border-blackRose-roseMauve focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Complete */}
                    {step === 6 && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl mb-4">🌹</div>
                            <h2 className="text-2xl font-semibold text-blackRose-fg">Welcome to Black Rose Collective!</h2>
                            <p className="text-blackRose-roseMauve/80">Your account is ready. Redirecting to your personalized homepage...</p>
                            <button
                                onClick={completeSignup}
                                disabled={loading || !signupData.verificationCode}
                                className="px-8 py-3 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-semibold hover:bg-blackRose-roseMauve/90 disabled:opacity-50"
                            >
                                {loading ? 'Creating Account...' : 'Enter Black Rose Collective'}
                            </button>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 6 && step !== 5 && (
                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-2 rounded-xl border border-blackRose-bloodBrown text-blackRose-roseMauve hover:border-blackRose-roseMauve/50"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={nextStep}
                                className="px-6 py-2 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-medium hover:bg-blackRose-roseMauve/90 ml-auto"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {step === 5 && verificationSent && signupData.verificationCode && (
                        <button
                            onClick={() => setStep(6)}
                            className="w-full mt-6 px-6 py-3 rounded-xl bg-blackRose-roseMauve text-blackRose-trueBlack font-medium hover:bg-blackRose-roseMauve/90"
                        >
                            Verify & Continue
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
