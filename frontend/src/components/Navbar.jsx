import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Bot, 
  Wallet, 
  BookOpen, 
  ExternalLink, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onRefresh, isRefreshing }) {
  const tabs = [
    { id: 'dashboard', label: 'Market Overview', icon: Activity },
    { id: 'ai-analysis', label: 'AI Multi-Agent Analysis', icon: Bot },
    { id: 'paper-trading', label: 'Live Paper Trading', icon: Wallet, highlight: true },
    { id: 'algo-academy', label: 'Algo Knowledge Base', icon: BookOpen },
  ];

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 1.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00e5b3, #3b82f6)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--accent-glow)'
          }}>
            <TrendingUp size={22} color="#0a0d14" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              NSE QuantPro
              <span style={{
                background: 'rgba(0, 229, 179, 0.15)',
                color: 'var(--accent)',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700
              }}>REACT VITE</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realtime Market Intelligence & Paper Alpha</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isActive 
                    ? '1px solid var(--accent)' 
                    : (tab.highlight ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'),
                  background: isActive 
                    ? 'rgba(0, 229, 179, 0.1)' 
                    : (tab.highlight ? 'rgba(16, 185, 129, 0.08)' : 'transparent'),
                  color: isActive 
                    ? 'var(--accent)' 
                    : (tab.highlight ? 'var(--green)' : 'var(--text-muted)'),
                  fontSize: '0.85rem',
                  fontWeight: isActive || tab.highlight ? 600 : 500,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Global Action & Python Gateway link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              transition: 'all 0.2s'
            }}
            title="Refresh Quotes"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            Sync
          </button>
          
          <a
            href="http://localhost:5500"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              border: '1px solid var(--border)',
              borderRadius: '6px'
            }}
          >
            Flask UI <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
