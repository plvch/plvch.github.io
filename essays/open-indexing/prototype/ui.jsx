// ui.jsx — atoms & small reusable bits for Basket Broker.
// TR-inspired visual language: pure black, white primary, triangle deltas,
// brand-colored asset tiles, big de-DE numbers, flat surfaces.
// Globals exposed at bottom.

const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// ─── Icons (single-stroke, 24px viewBox) ──────────────────────────
const PATHS = {
  search:    'M11 4a7 7 0 105.3 11.6l3.5 3.5 1.4-1.4-3.5-3.5A7 7 0 0011 4zm0 2a5 5 0 110 10 5 5 0 010-10z',
  star:      'M12 2.5l2.95 6 6.55.95-4.75 4.62 1.12 6.53L12 17.6l-5.87 3 1.12-6.53L2.5 9.45l6.55-.95L12 2.5z',
  starOutline:'M12 5.4l2.18 4.42.27.55.61.09 4.86.7-3.52 3.43-.44.43.1.6.83 4.85L12 18.18l-4.36 2.3.83-4.85.1-.6-.44-.43-3.52-3.43 4.86-.7.61-.09.27-.55L12 5.4z',
  plus:      'M12 5v14M5 12h14',
  chevR:     'M9 6l6 6-6 6',
  chevD:     'M6 9l6 6 6-6',
  chevL:     'M15 6l-6 6 6 6',
  arrUp:     'M12 5l0 14M5 12l7-7 7 7',
  arrDn:     'M12 5l0 14M5 12l7 7 7-7',
  close:     'M6 6l12 12M18 6L6 18',
  check:     'M5 12.5l4.5 4.5L19 7',
  bolt:      'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  calendar:  'M4 7h16v13H4zM4 7l0-3M20 7l0-3M8 4v4M16 4v4M4 11h16',
  repeat:    'M17 2l4 4-4 4M21 6H7a4 4 0 00-4 4v2M7 22l-4-4 4-4M3 18h14a4 4 0 004-4v-2',
  edit:      'M4 20h4l11-11-4-4L4 16v4z',
  trash:     'M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13',
  filter:    'M4 5h16l-6 8v6l-4-2v-4L4 5z',
  pie:       'M12 3v9h9a9 9 0 11-9-9z',
  bag:       'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 016 0v2',
  home:      'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H10v7H4a1 1 0 01-1-1v-9z',
  list:      'M4 6h16M4 12h16M4 18h16',
  user:      'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  info:      'M12 8h.01M11 12h1v5h1',
  sparkles:  'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M16.4 7.6l2-2M5.6 18.4l2-2',
  flag:      'M5 3v18M5 4h13l-3 4 3 4H5',
  euro:      'M19 6a8 8 0 100 12M3 10h10M3 14h10',
  shuffle:   'M16 3l5 5-5 5M3 8h7l8 12h3M3 16h7M21 16l-3 0',
  layers:    'M12 2l10 6-10 6L2 8l10-6zM2 14l10 6 10-6',
  arrowRt:   'M5 12h14M13 5l7 7-7 7',
  triUp:     'M12 6l8 12H4z',
  triDn:     'M12 18L4 6h16z',
  sun:       'M12 4v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 7a5 5 0 100 10 5 5 0 000-10z',
  moon:      'M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z',
};

function Icon({ name, size = 20, color = 'currentColor', stroke = 1.7, fill = 'none', style = {} }) {
  const d = PATHS[name];
  // Triangles render as filled solids — not stroked
  if (name === 'triUp' || name === 'triDn') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
        <path d={d} fill={color} stroke="none"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
      <path d={d} fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Delta — TR's signature ▲ +1,11 % / ▼ −1,11 % treatment ──────
function Delta({ value, decimals = 2, suffix = '%', size = 13, weight = 500, style = {} }) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const pos = value >= 0;
  const color = pos ? 'var(--pos)' : 'var(--neg)';
  const abs = Math.abs(value).toFixed(decimals).replace('.', ',');
  return (
    <span className="num" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color, fontSize: size, fontWeight: weight, ...style,
    }}>
      <Icon name={pos ? 'triUp' : 'triDn'} size={size - 2} color={color}/>
      {abs}{suffix && <span style={{ marginLeft: 1 }}>&nbsp;{suffix}</span>}
    </span>
  );
}

