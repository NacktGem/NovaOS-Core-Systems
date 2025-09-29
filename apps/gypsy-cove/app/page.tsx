import Link from "next/link";

export default function GypsyCoveHome() {
  const familyModules = [
    {
      id: "business",
      title: "Business & Entrepreneurship",
      description: "Competitive intelligence, market analysis, financial modeling for family enterprises",
      icon: "⚖️",
      href: "/business",
      color: "bg-emerald-500"
    },
    {
      id: "education",
      title: "Education & Tutoring",
      description: "Adaptive learning pathways, curriculum design, AI-powered tutoring systems",
      icon: "📚",
      href: "/education",
      color: "bg-blue-500"
    },
    {
      id: "health",
      title: "Health & Medical",
      description: "Family health tracking, herbal remedies, biohacking protocols, medical AI",
      icon: "❤️",
      href: "/health",
      color: "bg-red-500"
    },
    {
      id: "off-grid",
      title: "Off-Grid & Solar",
      description: "Solar system planning, energy monitoring, off-grid preparedness",
      icon: "⚡",
      href: "/off-grid",
      color: "bg-yellow-500"
    },
    {
      id: "diy-maker",
      title: "DIY & Maker",
      description: "Trades education, repair guides, electronics, construction projects",
      icon: "🔧",
      href: "/diy-maker",
      color: "bg-purple-500"
    },
    {
      id: "family-law",
      title: "Family Law & Rights",
      description: "Legal toolkit, rights education, custody guidance, emergency protocols",
      icon: "🛡️",
      href: "/family-law",
      color: "bg-indigo-500"
    },
    {
      id: "secure-comms",
      title: "Secure Communications",
      description: "Mesh networking, encrypted messaging, emergency communication protocols",
      icon: "📡",
      href: "/secure-comms",
      color: "bg-cyan-500"
    },
    {
      id: "preparedness",
      title: "Emergency & Preparedness",
      description: "Disaster protocols, survival skills, emergency planning, family coordination",
      icon: "⚠️",
      href: "/preparedness",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                GypsyCove Academy
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Family Dashboard
              </button>
              <button className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Nova AI Assistant
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            Comprehensive Family
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {" "}Intelligence Platform
            </span>
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Everything your family needs: Business intelligence, education, health tracking,
            off-grid preparedness, secure communications, and practical life skills - all in one place.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold">
              Start Learning
            </button>
            <button className="border border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold">
              Family Setup
            </button>
          </div>
        </div>
      </section>

      {/* Family Modules Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Complete Family Intelligence Suite
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Each module is designed for family safety, education, and self-reliance.
              No adult content - pure family-focused intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {familyModules.map((module) => (
              <Link
                key={module.id}
                href={module.href}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className={`${module.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-2xl`}>
                  {module.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {module.title}
                </h3>
                <p className="text-white/70 text-sm">
                  {module.description}
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-16 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Nova AI - Your Family Assistant
              </h2>
              <p className="text-white/80 text-lg mb-6">
                Nova adapts to each family member, providing age-appropriate guidance,
                educational support, and practical assistance across all life domains.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-white/90">Child-safe content filtering</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-white/90">Personalized learning paths</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-white/90">Emergency protocol assistance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span className="text-white/90">Cross-platform family coordination</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Nova Ready</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Ask me anything about family life, education, health, or preparedness
                  </p>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Family Safety Notice */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-white font-semibold text-lg mb-2">
              100% Family-Safe Environment
            </h3>
            <p className="text-white/80 text-sm">
              GypsyCove Academy maintains complete separation from adult content platforms.
              All content is curated for family education, safety, and practical life skills.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-white/60 text-sm">
            © 2025 GypsyCove Academy - Empowering Families Through Intelligence & Education
          </div>
        </div>
      </footer>
    </div>
  );
}
