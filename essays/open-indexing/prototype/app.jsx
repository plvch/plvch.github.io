// app.jsx — root router. TR-style: Portfolio is the entry point;
// no Home tab. Bottom CTA: "Suche" + "Aktivität" (TR-like).

const { useState: AU, useCallback: AC, useEffect: AE } = React;

// ─── Theme — dark/light with localStorage persistence ─────────────
// Note: an inline script in the HTML sets data-theme on <html> *before*
// React mounts so there's no flash. We just track state + toggle here.
function useTheme() {
  const [theme, setTheme] = AU(() => {
    try {
      return document.documentElement.getAttribute('data-theme')
          || localStorage.getItem('bb:theme') || 'dark';
    } catch { return 'dark'; }
  });
  AE(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bb:theme', theme); } catch {}
  }, [theme]);
  // When embedded in an iframe, the parent page may set data-theme directly.
  // Mirror those changes into React state so props like IOSDevice.dark stay in sync.
  AE(() => {
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      if ((t === 'dark' || t === 'light') && t !== theme) setTheme(t);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, [theme]);
  const toggle = AC(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  return [theme, toggle];
}

const ThemeContext = React.createContext({ theme: 'dark', toggle: () => {} });
const useThemeCtx = () => React.useContext(ThemeContext);

function HomeRedirect({ navigate }) {
  React.useEffect(() => { navigate('portfolio'); }, []);
  return null;
}

function ProfileScreen({ goBack }) {
  const store = useStore();
  return (
    <div className="page" style={{ height: '100%', overflow: 'auto', paddingBottom: 88 }}>
      <Header
        left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
        title="Profil"
      />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 99,
          background: 'var(--surface-2)', color: 'var(--fg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700,
        }}>{store.account.name[0]}</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{store.account.name}</div>
        <div className="num" style={{ fontSize: 13, color: 'var(--fg-mid)' }}>Cash {fmtEur(store.account.cash_eur)}</div>
      </div>
      <div style={{ margin: 20, background: 'var(--surface-1)', borderRadius: 14 }}>
        {['Persönliche Daten', 'Dokumente', 'Benachrichtigungen', 'Hilfe'].map((t, i, a) => (
          <div key={t} style={{
            padding: '14px 16px',
            borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'var(--fg-mid)',
          }}>
            <span>{t}</span>
            <Icon name="chevR" size={16} color="var(--fg-faint)"/>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-faint)', marginTop: 20 }}>
        Basket Broker · Demo
      </div>
    </div>
  );
}

// Bottom CTA bar — TR-style "Suche" / "Aktivität" pill row.
// Floating, doesn't take vertical space; appears on top-level screens.
function BottomBar({ active, onChange }) {
  const items = [
    { id: 'search',    label: 'Suche',     icon: 'search' },
    { id: 'portfolio', label: 'Portfolio', icon: 'pie' },
    { id: 'activity',  label: 'Aktivität', icon: 'list' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
      paddingTop: 14, paddingLeft: 20, paddingRight: 20,
      background: 'linear-gradient(to top, var(--bg) 60%, rgba(0,0,0,0))',
      zIndex: 50,
      pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', gap: 6,
        background: 'var(--surface-1)',
        borderRadius: 99, padding: 5,
        pointerEvents: 'auto',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}>
        {items.map(it => {
          const isActive = it.id === active;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} className="bb-tap" style={{
              flex: 1, height: 44, border: 'none', borderRadius: 99,
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'var(--accent-fg)' : 'var(--fg-mid)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontWeight: 600, fontSize: 13, letterSpacing: -0.1,
            }}>
              <Icon name={it.icon} size={16} stroke={2}/>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [stack, setStack] = AU([{ screen: 'portfolio', params: {} }]);
  const [tab, setTab] = AU('portfolio');

  const current = stack[stack.length - 1];

  const navigate = AC((screen, params = {}, opts = {}) => {
    const tabScreens = { search: 'search', portfolio: 'portfolio', activity: 'activity' };
    if (tabScreens[screen]) {
      setStack([{ screen, params }]);
      setTab(screen);
      return;
    }
    if (opts.reset) {
      setStack([{ screen, params }]);
    } else {
      setStack(s => [...s, { screen, params }]);
    }
  }, []);

  const goBack = AC(() => {
    setStack(s => s.length > 1
      ? s.slice(0, -1)
      : [{ screen: 'portfolio', params: {} }]);
    setTab(t => t);
  }, []);

  const switchTab = AC((id) => {
    setTab(id);
    setStack([{ screen: id, params: {} }]);
  }, []);

  const screens = {
    home:        HomeRedirect,
    portfolio:   PortfolioScreen,
    search:      SearchScreen,
    activity:    ActivityScreen,
    basket:      BasketDetailScreen,
    weights:     WeightsScreen,
    savings:     SavingsScreen,
    buy:         BuyScreen,
    sell:        SellScreen,
    buySuccess:  BuySuccessScreen,
    claimGhost:  ClaimGhostScreen,
    profile:     ProfileScreen,
  };
  const Screen = screens[current.screen] || PortfolioScreen;

  // Hide bottom bar on overlay flows (they have their own sticky footer).
  const hideBar = ['buy', 'sell', 'savings', 'weights', 'claimGhost', 'buySuccess', 'basket', 'profile'].includes(current.screen)
    || (current.screen === 'search' && current.params.addToBasketId);

  const labels = {
    portfolio: '01 Portfolio', search: '02 Suche', activity: '03 Aktivität',
    basket: '04 Basket', weights: '05 Gewichtung', savings: '06 Sparplan',
    buy: '07 Kauf', buySuccess: '08 Bestätigung', claimGhost: '09 Übernehmen',
    profile: '10 Profil', sell: '11 Verkauf',
  };

  return (
    <ToastHost>
      <div data-screen-label={labels[current.screen] || current.screen}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Screen navigate={navigate} goBack={goBack} params={current.params}/>
        {!hideBar && <BottomBar active={tab} onChange={switchTab}/>}
      </div>
    </ToastHost>
  );
}

function Root() {
  const [theme, toggle] = useTheme();
  const embedded = typeof document !== 'undefined' &&
    document.documentElement.classList.contains('embedded');
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div style={{
        width: '100vw', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        background: embedded ? 'transparent' : (theme === 'dark'
          ? 'radial-gradient(ellipse at top, #18181D 0%, #0A0A0D 70%)'
          : 'radial-gradient(ellipse at top, #F2F2F4 0%, #E2E2E5 70%)'),
        boxSizing: 'border-box',
        transition: 'background 200ms ease',
      }}>
        <IOSDevice width={402} height={874} dark={theme === 'dark'}>
          <div style={{ position: 'absolute', top: 54, left: 0, right: 0, bottom: 0, background: 'var(--bg)', overflow: 'hidden' }}>
            <StoreProvider>
              <App/>
            </StoreProvider>
          </div>
        </IOSDevice>
      </div>
    </ThemeContext.Provider>
  );
}

Object.assign(window, { ThemeContext, useThemeCtx });

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