// ─── DeltaEur — same but with €
function DeltaEur({ value, decimals = 2, size = 13, weight = 500, style = {} }) {
  if (value === null || value === undefined || isNaN(value)) return null;
  const pos = value >= 0;
  const color = pos ? 'var(--pos)' : 'var(--neg)';
  const abs = Math.abs(value).toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span className="num" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      color, fontSize: size, fontWeight: weight, ...style,
    }}>
      <Icon name={pos ? 'triUp' : 'triDn'} size={size - 2} color={color}/>
      {abs}&nbsp;€
    </span>
  );
}

// ─── Asset glyph — flat brand-tinted square tile ──────────────────
// A minimal palette of "brand colors" stamped from ticker hash.
// Letterforms in white. No border. Square corners (rounded 8).
// ─── Asset glyph — flat brand-tinted square tile ──────────────────
// Brand colors are fixed (theme-independent). ETF tiles use theme-aware
// neutrals so the whole row reads correctly in light + dark.
const BRAND_PALETTE = [
  { bg: '#F5F5F7', fg: '#0A0A0B' },  // Apple-ish off-white
  { bg: '#76B900', fg: '#0A0A0B' },  // NVIDIA green
  { bg: '#F25022', fg: '#FFFFFF' },  // Microsoft red-orange
  { bg: '#FF9900', fg: '#0A0A0B' },  // Amazon orange
  { bg: '#1877F2', fg: '#FFFFFF' },  // Meta blue
  { bg: '#E50914', fg: '#FFFFFF' },  // red
  { bg: '#5865F2', fg: '#FFFFFF' },  // indigo
  { bg: '#10B981', fg: '#FFFFFF' },  // teal-green
  { bg: '#EAB308', fg: '#0A0A0B' },  // yellow
  { bg: '#A78BFA', fg: '#0A0A0B' },  // lavender
  { bg: '#EC4899', fg: '#FFFFFF' },  // pink
  { bg: '#0EA5E9', fg: '#FFFFFF' },  // sky
  { bg: '#262626', fg: '#FFFFFF' },  // dark grey
];

// Hand-tuned for tickers that show up most. Real brand colors — theme-independent.
const BRAND_OVERRIDES = {
  AAPL: { bg: '#F5F5F7', fg: '#0A0A0B' },
  MSFT: { bg: '#F25022', fg: '#FFFFFF' },
  NVDA: { bg: '#76B900', fg: '#0A0A0B' },
  AMZN: { bg: '#FF9900', fg: '#0A0A0B' },
  GOOGL:{ bg: '#4285F4', fg: '#FFFFFF' },
  META: { bg: '#1877F2', fg: '#FFFFFF' },
  TSLA: { bg: '#E31937', fg: '#FFFFFF' },
  ASML: { bg: '#0071CE', fg: '#FFFFFF' },
  SAP:  { bg: '#0FAAFF', fg: '#FFFFFF' },
  ADYEN:{ bg: '#0ABF53', fg: '#FFFFFF' },
  IFX:  { bg: '#202842', fg: '#FFFFFF' },
  STM:  { bg: '#03234B', fg: '#FFFFFF' },
  AMD:  { bg: '#0A0A0B', fg: '#FFFFFF' },
  AVGO: { bg: '#CC092F', fg: '#FFFFFF' },
  NESN: { bg: '#69BAE5', fg: '#FFFFFF' },
  UNH:  { bg: '#002677', fg: '#FFFFFF' },
  PG:   { bg: '#003DA5', fg: '#FFFFFF' },
  JNJ:  { bg: '#CC0000', fg: '#FFFFFF' },
  KO:   { bg: '#F40009', fg: '#FFFFFF' },
  MCD:  { bg: '#FFC72C', fg: '#DA291C' },
  ALV:  { bg: '#003781', fg: '#FFFFFF' },
  DTG:  { bg: '#1B1B1B', fg: '#FFFFFF' },
  SIE:  { bg: '#009999', fg: '#FFFFFF' },
  DBK:  { bg: '#0018A8', fg: '#FFFFFF' },
  MC:   { bg: '#1A1A1A', fg: '#FFFFFF' },  // LVMH
  // ETFs — theme-aware neutrals, monospace label
  VWCE: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  IWDA: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  EQQQ: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  EMIM: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  SXR8: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  XSX6: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  AGGH: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  EGOV: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  IUIT: { bg: 'var(--etf-bg)', fg: 'var(--etf-fg)', isETF: true },
  SGLN: { bg: 'var(--etf-bg)', fg: '#D4AF37', isETF: true },
};

