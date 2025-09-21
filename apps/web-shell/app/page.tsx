export default function WebShellHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a1a] to-[#1a1a2a] text-[#e2e8f0] flex items-center justify-center">
      <div className="text-center max-w-4xl px-8">
        <header className="mb-12">
          <div className="mb-6">
            <h1 className="text-6xl font-extrabold tracking-tight text-[#dc2626] drop-shadow-lg mb-4">
              NovaOS Web Shell
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#dc2626] to-transparent mx-auto mb-6"></div>
          </div>
          <p className="text-xl text-[#6faab1] font-medium max-w-2xl mx-auto leading-relaxed">
            Multi-platform access portal for the NovaOS ecosystem. Choose your destination to access specialized interfaces and agent networks.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <a
            href="/blackrose/dashboard"
            className="group relative rounded-3xl border border-[#dc2626]/30 bg-gradient-to-br from-[#1a0a1a]/90 to-[#0a0a0f]/60 backdrop-blur-xl p-8 hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#dc2626]/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#dc2626]/20 to-[#dc2626]/10 border border-[#dc2626]/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#e2e8f0] mb-4">
                Black Rose Collective
              </h3>
              <p className="text-[#94a3b8] font-medium leading-relaxed">
                Creator platform with advanced revenue analytics, content management, and monetization tools
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#dc2626] font-semibold">
                <span>Launch Platform</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>

          <a
            href="/admin"
            className="group relative rounded-3xl border border-[#6faab1]/30 bg-gradient-to-br from-[#1a1a2a]/90 to-[#0a0a0f]/60 backdrop-blur-xl p-8 hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6faab1]/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-[#6faab1]/20 to-[#6faab1]/10 border border-[#6faab1]/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#6faab1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#e2e8f0] mb-4">
                Admin Console
              </h3>
              <p className="text-[#94a3b8] font-medium leading-relaxed">
                Platform administration interface with system monitoring, user management, and configuration controls
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6faab1] font-semibold">
                <span>Access Console</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>

        <div className="border-t border-[#1a1a2a]/50 pt-8">
          <div className="flex items-center justify-center gap-4 text-sm text-[#94a3b8] font-medium">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0CE7A1] animate-pulse"></div>
              <span>All Systems Operational</span>
            </div>
            <span>•</span>
            <span>Web Shell v0.1.0</span>
            <span>•</span>
            <span>NovaOS Core Systems</span>
          </div>
          <p className="text-xs text-[#6b7280] mt-4">
            Access additional platforms and services through the main <a href="http://localhost:3005" className="text-[#dc2626] hover:underline font-semibold">NovaOS Dashboard</a>
          </p>
        </div>
      </div>
    </div>
  );
}
