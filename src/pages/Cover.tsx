import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Cover() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-8 text-left grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="px-6">
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">Echocity — Voice of the Citizens</h1>
          <p className="text-lg text-muted-foreground mb-6">Report civic issues, attach photos, and track resolution. Our smart image analysis can suggest categories (pothole, waste overflow, streetlight issue) to speed reporting.</p>

          <div className="flex gap-4 mb-6">
            <Link to="/app" className="inline-flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 9 L12 16 L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Enter the app
            </Link>

            <Link to="/auth" className="inline-flex items-center gap-3 border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary/5 transition">
              Sign in / Sign up
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white/60 rounded-lg shadow-sm">
              <h4 className="font-semibold">Quick reports</h4>
              <p className="text-sm text-muted-foreground">Snap a photo and submit in under 30 seconds.</p>
            </div>
            <div className="p-4 bg-white/60 rounded-lg shadow-sm">
              <h4 className="font-semibold">Smart suggestions</h4>
              <p className="text-sm text-muted-foreground">AI suggests categories so you don't have to.</p>
            </div>
            <div className="p-4 bg-white/60 rounded-lg shadow-sm">
              <h4 className="font-semibold">Track progress</h4>
              <p className="text-sm text-muted-foreground">See status updates and responses from the city.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-xl">
            <img
              src="/hero.svg"
              alt="City illustration"
              className={`w-full rounded-2xl border shadow-lg transition-transform duration-700 ${loaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
              onLoad={() => setLoaded(true)}
              loading="lazy"
            />
            <div className="absolute left-6 bottom-6 bg-white/80 px-4 py-2 rounded-lg shadow">
              <div className="text-sm font-semibold">Snap • Upload • Resolve</div>
              <div className="text-xs text-muted-foreground">AI-assisted reporting & city collaboration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
