import React, { useEffect, useRef, useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  ExternalLink, 
  Terminal, 
  TrendingUp, 
  Cpu, 
  HelpCircle,
  FileText,
  AlertTriangle,
  Heart
} from 'lucide-react';

export default function Footer({ onNavigateTab }) {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Trigger smooth fade-in slide up when scrolled into view
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLinkClick = (e, targetTab) => {
    e.preventDefault();
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={footerRef}
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border, #2a2d35)',
        background: 'linear-gradient(180deg, #0e1117 0%, #080a0e 100%)',
        color: 'var(--text-muted, #888888)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform'
      }}
    >
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '3rem 1.5rem 1.5rem 1.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Top Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(42, 45, 53, 0.6)'
        }}>
          
          {/* Brand Col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/tail-mark.png"
                alt="TAIL"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  objectFit: 'cover'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '0.04em'
                }}>
                  TAIL
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #888888)' }}>
                  Trade with AI & Learn
                </span>
              </div>
            </div>

            <p style={{
              fontSize: '0.8rem',
              lineHeight: 1.5,
              color: 'var(--text-muted, #888888)',
              margin: '4px 0 0 0'
            }}>
              Next-generation institutional quant terminal and algorithmic learning workspace. 
              Designed for traders, quants, and students mastering the financial markets.
            </p>

            {/* Engine Status Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(46, 213, 115, 0.08)',
              border: '1px solid rgba(46, 213, 115, 0.25)',
              fontSize: '0.72rem',
              color: 'var(--green, #2ed573)',
              width: 'fit-content',
              fontWeight: 600
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green, #2ed573)',
                boxShadow: '0 0 8px var(--green, #2ed573)'
              }} />
              NSE Realtime Mock Engine Active
            </div>
          </div>

          {/* Links Col 1: Platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              PLATFORM
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <li>
                <a href="#dashboard" onClick={(e) => handleLinkClick(e, 'dashboard')} style={linkStyle}>
                  Market Overview
                </a>
              </li>
              <li>
                <a href="#ai-analysis" onClick={(e) => handleLinkClick(e, 'ai-analysis')} style={linkStyle}>
                  Multi-Agent Screener
                </a>
              </li>
              <li>
                <a href="#paper-trading" onClick={(e) => handleLinkClick(e, 'paper-trading')} style={linkStyle}>
                  Virtual Paper Trading
                </a>
              </li>
              <li>
                <a href="#algo-academy" onClick={(e) => handleLinkClick(e, 'algo-academy')} style={linkStyle}>
                  Algo Academy
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Documentation & Resources */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              RESOURCES
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <li>
                <a href="#docs" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  <BookOpen size={13} /> Documentation
                </a>
              </li>
              <li>
                <a href="#api" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  <Terminal size={13} /> REST API Reference
                </a>
              </li>
              <li>
                <a href="#strategy" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  <Cpu size={13} /> Quant Playbooks
                </a>
              </li>
              <li>
                <a href="#changelog" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  <FileText size={13} /> Version v1.0.4 Changelog
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Company & Community */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              COMMUNITY & CODE
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <li>
                <a href="#about" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/shubham148-st/Trade-with-AI-and-Learn" 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ ...linkStyle, color: 'var(--text-main, #d1d5db)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg> GitHub Repository <ExternalLink size={11} style={{ opacity: 0.6 }} />
                </a>
              </li>
              <li>
                <a href="#discord" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Discord Quant Community
                </a>
              </li>
              <li>
                <a href="#support" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Support & Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 4: Legal & Regulatory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.03em' }}>
              LEGAL & SEBI
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <li>
                <a href="#disclaimer" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Risk Disclosure
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#cookies" onClick={(e) => e.preventDefault()} style={linkStyle}>
                  Cookie Preferences
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div style={{
          padding: '1.25rem 0',
          fontSize: '0.72rem',
          lineHeight: 1.6,
          color: 'rgba(255, 255, 255, 0.45)',
          borderBottom: '1px solid rgba(42, 45, 53, 0.4)'
        }}>
          <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Regulatory Disclaimer: </strong>
          TAIL (Trade with AI and Learn) is strictly an algorithmic simulation, research, and educational portal. 
          TAIL is not a SEBI-registered broker, research analyst, or investment advisor. 
          Stock prices, signals, and simulated paper execution are intended solely for quantitative analysis and strategy backtesting. 
          Trading in securities, futures, and options involves substantial risk of financial loss and is not suitable for all investors.
        </div>

        {/* Bottom Copyright & Credits */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '1.25rem',
          fontSize: '0.75rem'
        }}>
          <div>
            © {new Date().getFullYear()} <strong style={{ color: '#ffffff' }}>TAIL</strong> — Trade with AI and Learn. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.4)' }}>
            <span>Built for Institutional Traders & Learners</span>
            <span>•</span>
            <span>NSE Liquid Bluechips</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

const linkStyle = {
  color: 'var(--text-muted, #888888)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'color 0.15s ease',
  cursor: 'pointer'
};