function brandFor(ticker, type) {
  if (BRAND_OVERRIDES[ticker]) return BRAND_OVERRIDES[ticker];
  let h = 0; for (const c of ticker || '?') h = (h * 31 + c.charCodeAt(0)) % BRAND_PALETTE.length;
  return BRAND_PALETTE[h];
}

function AssetGlyph({ ticker = '?', type = 'Stock', size = 36 }) {
  const brand = brandFor(ticker, type);
  const isETF = brand.isETF || type === 'ETF' || type === 'Bond ETF' || type === 'Commodity ETF';
  // ETFs: 4-letter mono label; Stocks: 1-2 char abbreviation
  const lab = isETF
    ? (ticker || '').slice(0, 4)
    : (ticker || '').slice(0, ticker.length <= 2 ? ticker.length : 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: brand.bg, color: brand.fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: isETF ? 'var(--font-mono)' : 'var(--font-sans)',
      fontWeight: isETF ? 500 : 700,
      fontSize: isETF ? size * 0.28 : size * 0.42,
      letterSpacing: isETF ? 0 : -0.5,
      flexShrink: 0,
    }}>{lab}</div>
  );
}

// ─── Basket glyph — neutral square, no accent tint ────────────────
function BasketGlyph({ glyph = '●●', size = 40, dim = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: dim ? '#0E0E11' : 'var(--surface-2)',
      color: dim ? 'var(--fg-faint)' : 'var(--fg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: size * 0.42, fontWeight: 600,
      flexShrink: 0,
      letterSpacing: -0.5,
    }}>{glyph}</div>
  );
}

// ─── Allocation bar — 3 fill modes ────────────────────────────────
// mode: 'empty' (passive 0%, striped), 'target' (weighted, mid grey), 'real' (active, white)
function Bar({ value = 0, mode = 'target', width = '100%', height = 4 }) {
  const pct = Math.max(0, Math.min(100, value));
  const fillColor = mode === 'real' ? 'var(--fg)'
    : mode === 'target' ? 'var(--fg-mid)'
    : 'transparent';
  return (
    <div style={{
      width, height, borderRadius: 99,
      background: 'var(--bar-bg)', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 99,
        background: fillColor,
        transition: 'width 380ms cubic-bezier(.2,.9,.2,1)',
      }}/>
    </div>
  );
}

// ─── Pill — small, used sparingly. No uppercase. ──────────────────
function Pill({ children, tone = 'neutral', style = {} }) {
  const tones = {
    neutral: { bg: 'var(--surface-2)', fg: 'var(--fg-mid)' },
    accent:  { bg: 'var(--accent)', fg: 'var(--accent-fg)' },
    pos:     { bg: 'var(--pos-soft)', fg: 'var(--pos)' },
    neg:     { bg: 'var(--neg-soft)', fg: 'var(--neg)' },
    warn:    { bg: 'rgba(250,204,21,0.12)', fg: 'var(--warn)' },
    ghost:   { bg: 'var(--surface-1)', fg: 'var(--fg-dim)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6,
      background: t.bg, color: t.fg,
      fontSize: 11, fontWeight: 500, letterSpacing: 0,
      ...style,
    }}>{children}</span>
  );
}

