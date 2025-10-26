import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Cover() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 to-indigo-50">
      {/* Navigation */}
      <nav className="w-full py-4 px-6 bg-white/50 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            Echocity
          </span>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto p-8 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="px-6 space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now Live in India
              </span>
              <h1 className="text-5xl font-extrabold leading-tight">
                Your Voice in
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80"> Urban Change</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Report civic issues, attach photos, and track resolution. Our AI-powered platform helps identify and categorize issues instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Start Reporting</span>
                <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2 L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 9 L12 16 L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-3 border-2 border-primary/10 bg-white/50 backdrop-blur-sm text-primary px-8 py-4 rounded-xl hover:border-primary/30 hover:bg-white/80 transition-all duration-200"
              >
                Learn more
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  title: "Quick Reports",
                  description: "Snap & submit in 30 seconds",
                  icon: "📸"
                },
                {
                  title: "AI Powered",
                  description: "Smart issue categorization",
                  icon: "🤖"
                },
                {
                  title: "Track Progress",
                  description: "Real-time status updates",
                  icon: "📊"
                }
              ].map((feature) => (
                <div key={feature.title} className="group p-6 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/60 hover:bg-white/60 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold text-primary/90 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-2xl transform rotate-2"></div>
              <img
                src="/Echocity1/images/hero/hero-bg.svg"
                alt="City illustration"
                className={`w-full rounded-2xl border border-slate-200/60 bg-white/50 shadow-xl transition-all duration-700 ${
                  loaded ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
                }`}
                onLoad={() => setLoaded(true)}
                loading="lazy"
              />
              <div className="text-sm font-semibold">Snap • Upload • Resolve</div>
              <div className="text-xs text-muted-foreground">AI-assisted reporting & city collaboration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
