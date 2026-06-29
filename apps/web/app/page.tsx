import Link from "next/link";
import { VorebaseLogo } from "@/lib/icons";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <VorebaseLogo size={32} />
          <span className="text-xl font-semibold text-text-primary tracking-tight">
            Vorebase
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-bg-primary rounded-lg transition-colors duration-150"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-fade-in-up max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-muted border border-accent/20 text-accent text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Open Source BaaS Platform
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary leading-tight tracking-tight mb-6">
            Build faster with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400">
              Vorebase
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            An open-source Supabase alternative. Instant APIs, authentication,
            file storage, and real-time subscriptions — all in one dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-accent hover:bg-accent-hover text-bg-primary rounded-lg transition-all duration-150 hover:shadow-glow"
            >
              Start Your Project
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-medium border border-border hover:border-border-light text-text-primary rounded-lg transition-colors duration-150 hover:bg-bg-tertiary"
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: "🗄️", title: "Database", desc: "MySQL with auto-generated REST APIs" },
              { icon: "🔐", title: "Auth", desc: "JWT authentication out of the box" },
              { icon: "📦", title: "Storage", desc: "S3-compatible file storage with MinIO" },
              { icon: "⚡", title: "Realtime", desc: "WebSocket subscriptions for live data" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-5 rounded-xl border border-border bg-bg-secondary hover:bg-bg-tertiary hover:border-border-light transition-all duration-200"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border text-center">
        <p className="text-xs text-text-muted">
          © 2025 Vorebase — Open Source Backend-as-a-Service
        </p>
      </footer>
    </div>
  );
}
