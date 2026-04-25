import { Link } from 'react-router-dom'

const steps = [
  { title: 'Creators Publish', desc: 'Write an article, set your price (as low as $0.01), and publish. AI analyzes your content for quality scoring, generates a summary, and estimates reading time. A content hash is stored on-chain for integrity verification.' },
  { title: 'Readers Discover', desc: "Browse the feed with AI-powered recommendations personalized to your reading history. Every article shows its quality score, reading time, price, and read count." },
  { title: 'Seamless Micropayments', desc: 'Top up your reading wallet once, enable auto-pay, and read freely. Each article automatically deducts a tiny amount — no wallet popups, no interruptions.' },
  { title: 'Instant Earnings', desc: 'Creators earn immediately from every read. No waiting for monthly payouts, no minimum thresholds. Withdraw your earnings to your wallet anytime.' },
]

const competitors = [
  { name: 'MintBoard', cut: '97.5%', model: 'Pay per read', highlight: true },
  { name: 'Substack', cut: '90%', model: 'Subscription' },
  { name: 'YouTube', cut: '55%', model: 'Ad revenue' },
  { name: 'Medium', cut: '~50%', model: 'Partner program' },
  { name: 'Spotify', cut: '~30%', model: 'Per stream' },
  { name: 'App Store', cut: '70%', model: 'Per download' },
]

const roles = [
  { title: 'Readers', desc: 'Top up once, read freely. Auto-pay makes articles unlock instantly — no popups, no friction. Your reading wallet tracks your balance.' },
  { title: 'Creators', desc: 'Publish articles, set your price, earn from every read. AI scores your content quality. Withdraw earnings anytime to your wallet.' },
  { title: 'Curators', desc: 'Boost articles you believe in by staking tokens. When boosted articles get reads, you earn 10% of the revenue. Early discovery pays.' },
]

const aiFeatures = [
  { title: 'Content Analysis', desc: 'Every article is analyzed for quality, readability, and topic classification. AI generates summaries, reading time estimates, and a quality score (1-10).' },
  { title: 'Personalized Recommendations', desc: "The \"Recommended for You\" section uses your reading history and article metadata to surface content you'll enjoy. Each recommendation explains why it was picked." },
  { title: 'Autonomous Curator Agent', desc: 'An AI agent with its own wallet monitors new publications, scores their quality, and submits ratings on-chain — acting as an autonomous curator.' },
  { title: 'Content Verification', desc: 'A keccak256 hash of each article is stored on-chain at publish time. When you read an article, the hash is verified — a green badge means authentic content.' },
]

const techStack = [
  { label: 'Blockchain', value: 'Initia EVM Appchain (Solidity + Foundry)' },
  { label: 'Frontend', value: 'React + InterwovenKit + wagmi + viem' },
  { label: 'AI Service', value: 'Python FastAPI + ATXP LLM Gateway' },
  { label: 'Storage', value: 'On-chain (ownership, payments, scores) + SQLite (content)' },
  { label: 'Oracle', value: 'Mock oracle for USD-equivalent dynamic pricing' },
]

const initiaFeatures = [
  { title: 'Auto-Signing', desc: 'Readers approve once, then every article read charges automatically — zero wallet popups. The AI curator agent also uses auto-signing for autonomous on-chain score submissions.' },
  { title: 'Interwoven Bridge', desc: 'Readers bridge INIT tokens from L1 testnet to fund their reading wallet on the appchain. One click to move assets across chains.' },
  { title: 'Initia Usernames (.init)', desc: 'Creators are identified by their .init username throughout the platform — in the navbar, on articles, and in dashboards. Never raw hex addresses.' },
]

export default function About() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>

        <div className="about-hero">
          <h1>How <span style={{ color: 'var(--accent)' }}>Mint</span>Board Works</h1>
          <p>A decentralized content platform where creators keep 97% of every read. No subscriptions. No middlemen. Just fair pay for great writing.</p>
        </div>

        {/* How It Works */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>How It Works</h2>
          <div className="step-list">
            {steps.map((s, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Sharing */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Revenue Sharing</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--fg-muted)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
            Every payment is split by smart contract — transparent, automatic, and immutable.
          </p>

          <div style={{ marginBottom: '1.75rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Standard Split</p>
            <div className="revenue-bar">
              <div className="revenue-segment creator" style={{ flex: 97.5 }}>97.5%</div>
              <div className="revenue-segment protocol" style={{ flex: 2.5, fontSize: '0.625rem' }}>2.5%</div>
            </div>
            <div className="revenue-labels"><span>Creator</span><span>Protocol</span></div>
          </div>

          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Boosted Article Split</p>
            <div className="revenue-bar">
              <div className="revenue-segment creator" style={{ flex: 87.5 }}>87.5%</div>
              <div className="revenue-segment curator" style={{ flex: 10 }}>10%</div>
              <div className="revenue-segment protocol" style={{ flex: 2.5, fontSize: '0.625rem' }}>2.5%</div>
            </div>
            <div className="revenue-labels"><span>Creator</span><span className="curator-label">Curators</span><span>Protocol</span></div>
          </div>
        </div>

        {/* Comparison */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>vs. Traditional Platforms</h2>
          <table className="comparison-table">
            <thead>
              <tr><th>Platform</th><th>Creator Gets</th><th>Model</th></tr>
            </thead>
            <tbody>
              {competitors.map(({ name, cut, model, highlight }) => (
                <tr key={name} className={highlight ? 'highlight' : ''}>
                  <td>{name}</td><td>{cut}</td><td>{model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Three Roles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Three Roles, One Economy</h2>
          <div className="role-grid">
            {roles.map(r => (
              <div key={r.title} className="role-card">
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Features */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>AI-Powered Features</h2>
          <div className="feature-list">
            {aiFeatures.map(f => (
              <div key={f.title} className="feature-item">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Built on Initia</h2>
          <div className="tech-stack">
            {techStack.map(t => (
              <div key={t.label} className="tech-row">
                <span className="tech-label">{t.label}</span>
                <span className="tech-value">{t.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Initia Native Features */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>Initia Native Features</h2>
          <div className="feature-list">
            {initiaFeatures.map(f => (
              <div key={f.title} className="feature-item">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="about-cta">
          <p>Ready to start?</p>
          <div className="about-cta-buttons">
            <Link to="/" className="btn btn-primary">Read Articles</Link>
            <Link to="/publish" className="btn btn-secondary">Publish Your First Article</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