// ─── Card / surface — flat, no border (TR style) ─────────────────
function Card({ children, style = {}, onClick, padded = true, dim = false }) {
  return (
    <div onClick={onClick}
      className={onClick ? 'bb-tap' : ''}
      style={{
        background: dim ? 'transparent' : 'var(--surface-1)',
        borderRadius: 14,
        padding: padded ? 16 : 0,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────
function Button({ children, onClick, variant = 'primary', size = 'lg', icon, disabled, style = {} }) {
  const sizes = {
    sm: { h: 36, px: 14, fs: 14, gap: 6, br: 10 },
    md: { h: 44, px: 16, fs: 14, gap: 8, br: 12 },
    lg: { h: 52, px: 20, fs: 15, gap: 8, br: 26 }, // pill on lg
  };
  const s = sizes[size];
  const variants = {
    primary:   { bg: 'var(--accent)', fg: 'var(--accent-fg)' },
    secondary: { bg: 'var(--surface-2)', fg: 'var(--fg)' },
    ghost:     { bg: 'transparent', fg: 'var(--fg)' },
    outline:   { bg: 'transparent', fg: 'var(--fg)', bd: 'var(--line)' },
    danger:    { bg: 'transparent', fg: 'var(--neg)' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className="bb-tap"
      style={{
        height: s.h, padding: `0 ${s.px}px`,
        background: disabled ? 'var(--surface-1)' : v.bg,
        color: disabled ? 'var(--fg-faint)' : v.fg,
        border: v.bd ? `1px solid ${v.bd}` : 'none',
        borderRadius: s.br,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap,
        fontWeight: 600, fontSize: s.fs, letterSpacing: -0.1,
        outline: 'none', WebkitAppearance: 'none', appearance: 'none',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18}/>}
      {children}
    </button>
  );
}

// ─── Header (top of each screen) — TR style ──────────────────────
// Compact with optional large hero title underneath.
function Header({ title, left, right, sub, large }) {
  return (
    <div style={{
      padding: large ? '8px 20px 4px' : '8px 20px 12px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: -8 }}>
          {left || <div style={{ width: 32 }}/>}
        </div>
        {!large && title && (
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', letterSpacing: -0.2 }}>{title}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: -8 }}>
          {right}
        </div>
      </div>
      {large && (
        <div style={{ marginTop: 2, paddingBottom: 4 }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>{title}</div>
          {sub && <div style={{ fontSize: 14, color: 'var(--fg-mid)', marginTop: 4 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Sheet (bottom modal) ─────────────────────────────────────────
function Sheet({ open, onClose, children, title, height = 'auto', maxHeight = '88%' }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      animation: 'fade-in 180ms ease',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'var(--scrim)',
      }}/>
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface-1)',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        animation: 'sheet-up 260ms cubic-bezier(.2,.9,.2,1)',
        maxHeight, height,
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 28px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--surface-3)' }}/>
        </div>
        {title && (
          <div style={{
            padding: '14px 20px 8px', fontSize: 18, fontWeight: 700, letterSpacing: -0.3,
          }}>{title}</div>
        )}
        <div style={{ overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Time-range scrubber — TR's "1T 1W 1M 1J Max" ────────────────
function TimeRange({ value, onChange, options }) {
  const opts = options || [
    { value: '1T',  label: '1T'  },
    { value: '1W',  label: '1W'  },
    { value: '1M',  label: '1M'  },
    { value: '6M',  label: '6M'  },
    { value: '1J',  label: '1J'  },
    { value: 'Max', label: 'Max' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 8, padding: '8px 4px',
    }}>
      {opts.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value}
            onClick={() => onChange && onChange(o.value)}
            className="bb-tap"
            style={{
              flex: 1, height: 28, border: 'none',
              background: 'transparent',
              color: active ? 'var(--fg)' : 'var(--fg-dim)',
              fontWeight: active ? 600 : 500, fontSize: 13,
              position: 'relative',
              padding: 0,
            }}>
            <span style={{ position: 'relative', display: 'inline-block', padding: '0 2px' }}>
              {o.label}
              {active && (
                <span style={{
                  position: 'absolute', left: '50%', bottom: -8,
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--fg)', transform: 'translateX(-50%)',
                }}/>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Segmented control (for filters etc.) ────────────────────────
function SegControl({ options, value, onChange, full = true }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2,
      background: 'var(--surface-1)', borderRadius: 10,
      width: full ? '100%' : 'auto',
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className="bb-tap"
            style={{
              flex: full ? 1 : undefined,
              height: 32, padding: '0 12px',
              border: 'none', borderRadius: 8,
              background: active ? 'var(--surface-3)' : 'transparent',
              color: active ? 'var(--fg)' : 'var(--fg-mid)',
              fontWeight: active ? 600 : 500, fontSize: 13,
            }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// ─── NumPad — numeric keyboard for amount input ───────────────────
function NumPad({ onPress }) {
  const keys = ['1','2','3','4','5','6','7','8','9',',','0','⌫'];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 4, padding: '8px 12px 14px',
    }}>
      {keys.map(k => (
        <button key={k} onClick={() => onPress(k)}
          className="bb-tap"
          style={{
            height: 50, border: 'none',
            background: 'transparent',
            color: 'var(--fg)',
            borderRadius: 14,
            fontSize: 24, fontWeight: 500,
          }}>{k}</button>
      ))}
    </div>
  );
}

// ─── MoneyDisplay — large EUR display, TR-style ─────────────────
// Whole-euro is bold; cents are smaller and dimmer; "€" trailing.
function MoneyDisplay({ amount, big = false, mid = false, color, decimals = 2, dim = false }) {
  const safe = (amount || 0);
  const [eur, cents] = safe.toFixed(decimals).split('.');
  const formattedEur = parseInt(eur, 10).toLocaleString('de-DE');
  const fs = big ? 56 : mid ? 32 : 24;
  const main = color || (dim ? 'var(--fg-mid)' : 'var(--fg)');
  const subcolor = color || (dim ? 'var(--fg-dim)' : 'var(--fg-mid)');
  return (
    <span className="num" style={{
      fontWeight: 700, letterSpacing: -1.6,
      fontSize: fs, lineHeight: 1, color: main,
      display: 'inline-flex', alignItems: 'baseline', gap: 0,
    }}>
      <span>{formattedEur}</span>
      <span style={{ color: subcolor, fontSize: fs * 0.58, fontWeight: 700, letterSpacing: -1 }}>
        ,{cents}
      </span>
      <span style={{ color: subcolor, fontSize: fs * 0.55, marginLeft: fs * 0.13, fontWeight: 600 }}>
        €
      </span>
    </span>
  );
}

// ─── Field row — used inside lists ────────────────────────────────
function FieldRow({ label, value, sub, right, onClick, last = false }) {
  return (
    <div onClick={onClick}
      className={onClick ? 'bb-tap' : ''}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '14px 0',
        borderBottom: last ? 'none' : '1px solid var(--line-soft)',
        cursor: onClick ? 'pointer' : 'default',
      }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--fg-mid)' }}>{label}</div>
        {value !== undefined && (
          <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2, color: 'var(--fg)' }}>{value}</div>
        )}
        {sub && <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Toast system ─────────────────────────────────────────────────
const ToastCtx = createContext(null);
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, tone: opts.tone || 'default' }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 96, zIndex: 200,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.tone === 'accent' ? 'var(--accent)' : 'var(--surface-2)',
            color: t.tone === 'accent' ? 'var(--bg)' : 'var(--fg)',
            padding: '10px 16px', borderRadius: 99,
            fontSize: 14, fontWeight: 500,
            animation: 'sheet-up 220ms cubic-bezier(.2,.9,.2,1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return useContext(ToastCtx); }

// ─── Spacer ───────────────────────────────────────────────────────
function Spacer({ h = 16 }) { return <div style={{ height: h }}/>; }

// ─── Section title — TR style: small bold white with chevron ────
function SectionTitle({ children, right, onMore, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 20px 10px', ...style,
    }}>
      <div onClick={onMore}
        className={onMore ? 'bb-tap' : ''}
        style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 16, fontWeight: 700, color: 'var(--fg)',
        letterSpacing: -0.2,
        cursor: onMore ? 'pointer' : 'default',
      }}>
        {children}
        {onMore && <Icon name="chevR" size={16} color="var(--fg-mid)" stroke={2}/>}
      </div>
      {right && <div style={{ fontSize: 12, color: 'var(--fg-mid)' }}>{right}</div>}
    </div>
  );
}

// ─── Live ticker dot ──────────────────────────────────────────────
function LiveDot({ size = 6, color = 'var(--pos)' }) {
  return (
    <span className="live-dot" style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color,
    }}/>
  );
}

// ─── Random walk generator — seeded, stable across renders ───────
// Used by Sparkline (Portfolio cards) and Chart (basket detail).
// Returns { linePath, fillPath, lastX, lastY, ys, min, max }.
function makeWalk(seedStr, opts = {}) {
  const {
    W = 80, H = 100,
    N = 180,
    drift = 0,            // per-step nominal drift
    vol = 1.4,            // sigma of gaussian step
    jumps = 8,            // count of random-direction jumps
    jumpSize = 4.0,       // magnitude of each jump
    mr = 0.01,            // mean-reversion strength toward target
    targetEnd = 0,        // where the walk should drift toward (Δy from start)
    startY = 50,
    spline = 0.12,        // Catmull-Rom tension; lower = more chaotic
  } = opts;

  // Stable seed from string
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  let s = h >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(-3, Math.min(3, g));
  };

  const jumpAt = new Set();
  for (let k = 0; k < jumps; k++) jumpAt.add(Math.floor(rand() * N));

  const ys = [];
  let y = startY;
  let lo = y, hi = y;
  for (let i = 0; i <= N; i++) {
    const target = startY + (i / N) * targetEnd;
    let step = gauss() * vol + drift + (target - y) * mr;
    if (jumpAt.has(i)) step += gauss() * jumpSize;
    y = Math.max(6, Math.min(94, y + step));
    if (y < lo) lo = y;
    if (y > hi) hi = y;
    ys.push(y);
  }
  // Force the final point to match targetEnd direction (so sign matches caller's intent)
  // by gently nudging the last 12% toward startY+targetEnd
  const endTarget = startY + targetEnd;
  const tail = Math.floor(N * 0.12);
  for (let i = N - tail; i <= N; i++) {
    const k = (i - (N - tail)) / tail;
    ys[i] = ys[i] * (1 - k * 0.6) + endTarget * (k * 0.6);
  }

  const xs = ys.map((_, i) => (i / N) * W);
  const cmd = [`M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`];
  for (let i = 0; i < ys.length - 1; i++) {
    const p0 = i === 0 ? [xs[0], ys[0]] : [xs[i - 1], ys[i - 1]];
    const p1 = [xs[i], ys[i]];
    const p2 = [xs[i + 1], ys[i + 1]];
    const p3 = i + 2 < ys.length ? [xs[i + 2], ys[i + 2]] : p2;
    const t = spline;
    const cp1x = p1[0] + (p2[0] - p0[0]) * t;
    const cp1y = p1[1] + (p2[1] - p0[1]) * t;
    const cp2x = p2[0] - (p3[0] - p1[0]) * t;
    const cp2y = p2[1] - (p3[1] - p1[1]) * t;
    cmd.push(`C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`);
  }
  const linePath = cmd.join(' ');
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  const fillPath = `${linePath} L ${lastX.toFixed(2)} ${H} L 0 ${H} Z`;
  return { linePath, fillPath, lastX, lastY, ys, min: lo, max: hi };
}

// ─── Sparkline — compact inline chart ────────────────────────────
function Sparkline({ seed, sign = 1, width = 64, height = 22, color }) {
  const path = React.useMemo(() => makeWalk(String(seed), {
    W: 80, H: 40, N: 60,
    drift: sign >= 0 ? 0.10 : -0.10,
    vol: 0.85, jumps: 3, jumpSize: 1.8,
    mr: 0.01, targetEnd: sign >= 0 ? -14 : 14, // positive sign → ends higher (lower y)
    startY: 22, spline: 0.15,
  }), [seed, sign]);
  const stroke = color || (sign >= 0 ? 'var(--pos)' : 'var(--neg)');
  return (
    <svg width={width} height={height} viewBox="0 0 80 40" preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}>
      <path d={path.linePath} fill="none" stroke={stroke}
        strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// ─── Chart — larger version with fill + dotted midline + end dot ──
function Chart({ seed, sign = 1, height = 110, color, fillOpacity = 0.10 }) {
  const path = React.useMemo(() => makeWalk(String(seed), {
    W: 80, H: 100, N: 220,
    drift: sign >= 0 ? 0.020 : -0.018,
    vol: 1.45, jumps: 12, jumpSize: 4.0,
    mr: 0.008, targetEnd: sign >= 0 ? -22 : 18,
    startY: sign >= 0 ? 62 : 42, spline: 0.10,
  }), [seed, sign]);
  const stroke = color || (sign >= 0 ? 'var(--pos)' : 'var(--neg)');
  const fillId = 'ch_' + String(seed).replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox="0 0 80 100" preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={fillOpacity}/>
          <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <line x1="0" x2="80" y1="50" y2="50" stroke="rgba(255,255,255,0.10)"
        strokeWidth="0.4" strokeDasharray="0.8 0.8"/>
      <path d={path.fillPath} fill={`url(#${fillId})`}/>
      <path d={path.linePath} fill="none" stroke={stroke}
        strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"
        vectorEffect="non-scaling-stroke"/>
      <circle cx={path.lastX} cy={path.lastY} r="1.8" fill={stroke}
        stroke="var(--surface-1)" strokeWidth="0.6" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

// ─── Return — seeded plausible % for 3/6/12mo periods ─────────────
// Returns a stable, sign-biased number based on a seed string.
function seededReturn(seedStr, range = [-8, 8]) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  const r = ((h >>> 0) % 10000) / 10000;
  return range[0] + r * (range[1] - range[0]);
}

Object.assign(window, {
  Icon, Bar, Pill, Card, Button, AssetGlyph, BasketGlyph,
  Sheet, FieldRow, Header, Spacer, NumPad, MoneyDisplay,
  SegControl, TimeRange, ToastHost, useToast, SectionTitle, LiveDot,
  Delta, DeltaEur, brandFor,
  makeWalk, Sparkline, Chart, seededReturn,
});
