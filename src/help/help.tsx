import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Does StopSlop send my YouTube viewing history to any server?',
    a: 'No. StopSlop is 100% privacy-first and runs entirely inside your browser. All metadata extraction, pattern detection, blocklist matching, and filtering happen locally on your device.'
  },
  {
    q: 'What happens when a video is blurred in "Blur & Dim" mode?',
    a: 'The thumbnail is blurred (18px) and dimmed so you aren\'t lured by low-effort clickbait. Clicking the "👁️ Reveal" button instantly un-blurs the video card so you can inspect it if desired.'
  },
  {
    q: 'How do I unflag a video that was incorrectly marked as slop?',
    a: 'Hover over the flagged video card on YouTube and click "🏳️ Unflag". This immediately restores normal display and adds the video ID to your user whitelist.'
  },
  {
    q: 'How does channel blocking work?',
    a: 'You can block creators by typing their name, handle (e.g. @SlopStudio), full URL, or wildcard (e.g. *Slop*). You can also click "🚫 Block Channel" on hover over any video card on YouTube. Matching channels receive an immediate 100% flag score.'
  },
  {
    q: 'How do I get the latest slop detection rules?',
    a: 'Open the extension popup and go to the "Updates 🔄" tab. Click "🔄 Update Rules" to fetch the latest community-curated regex patterns and bot channel blocklists without needing to reinstall the extension.'
  }
];

