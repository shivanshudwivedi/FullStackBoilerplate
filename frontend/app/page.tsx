import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge badge-info">Powered by AI</span>
            </div>
            <h1 className="hero-title">
              Professional Coding
              <br />
              <span className="gradient-text">Assessment Platform</span>
            </h1>
            <p className="hero-description">
              Streamline your technical recruitment with automated assessments,
              AI-powered code analysis, and seamless GitHub integration.
            </p>
            <div className="hero-actions">
              <Link href="/admin" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link href="/admin" className="btn btn-secondary btn-lg">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything you need to assess talent</h2>
            <p className="section-description">
              Built for modern tech companies who value efficiency and quality
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Quick Setup</h3>
              <p className="feature-description">
                Create assessments in minutes with GitHub repository integration
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Analysis</h3>
              <p className="feature-description">
                Automated code review and scoring powered by GPT-4
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Stack Ranking</h3>
              <p className="feature-description">
                Compare candidates with intelligent scoring and recommendations
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Inline Comments</h3>
              <p className="feature-description">
                Review code with file-specific comments and feedback
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="feature-title">Smart Scheduling</h3>
              <p className="feature-description">
                Integrated calendar system for seamless interview booking
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure & Private</h3>
              <p className="feature-description">
                Private repositories with time-limited access control
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to upgrade your hiring process?</h2>
            <p className="cta-description">
              Join leading tech companies using AfterQuery for technical recruitment
            </p>
            <Link href="/admin" className="btn btn-primary btn-lg">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
