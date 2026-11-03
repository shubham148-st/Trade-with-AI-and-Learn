import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bot, 
  Wallet, 
  BookOpen, 
  TrendingUp,
  RefreshCw,
  Search,
  ChevronDown,
  Clock
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  isRefreshing,
  stocks = [],
  onSelectStock 
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(new Date());

  // Live ticking clock updated every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Market Overview', icon: Activity },
    { id: 'ai-analysis', label: 'Multi-Agent Screener', icon: Bot },
    { id: 'paper-trading', label: 'Live Paper Trading', icon: Wallet, highlight: true },
    { id: 'algo-academy', label: 'Algo Academy', icon: BookOpen },
  ];

  const searchResults = searchQuery.trim() === '' ? [] : stocks.filter(s => {
    if (s.symbol?.startsWith('^')) return false;
    const q = searchQuery.toLowerCase();
    return s.symbol.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
  }).slice(0, 6);

  // Determine Indian Stock Market Hours (NSE/BSE: 09:15 to 15:30 IST, Mon-Fri)
  const day = now.getDay(); // 0 is Sun, 6 is Sat
  const isWeekday = day >= 1 && day <= 5;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isPreMarket = isWeekday && timeInMinutes >= 540 && timeInMinutes < 555; // 09:00 - 09:15
  const isLiveMarket = isWeekday && timeInMinutes >= 555 && timeInMinutes <= 930; // 09:15 - 15:30
  
  let marketStatusText = 'Market Closed';
  let marketColor = '#8b949e';
  if (isLiveMarket) {
    marketStatusText = '● NSE LIVE (09:15 - 15:30)';
    marketColor = '#2ed573';
  } else if (isPreMarket) {
    marketStatusText = '● Pre-Market Session';
    marketColor = '#ffa502';
  } else {
    marketStatusText = isWeekday && timeInMinutes < 540 ? 'Opens 09:15 AM' : 'Market Closed';
  }

  const timeString = now.toLocaleTimeString('en-IN', { hour12: false });
  const dateString = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <header style={{
      background: 'var(--bg-bar, #12141a)',
      borderBottom: '1px solid var(--border, #2a2d35)',
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
        margin: '0 auto',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #00d4aa, #0099ff)',
            padding: '7px 9px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 212, 170, 0.3)'
          }}>
            <TrendingUp size={20} color="#0f1117" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Trade with AI and Learn</span>
              <span style={{
                background: isLiveMarket ? 'rgba(46, 213, 115, 0.15)' : 'rgba(0, 212, 170, 0.15)',
                color: isLiveMarket ? 'var(--green, #2ed573)' : 'var(--accent, #00d4aa)',
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 800
              }}>
                {isLiveMarket ? 'NSE LIVE' : 'NSE TERMINAL'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #8b949e)' }}>
              Autonomous Multi-Agent Quant & Paper Trading
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
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
                  gap: '0.45rem',
                  padding: '7px 13px',
                  borderRadius: '7px',
                  border: isActive 
                    ? '1px solid var(--accent, #00d4aa)' 
                    : (tab.highlight ? '1px solid rgba(46, 213, 115, 0.3)' : '1px solid transparent'),
                  background: isActive 
                    ? 'rgba(0, 212, 170, 0.12)' 
                    : (tab.highlight ? 'rgba(46, 213, 115, 0.08)' : 'transparent'),
                  color: isActive 
                    ? 'var(--accent, #00d4aa)' 
                    : (tab.highlight ? 'var(--green, #2ed573)' : 'var(--text-muted, #8b949e)'),
                  fontSize: '0.84rem',
                  fontWeight: isActive || tab.highlight ? 700 : 500,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Live Clock, Search & Sync Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          
          {/* Live Ticking Clock & Market Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-secondary, #22252d)',
            border: '1px solid var(--border, #2a2d35)',
            borderRadius: '8px',
            padding: '5px 12px'
          }}>
            <Clock size={15} color="var(--accent, #00d4aa)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#f0f2f5',
                letterSpacing: '0.03em',
                lineHeight: 1.1
              }}>
                {timeString} <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8b949e)' }}>IST</span>
              </div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: marketColor,
                lineHeight: 1.1,
                marginTop: '2px'
              }}>
                {marketStatusText}
              </div>
            </div>
          </div>

          {/* Quick Stock Finder */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary, #22252d)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '7px',
              padding: '5px 10px',
              width: '160px'
            }}>
              <Search size={14} color="var(--text-muted, #8b949e)" />
              <input
                type="text"
                placeholder="Find stock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main, #f0f2f5)',
                  fontSize: '0.8rem',
                  width: '100%'
                }}
              />
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '105%',
                right: 0,
                width: '260px',
                background: 'var(--bg-card, #1a1d23)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                zIndex: 200,
                overflow: 'hidden'
              }}>
                {searchResults.map(s => (
                  <div
                    key={s.symbol}
                    onClick={() => {
                      onSelectStock(s.symbol);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(42, 45, 53, 0.4)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.symbol.replace('.NS', '')}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #8b949e)' }}>{s.name}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>₹{s.price || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              background: 'var(--bg-card, #1a1d23)',
              border: '1px solid var(--border, #2a2d35)',
              color: isRefreshing ? 'var(--accent, #00d4aa)' : 'var(--text-main, #f0f2f5)',
              padding: '6px 12px',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Fast parallel fetch of live quotes"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
