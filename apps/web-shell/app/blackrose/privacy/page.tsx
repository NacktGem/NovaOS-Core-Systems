export default function BlackRosePrivacy() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Navigation */}
            <nav className="border-b border-[#d4af37]/20 py-6">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <a
                        href="/blackrose"
                        className="text-[#d4af37] hover:text-[#d4af37]/80 transition-colors flex items-center space-x-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Black Rose</span>
                    </a>

                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6">
                            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                <path
                                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                    fill="#d4af37"
                                />
                            </svg>
                        </div>
                        <span className="text-[#d4af37] font-light tracking-wider">Black Rose</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-light tracking-wider text-[#d4af37] mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-[#d4af37]/70 text-lg">
                        Last updated: September 28, 2025
                    </p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none">
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Our Commitment to Privacy</h2>
                            <p className="text-gray-300 leading-relaxed">
                                At Black Rose Collective, we understand that privacy is paramount in the adult content industry. This policy outlines how we collect, use, protect, and handle your personal information with the highest standards of security and discretion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Information We Collect</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <div>
                                    <h3 className="text-xl text-[#d4af37]/90 mb-2">Account Information</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Email address and encrypted passwords</li>
                                        <li>Age verification documents (securely stored)</li>
                                        <li>Payment information (processed by third-party providers)</li>
                                        <li>Profile information and creator bio</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xl text-[#d4af37]/90 mb-2">Usage Data</h3>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Content interaction analytics</li>
                                        <li>Platform navigation patterns</li>
                                        <li>Device and browser information</li>
                                        <li>IP addresses (for security purposes)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">How We Use Your Information</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <p>Your information is used exclusively for:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Account authentication and security</li>
                                    <li>Payment processing and revenue tracking</li>
                                    <li>Platform functionality and feature improvements</li>
                                    <li>Customer support and technical assistance</li>
                                    <li>Legal compliance and fraud prevention</li>
                                </ul>
                                <p className="font-medium text-[#d4af37]/90">
                                    We never use your data for advertising, marketing to third parties, or any purpose not directly related to platform operation.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Data Protection & Security</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <div className="bg-[#1a1a1a]/50 rounded-lg p-6 border border-[#d4af37]/20">
                                    <h3 className="text-xl text-[#d4af37]/90 mb-3">Our Security Measures</h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>End-to-end encryption</strong> for all data transmission</li>
                                        <li><strong>AES-256 encryption</strong> for data at rest</li>
                                        <li><strong>Multi-factor authentication</strong> available for all accounts</li>
                                        <li><strong>Regular security audits</strong> by third-party experts</li>
                                        <li><strong>GDPR and CCPA compliant</strong> data handling</li>
                                        <li><strong>Secure data centers</strong> with 24/7 monitoring</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Data Sharing & Third Parties</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <p className="text-[#d4af37]/90 font-medium mb-2">
                                    We do NOT share personal data with third parties, except:
                                </p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Payment processors</strong> (Stripe, PayPal) for transaction handling</li>
                                    <li><strong>Cloud storage providers</strong> (AWS, with full encryption)</li>
                                    <li><strong>Legal authorities</strong> when required by valid legal process</li>
                                    <li><strong>Age verification services</strong> (data is immediately purged after verification)</li>
                                </ul>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Your Rights & Control</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <p>You have complete control over your data:</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-[#1a1a1a]/30 rounded-lg p-4 border border-[#d4af37]/10">
                                        <h3 className="text-[#d4af37]/90 font-medium mb-2">Access & Export</h3>
                                        <p className="text-sm">Download all your data in portable format</p>
                                    </div>
                                    <div className="bg-[#1a1a1a]/30 rounded-lg p-4 border border-[#d4af37]/10">
                                        <h3 className="text-[#d4af37]/90 font-medium mb-2">Deletion</h3>
                                        <p className="text-sm">Permanently delete your account and data</p>
                                    </div>
                                    <div className="bg-[#1a1a1a]/30 rounded-lg p-4 border border-[#d4af37]/10">
                                        <h3 className="text-[#d4af37]/90 font-medium mb-2">Correction</h3>
                                        <p className="text-sm">Update or correct your information</p>
                                    </div>
                                    <div className="bg-[#1a1a1a]/30 rounded-lg p-4 border border-[#d4af37]/10">
                                        <h3 className="text-[#d4af37]/90 font-medium mb-2">Portability</h3>
                                        <p className="text-sm">Transfer your data to another service</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Cookies & Tracking</h2>
                            <div className="text-gray-300 leading-relaxed space-y-4">
                                <p>We use minimal, essential cookies only:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Session cookies</strong> for login authentication</li>
                                    <li><strong>Preference cookies</strong> for theme and language settings</li>
                                    <li><strong>Security cookies</strong> for fraud prevention</li>
                                </ul>
                                <p className="text-[#d4af37]/90 font-medium">
                                    No advertising cookies, no cross-site tracking, no behavioral profiling.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-light text-[#d4af37] mb-4">Contact & Data Requests</h2>
                            <div className="text-gray-300 leading-relaxed">
                                <p className="mb-4">
                                    For privacy concerns, data requests, or security reports:
                                </p>
                                <div className="bg-[#1a1a1a]/50 rounded-lg p-6 border border-[#d4af37]/20">
                                    <div className="space-y-2">
                                        <p><strong>Privacy Officer:</strong> privacy@blackrosecollective.studio</p>
                                        <p><strong>Security Team:</strong> security@blackrosecollective.studio</p>
                                        <p><strong>Data Requests:</strong> data@blackrosecollective.studio</p>
                                        <p><strong>Response Time:</strong> Within 48 hours for urgent matters</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-16">
                    <div className="bg-gradient-to-r from-[#8B4513]/10 to-[#A0522D]/10 rounded-2xl p-8 border border-[#d4af37]/20">
                        <h3 className="text-2xl font-light text-[#d4af37] mb-6 text-center">Privacy Certifications</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl mb-2">🛡️</div>
                                <div className="text-sm text-[#d4af37]/80">SOC 2 Certified</div>
                            </div>
                            <div>
                                <div className="text-2xl mb-2">🔒</div>
                                <div className="text-sm text-[#d4af37]/80">GDPR Compliant</div>
                            </div>
                            <div>
                                <div className="text-2xl mb-2">🏆</div>
                                <div className="text-sm text-[#d4af37]/80">CCPA Certified</div>
                            </div>
                            <div>
                                <div className="text-2xl mb-2">✅</div>
                                <div className="text-sm text-[#d4af37]/80">ISO 27001</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
