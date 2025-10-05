"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlackRoseLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Try the test login server first
            const testResponse = await fetch("http://localhost:8080/test-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (testResponse.ok) {
                const data = await testResponse.json();

                // Store user data in localStorage for the session
                localStorage.setItem("user", JSON.stringify(data));

                // Redirect based on role
                if (data.role === "GODMODE") {
                    router.push("/blackrose/dashboard");
                } else if (data.role === "SUPER_ADMIN") {
                    router.push("/admin");
                } else {
                    router.push("/blackrose/dashboard");
                }
            } else {
                // Fallback to Core API
                const apiResponse = await fetch("http://localhost:9760/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                    credentials: "include",
                });

                if (apiResponse.ok) {
                    const data = await apiResponse.json();
                    localStorage.setItem("user", JSON.stringify(data));
                    router.push("/blackrose/dashboard");
                } else {
                    setError("Invalid credentials. Please try again.");
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fillGodmodeCredentials = () => {
        setEmail("nacktgem@gmail.com");
        setPassword("godmode2024!");
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                {/* Back to landing */}
                <div className="mb-8">
                    <a
                        href="/blackrose"
                        className="text-[#d4af37]/70 hover:text-[#d4af37] transition-colors flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Black Rose</span>
                    </a>
                </div>

                {/* Login Form */}
                <div className="bg-[#1a1a1a]/50 backdrop-blur-xl rounded-2xl p-8 border border-[#d4af37]/20">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div
                                className="w-full h-full rounded-full bg-gradient-to-br from-[#8B4513]/30 to-[#654321]/50 cursor-pointer hover:from-[#A0522D]/40 hover:to-[#8B4513]/60 transition-all duration-300 flex items-center justify-center"
                                onClick={fillGodmodeCredentials}
                                title="Click for demo credentials"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                                    <path
                                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                        fill="#d4af37"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-3xl font-light tracking-wider text-[#d4af37] mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-[#d4af37]/70 text-sm">
                            Sign in to your Black Rose account
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-[#d4af37]/90 text-sm font-medium mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0a0a0a]/50 border border-[#d4af37]/30 rounded-lg text-white placeholder-[#d4af37]/50 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[#d4af37]/90 text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-[#0a0a0a]/50 border border-[#d4af37]/30 rounded-lg text-white placeholder-[#d4af37]/50 focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 focus:outline-none transition-all"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-[#d4af37]/70">
                                <input type="checkbox" className="mr-2 rounded border-[#d4af37]/30" />
                                Remember me
                            </label>
                            <a href="/auth/forgot-password" className="text-[#d4af37] hover:text-[#d4af37]/80 transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300 ${loading
                                ? "bg-[#d4af37]/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:from-[#A0522D] hover:to-[#8B4513] hover:scale-[1.02] shadow-lg hover:shadow-[#d4af37]/25"
                                }`}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <div className="mt-8 text-center">
                        <p className="text-[#d4af37]/70 text-sm">
                            Don&apos;t have an account?{" "}
                            <a
                                href="/blackrose/signup"
                                className="text-[#d4af37] hover:text-[#d4af37]/80 font-medium transition-colors"
                            >
                                Join Black Rose
                            </a>
                        </p>
                    </div>

                    {/* Demo Hint */}
                    <div className="mt-6 text-center">
                        <p className="text-[#d4af37]/50 text-xs">
                            Click the rose for demo credentials
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