export const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const filteredFaqs = FAQS.filter(
    f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="help-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/icons/icon-48.png" alt="StopSlop Logo" className="sidebar-logo" />
          <div>
            <div className="sidebar-title">StopSlop</div>
            <span className="sidebar-version">v0.1.0 Docs</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#overview" className="nav-link">🚀 Quick Start</a>
          <a href="#detection" className="nav-link">🧠 Detection Rules</a>
          <a href="#modes" className="nav-link">👁️ Filter Modes</a>
          <a href="#blocklist" className="nav-link">🚫 Blocklist Guide</a>
          <a href="#updates" className="nav-link">🔄 Dynamic Updates</a>
          <a href="#faqs" className="nav-link">❓ FAQs & Help</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="doc-header">
          <h1 className="doc-title">StopSlop User Guide & Documentation</h1>
          <p className="doc-lead">
            Everything you need to know about configuring, customizing, and mastering StopSlop on YouTube.
          </p>
        </header>

        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search documentation, rules, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Section 1: Quick Start */}
        <section id="overview" className="doc-section">
          <h2 className="section-heading">🚀 Quick Start</h2>
          <p>
            StopSlop runs seamlessly in the background as you browse YouTube. It constantly observes video cards in your feed, search results, sidebar, and Shorts, evaluating them against multi-signal detection rules.
          </p>
          <div className="cards-grid">
            <div className="feature-card">
              <div className="card-title">⚡ Instant Detection</div>
              <div className="card-desc">Zero latency. Video titles and metadata are scanned locally in milliseconds without page refreshes.</div>
            </div>
            <div className="feature-card">
              <div className="card-title">🛡️ Privacy-First</div>
              <div className="card-desc">No external analytics, tracking, or cloud recording. All settings stay in your browser.</div>
            </div>
            <div className="feature-card">
              <div className="card-title">🎯 1-Click Control</div>
              <div className="card-desc">Quick hover actions right on YouTube: Reveal, Whitelist, or Block Channel permanently.</div>
            </div>
          </div>
        </section>

        {/* Section 2: Detection Rules */}
        <section id="detection" className="doc-section">
          <h2 className="section-heading">🧠 Detection Rules & Heuristics</h2>
          <p>
            StopSlop uses an explainable multi-signal scoring model rather than simple binary string matches. Signals are combined with synergy bonuses to accurately catch content farm slop while preserving human creators.
          </p>

          <div className="cards-grid">
            <div className="feature-card">
              <div className="card-title">🤖 AI Slop & Fake Trailers</div>
              <div className="card-desc">
                Catches prompts like <code>"I asked AI to..."</code>, Midjourney/ChatGPT buzzwords, and synthetic concept movie trailers.
              </div>
            </div>
            <div className="feature-card">
              <div className="card-title">🚜 Content Farm Formulas</div>
              <div className="card-desc">
                Detects repetitive listicles (<code>"100 facts that will save your life"</code>), psychological clickbait, and hyper-curiosity traps.
              </div>
            </div>
            <div className="feature-card">
              <div className="card-title">🧠 Brainrot & Sensory Slop</div>
              <div className="card-desc">
                Flags meme spam (Skibidi, Ohio rizz) and sensory video hooks like split-screen Subway Surfers gameplay.
              </div>
            </div>
            <div className="feature-card">
              <div className="card-title">📢 Reddit Bot Narrations</div>
              <div className="card-desc">
                Identifies automated text-to-speech channels farming <code>r/AskReddit</code> and <code>r/AITA</code> stories.
              </div>
            </div>
          </div>

          <div className="callout-note">
            💡 <strong>Sensitivity Slider:</strong> Adjust the threshold (30% to 95%) in the popup. A lower sensitivity flags more aggressively, while a higher sensitivity only catches blatant slop.
          </div>
        </section>

        {/* Section 3: Filter Modes */}
        <section id="modes" className="doc-section">
          <h2 className="section-heading">👁️ Visual Filtering Modes</h2>
          <p>Configure how flagged content appears in your YouTube feed:</p>

          <div className="cards-grid">
            <div className="feature-card">
              <div className="card-title">1. Blur & Dim (Default)</div>
              <div className="card-desc">
                Blurs the thumbnail (18px) and dims card opacity. Includes an <strong>"👁️ Reveal"</strong> button to un-blur on demand.
              </div>
            </div>
            <div className="feature-card">
              <div className="card-title">2. Badge Only</div>
              <div className="card-desc">
                Keeps the thumbnail visible, but overlays an unmistakable <code>🚩 SLOP</code> badge with confidence breakdown.
              </div>
            </div>
            <div className="feature-card">
              <div className="card-title">3. Hide Completely</div>
              <div className="card-desc">
                Completely removes flagged video cards from your YouTube feed for a clean, distraction-free interface.
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Blocklist Guide */}
        <section id="blocklist" className="doc-section">
          <h2 className="section-heading">🚫 Local User Blocklist Guide</h2>
          <p>
            You can block creators and channels using flexible formats that immediately receive a 100% flag score:
          </p>

          <div className="code-block">
            # Format Examples:
            @SlopFactoryTV          # Matches @handle or channel name
            https://youtube.com/@AIClips  # Direct channel URL
            *Slop*                  # Wildcard: matches any channel containing 'Slop'
            /^AI\s.*Facts$/i        # Advanced: Regular expression pattern
          </div>
        </section>

        {/* Section 5: Dynamic Updates */}
        <section id="updates" className="doc-section">
          <h2 className="section-heading">🔄 Dynamic Updates & Portability</h2>
          <p>
            StopSlop is designed to be dynamically updateable without needing to reinstall the extension:
          </p>
          <ul style={{ paddingLeft: 20, color: '#d1d5db', fontSize: 13, marginBottom: 16 }}>
            <li><strong>Dynamic Rules Sync:</strong> Fetch updated regex rules and community blocklists from the <em>Updates 🔄</em> tab in the popup.</li>
            <li><strong>App Updates:</strong> Click <em>Check for App Update</em> to trigger Chromium runtime update checks.</li>
            <li><strong>Backup & Portability:</strong> Export your settings, blocklists, and custom keywords to <code>stopslop-backup.json</code> to share across devices.</li>
          </ul>
        </section>

        {/* Section 6: FAQs */}
        <section id="faqs" className="doc-section">
          <h2 className="section-heading">❓ Frequently Asked Questions</h2>
          <div className="faq-list">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <div className="faq-question" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  <span>{openFaq === idx ? '▲' : '▼'}</span>
                </div>
                {openFaq === idx && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

const rootEl = document.getElementById('help-root');
if (rootEl) {
  createRoot(rootEl).render(<HelpPage />);
}
