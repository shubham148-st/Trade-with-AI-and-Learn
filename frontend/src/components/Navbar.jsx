import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Bot, 
  Wallet, 
  BookOpen, 
  TrendingUp, 
  RefreshCw, 
  Search, 
  Clock, 
  Menu, 
  X,
  ChevronRight
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  const menuRef = useRef(null);

  // Live ticking clock updated every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close hamburger dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const tabs = [
    { id: 'dashboard', label: 'Market Overview', desc: 'Indices, liquid bluechips & movers', icon: Activity },
    { id: 'ai-analysis', label: 'AI Command Center', desc: 'Pre-market, live signals & post-market analysis', icon: Bot },
    { id: 'paper-trading', label: 'Live Paper Trading', desc: 'Virtual portfolio & risk guardrails', icon: Wallet },
    { id: 'algo-academy', label: 'Algo Academy', desc: 'Quantitative strategies knowledge base', icon: BookOpen },
  ];

  const searchResults = searchQuery.trim() === '' ? [] : stocks.filter(s => {
    if (s.symbol?.startsWith('^')) return false;
    const q = searchQuery.toLowerCase();
    return s.symbol.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
  }).slice(0, 6);

  // Determine Indian Stock Market Hours (NSE: 09:15 to 15:30 IST, Mon-Fri)
  const day = now.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const isPreMarket = isWeekday && timeInMinutes >= 540 && timeInMinutes < 555;
  const isLiveMarket = isWeekday && timeInMinutes >= 555 && timeInMinutes <= 930;

  let marketStatusText = 'Market Closed';
  let marketColor = '#888888';
  if (isLiveMarket) {
    marketStatusText = '● NSE LIVE (09:15 - 15:30)';
    marketColor = 'var(--green, #2ed573)';
  } else if (isPreMarket) {
    marketStatusText = '● Pre-Market Session';
    marketColor = 'var(--amber, #ffa502)';
  } else {
    marketStatusText = isWeekday && timeInMinutes < 540 ? 'Opens 09:15 AM' : 'Market Closed';
  }

  const timeString = now.toLocaleTimeString('en-IN', { hour12: false });

  const activeTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <header style={{
      background: 'var(--bg-bar, #12141a)',
      borderBottom: '1px solid var(--border, #2a2d35)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '0 1.25rem',
      overflow: 'visible'
    }}>
      <div className="navbar-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        maxWidth: '1600px',
        margin: '0 auto',
        gap: '1rem'
      }}>
        {/* Brand (TAIL with Official Logo & Mobile Stacked Section Name) */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="brand-wrapper"
          style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <img 
              src="/tail-mark.png" 
              alt="TAIL" 
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: '1px solid var(--border, #2a2d35)',
                display: 'block',
                objectFit: 'cover'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '0.04em',
                color: '#ffffff'
              }}>
                TAIL
              </span>
              <span className="brand-subtext" style={{
                color: 'var(--text-muted, #888888)',
                fontSize: '0.82rem',
                fontWeight: 500
              }}>
                Trade with AI and Learn
              </span>
              <span className="brand-badge-desktop" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border, #2a2d35)',
                color: 'var(--text-muted, #888888)',
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {activeTabMeta.label}
              </span>
            </div>
          </div>
          {/* Mobile View: Section name shown below the logo */}
          <div className="brand-badge-mobile" style={{ marginTop: '2px' }}>
            {activeTabMeta.label}
          </div>
        </div>

        {/* Right Actions: Clock, Search, Sync, and 3-Line Dropdown Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          
          {/* Live Ticking Clock & Market Status Badge */}
          <div className="navbar-clock-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card, #1a1d23)',
            border: '1px solid var(--border, #2a2d35)',
            borderRadius: '6px',
            padding: '4px 10px',
            flexShrink: 0
          }}>
            <Clock size={13} color="var(--text-muted, #888888)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="navbar-clock-time" style={{
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main, #d1d5db)',
                lineHeight: 1.1
              }}>
                {timeString} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #888888)' }}>IST</span>
              </div>
              <div className="navbar-clock-status" style={{
                fontSize: '0.62rem',
                fontWeight: 600,
                color: marketColor,
                lineHeight: 1.1,
                marginTop: '1px'
              }}>
                {marketStatusText}
              </div>
            </div>
          </div>

          {/* Quick Stock Finder (Desktop) */}
          <div className="navbar-search-desktop" style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-card, #1a1d23)',
              border: '1px solid var(--border, #2a2d35)',
              borderRadius: '6px',
              padding: '4px 8px',
              width: '140px'
            }}>
              <Search size={13} color="var(--text-muted, #888888)" />
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
                  color: 'var(--text-main, #d1d5db)',
                  fontSize: '0.78rem',
                  width: '100%'
                }}
              />
            </div>

            {searchOpen && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '240px',
                background: 'var(--bg-card, #1a1d23)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
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
                      fontSize: '0.8rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{s.symbol.replace('.NS', '')}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>{s.name}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#aaa' }}>₹{s.price || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Button (Desktop) */}
          <button
            className="navbar-sync-desktop"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              background: 'var(--bg-card, #1a1d23)',
              border: '1px solid var(--border, #2a2d35)',
              color: isRefreshing ? 'var(--accent, #00d4aa)' : 'var(--text-main, #d1d5db)',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Fast parallel fetch of live quotes"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* 3-Line Dropdown Menu Beside Sync (Point 7) */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: menuOpen ? 'var(--accent, #00d4aa)' : 'var(--bg-card, #1a1d23)',
                border: '1px solid var(--border, #2a2d35)',
                color: menuOpen ? '#0f1117' : 'var(--text-main, #d1d5db)',
                padding: '6px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Navigation Menu"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: '115%',
                right: 0,
                width: '260px',
                background: 'var(--bg-card, #1a1d23)',
                border: '1px solid var(--border, #2a2d35)',
                borderRadius: '10px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
                zIndex: 10000,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {/* Sync Action inside Option Menu (Appears ONLY when top sync is hidden) */}
                <div 
                  className="menu-sync-mobile"
                  style={{
                    padding: '6px 8px',
                    borderBottom: '1px solid rgba(42, 45, 53, 0.5)'
                  }}
                >
                  <button
                    onClick={() => {
                      onRefresh();
                    }}
                    disabled={isRefreshing}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 212, 170, 0.12)',
                      border: '1px solid rgba(0, 212, 170, 0.35)',
                      color: isRefreshing ? 'var(--accent, #00d4aa)' : 'var(--text-main, #d1d5db)',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: isRefreshing ? 'wait' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
                    <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                  </button>
                </div>

                <div style={{
                  padding: '6px 10px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted, #888888)',
                  borderBottom: '1px solid rgba(42, 45, 53, 0.5)'
                }}>
                  Platform Sections
                </div>

                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <div
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: isActive ? 'rgba(0, 212, 170, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon 
                          size={16} 
                          color={isActive ? 'var(--accent, #00d4aa)' : 'var(--text-muted, #888888)'} 
                        />
                        <div>
                          <div style={{
                            fontSize: '0.82rem',
                            fontWeight: isActive ? 700 : 600,
                            color: isActive ? 'var(--accent, #00d4aa)' : 'var(--text-main, #d1d5db)'
                          }}>
                            {tab.label}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #888888)' }}>
                            {tab.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} color="var(--text-muted, #888888)" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
