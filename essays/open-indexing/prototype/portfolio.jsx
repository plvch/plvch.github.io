// portfolio.jsx — Portfolio screen, TR-influenced visual language.
// Exposes: window.PortfolioScreen

(() => {
  const { useState: PU, useMemo: PM } = React;

  // ─── Sparkline / area chart for the portfolio header ────────────
  // Seeded stochastic walk — looks like real intraday price data.
  // Memoized so it doesn't re-roll when prices tick.
  function HeaderChart({ delta, height = 130 }) {
    const path = PM(() => {
      // Mulberry32 PRNG, seeded so the curve is stable across renders.
      const seedBase = (delta >= 0 ? 0x9E3779B9 : 0x6C8E9CF5) ^ 0xA1B2C3D4;
      let s = seedBase >>> 0;
      const rand = () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const gauss = () => {
        // Box–Muller, but truncated to avoid wild outliers
        let u = 0, v = 0;
        while (u === 0) u = rand();
        while (v === 0) v = rand();
        const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return Math.max(-3, Math.min(3, g));
      };

      const W = 80, H = 100;
      const N = 260;
      const driftPerStep = (delta >= 0 ? 0.018 : -0.016);
      const vol = 1.65;

      const ys = [];
      let y = 52;
      // Many small jumps — feels like noisy intraday flow
      const jumpAt = new Set();
      for (let k = 0; k < 14; k++) jumpAt.add(Math.floor(rand() * N));
      // Very weak mean reversion so it can wander
      for (let i = 0; i <= N; i++) {
        const target = 50 + (i / N - 0.4) * (delta >= 0 ? 12 : -10);
        const mr = (target - y) * 0.006;
        let step = gauss() * vol + driftPerStep + mr;
        if (jumpAt.has(i)) step += (gauss()) * 4.5;
        y = Math.max(8, Math.min(92, y + step));
        ys.push(y);
      }

      // Catmull-Rom → cubic Bézier for organic curvature
      const xs = ys.map((_, i) => (i / N) * W);
      const cmd = [];
      cmd.push(`M ${xs[0].toFixed(2)} ${ys[0].toFixed(2)}`);
      for (let i = 0; i < ys.length - 1; i++) {
        const p0 = i === 0 ? [xs[0], ys[0]] : [xs[i - 1], ys[i - 1]];
        const p1 = [xs[i], ys[i]];
        const p2 = [xs[i + 1], ys[i + 1]];
        const p3 = i + 2 < ys.length ? [xs[i + 2], ys[i + 2]] : p2;
        // tension 0 = Catmull-Rom; lower so chaotic motion stays visible
        const t = 0.10;
        const cp1x = p1[0] + (p2[0] - p0[0]) * t;
        const cp1y = p1[1] + (p2[1] - p0[1]) * t;
        const cp2x = p2[0] - (p3[0] - p1[0]) * t;
        const cp2y = p2[1] - (p3[1] - p1[1]) * t;
        cmd.push(`C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`);
      }
      const linePath = cmd.join(' ');
      const lastX = xs[xs.length - 1];
      const fillPath = `${linePath} L ${lastX.toFixed(2)} 100 L 0 100 Z`;
      const lastY = ys[ys.length - 1];
      return { linePath, fillPath, lastX, lastY };
    }, [delta >= 0]);

    const stroke = 'var(--accent)';
    const fillId = 'hc_' + (delta >= 0 ? 'up' : 'dn');
    return (
      <svg viewBox="0 0 80 100" preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.10"/>
            <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
          </linearGradient>
          <pattern id="dotline" x="0" y="0" width="2" height="1" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1" height="1" fill="rgba(255,255,255,0.18)"/>
          </pattern>
        </defs>
        <line x1="0" x2="80" y1="50" y2="50" stroke="url(#dotline)" strokeWidth="0.4" strokeDasharray="0.8 0.8"/>
        <path d={path.fillPath} fill={`url(#${fillId})`}/>
        <path d={path.linePath} fill="none" stroke={stroke} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
        {/* End dot — current price marker */}
        <circle cx={path.lastX} cy={path.lastY} r="2" fill={stroke} vectorEffect="non-scaling-stroke" stroke="var(--bg)" strokeWidth="0.4"/>
      </svg>
    );
  }

  // Mini stack — colored segments showing weights, brand-colored
  function WeightStack({ composition, instById, mode = 'target' }) {
    const total = composition.reduce((s, c) => s + (c.weight_pct || 0), 0) || 1;
    return (
      <div style={{
        display: 'flex', gap: 1, height: 4, borderRadius: 99, overflow: 'hidden',
        background: 'var(--bar-bg)',
      }}>
        {composition.map((c, i) => {
          const inst = instById[c.instrument_id];
          if (!inst) return null;
          const brand = brandFor(inst.ticker, inst.type);
          const pct = (c.weight_pct || 0) / total * 100;
          return (
            <div key={c.instrument_id} style={{
              width: `${Math.max(0.5, pct)}%`,
              background: mode === 'real' ? brand.bg : `oklch(0.55 0.05 ${(i * 47) % 360})`,
              opacity: mode === 'real' ? 0.95 : 0.55,
              transition: 'width 380ms ease',
            }}/>
          );
        })}
      </div>
    );
  }

  // ─── Active basket card ─────────────────────────────────────────
  function ActiveBasketCard({ basket, store, onTap }) {
    const value = store.valueOfBasket(basket.id);
    const delta = store.dailyDeltaOfBasket(basket.id);
    const invested = store.investedOfBasket(basket.id);
    const totalReturn = value - invested;
    const trPct = invested > 0 ? (totalReturn / invested) * 100 : 0;
    const plan = store.planByBasket[basket.id];

    return (
      <div onClick={onTap} className="bb-tap" style={{
        background: 'var(--surface-1)', borderRadius: 14, padding: 16,
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <BasketGlyph glyph={basket.glyph} size={40}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{basket.name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-mid)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
              <span>{basket.composition.length} Werte</span>
              {plan && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-faint)' }}/>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="repeat" size={11}/>
                    {plan.amount_eur}&nbsp;€ {plan.frequency === 'monthly' ? 'monatl.' : plan.frequency}
                  </span>
                </>
              )}
            </div>
          </div>
          <Sparkline seed={basket.id} sign={trPct >= 0 ? 1 : -1} width={92} height={32}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <MoneyDisplay amount={value} mid/>
          <div style={{ textAlign: 'right' }}>
            <DeltaEur value={delta} size={14} weight={600}/>
            <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
              {trPct >= 0 ? '+' : '−'}{Math.abs(trPct).toFixed(2).replace('.', ',')}&nbsp;% ges.
            </div>
          </div>
        </div>

        <WeightStack composition={basket.composition} instById={store.instById} mode="real"/>
      </div>
    );
  }

  // ─── Weighted basket card ───────────────────────────────────────
  function WeightedBasketCard({ basket, store, onTap, onStartSaving }) {
    return (
      <div onClick={onTap} className="bb-tap" style={{
        background: 'var(--surface-1)', borderRadius: 14, padding: 16,
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <BasketGlyph glyph={basket.glyph} size={40}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{basket.name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
              Gewichtet · 0,00&nbsp;€ investiert
            </div>
          </div>
        </div>
        <WeightStack composition={basket.composition} instById={store.instById} mode="target"/>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button variant="primary" size="md" icon="repeat" style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onStartSaving(); }}>
            Sparplan starten
          </Button>
          <Button variant="secondary" size="md" onClick={onTap}>
            Ansehen
          </Button>
        </div>
      </div>
    );
  }

  // ─── Passive basket card ────────────────────────────────────────
  function PassiveBasketCard({ basket, store, onTap, onSetWeights }) {
    const isFav = basket.is_default_favourites;
    return (
      <div onClick={onTap} className="bb-tap" style={{
        background: 'var(--surface-1)', borderRadius: 14, padding: 16,
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <BasketGlyph glyph={basket.glyph} size={40}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{basket.name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
              {basket.composition.length} Werte · keine Gewichtung
            </div>
          </div>
        </div>
        {/* Striped empty bar */}
        <div style={{ height: 4, borderRadius: 99, background: 'var(--bar-bg)', marginBottom: 14, position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,0.06) 6px 7px)',
            borderRadius: 99,
          }}/>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="md" style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onSetWeights(); }}>
            Gewichtung festlegen
          </Button>
          <Button variant="ghost" size="md" onClick={onTap}>
            Ansehen
          </Button>
        </div>
      </div>
    );
  }

  // ─── Ghost basket card ──────────────────────────────────────────
  function GhostBasketCard({ ghost, onClaim }) {
    return (
      <div onClick={onClaim} className="bb-tap ghost-sweep" style={{
        background: 'transparent',
        border: '1px dashed #1F1F23',
        borderRadius: 14, padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
      }}>
        <BasketGlyph glyph={ghost.glyph} size={36} dim/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-mid)' }}>{ghost.name}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginTop: 2 }}>
            {ghost.desc}
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 99,
          border: '1px dashed #2A2A2F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg-faint)',
        }}>
          <Icon name="plus" size={14}/>
        </div>
      </div>
    );
  }

  // ─── Standalone position list row — TR-style ────────────────────
  function StandalonePositionRow({ position, store }) {
    const inst = store.instById[position.instrument_id];
    if (!inst) return null;
    const value = position.quantity * inst.price;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <AssetGlyph ticker={inst.ticker} type={inst.type} size={40}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
          <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
            {position.quantity.toFixed(4).replace('.', ',')} · {inst.ticker}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="num" style={{ fontSize: 15, fontWeight: 500 }}>{fmtEur(value)}</div>
          <Delta value={inst.chg} size={12} weight={500} style={{ marginTop: 2 }}/>
        </div>
      </div>
    );
  }

  // ─── Portfolio screen ───────────────────────────────────────────
  function PortfolioScreen({ navigate }) {
    const store = useStore();
    const [createOpen, setCreateOpen] = PU(false);
    const [range, setRange] = PU('1T');

    const grouped = PM(() => {
      const out = { active: [], weighted: [], passive: [] };
      store.baskets.forEach(b => {
        const s = store.stateOf(b);
        if (s === 'active') out.active.push(b);
        else if (s === 'weighted') out.weighted.push(b);
        else if (s === 'passive') out.passive.push(b);
      });
      out.passive.sort((a, b) => (a.is_default_favourites ? 1 : 0) - (b.is_default_favourites ? 1 : 0));
      return out;
    }, [store.baskets, store.positions]);

    const remainingGhosts = store.ghosts.filter(g => !store.claimedGhostIds.includes(g.id));
    const standalonePositions = store.positions.filter(p => p.basket_id === null);

    const totalDelta = store.totalDailyDelta;
    const totalDeltaPct = store.totalInvestedAssets > 0
      ? (totalDelta / store.totalInvestedAssets) * 100 : 0;

    return (
      <div className="page bb-screen" style={{ height: '100%', overflow: 'auto', paddingBottom: 120 }}>
        {/* Top utility row — small, TR-like (no big logo) */}
        <div style={{
          padding: '8px 20px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'var(--brand-mark-bg)', color: 'var(--brand-mark-fg)',
              fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)',
              letterSpacing: -1,
            }}>b</span>
            <span style={{ fontSize: 13, color: 'var(--fg-mid)', fontWeight: 500 }}>Open Index Broker</span>
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle/>
          <button className="bb-tap" onClick={() => navigate('profile')} style={{
            width: 32, height: 32, borderRadius: 99, border: 'none',
            background: 'var(--surface-2)', color: 'var(--fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>{store.account.name[0]}</button>
        </div>
        </div>

        {/* ── Hero: large title + total value ── */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>Portfolio</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--fg-dim)', letterSpacing: -0.6, lineHeight: 1 }}>Cash</div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--fg-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Insgesamt <LiveDot size={5} color="var(--fg-faint)"/>
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <MoneyDisplay amount={store.totalValue} big/>
            <Delta value={totalDeltaPct} size={15} weight={600}/>
          </div>
        </div>

        {/* Chart */}
        <div style={{ marginTop: 12 }}>
          <HeaderChart delta={totalDelta} height={130}/>
        </div>

        {/* Time-range scrubber */}
        <div style={{ padding: '4px 20px 0' }}>
          <TimeRange value={range} onChange={setRange}/>
        </div>

        <Spacer h={8}/>

        {/* ── Active baskets ── */}
        {grouped.active.length > 0 && (
          <>
            <SectionTitle right={`${grouped.active.length} aktiv`}>Investments</SectionTitle>
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped.active.map(b => (
                <ActiveBasketCard key={b.id} basket={b} store={store}
                  onTap={() => navigate('basket', { basketId: b.id })}/>
              ))}
            </div>
          </>
        )}

        {/* ── Weighted (inactive) ── */}
        {grouped.weighted.length > 0 && (
          <>
            <SectionTitle right="Bereit zum Sparen">Gewichtet</SectionTitle>
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped.weighted.map(b => (
                <WeightedBasketCard key={b.id} basket={b} store={store}
                  onTap={() => navigate('basket', { basketId: b.id })}
                  onStartSaving={() => navigate('savings', { basketId: b.id })}/>
              ))}
            </div>
          </>
        )}

        {/* ── Passive ── */}
        {grouped.passive.length > 0 && (
          <>
            <SectionTitle right="Ohne Gewichtung">Passiv</SectionTitle>
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped.passive.map(b => (
                <PassiveBasketCard key={b.id} basket={b} store={store}
                  onTap={() => navigate('basket', { basketId: b.id })}
                  onSetWeights={() => navigate('weights', { basketId: b.id })}/>
              ))}
            </div>
          </>
        )}

        {/* ── Ghost ideas ── */}
        {remainingGhosts.length > 0 && (
          <>
            <SectionTitle right="Antippen zum Übernehmen">Mehr Index-Ideen</SectionTitle>
            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {remainingGhosts.map(g => (
                <GhostBasketCard key={g.id} ghost={g}
                  onClaim={() => navigate('claimGhost', { ghostId: g.id })}/>
              ))}
            </div>
          </>
        )}

        {/* ── Create custom basket ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <button className="bb-tap" onClick={() => setCreateOpen(true)} style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: '1px dashed #2A2A2F', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--fg-mid)', fontWeight: 500, fontSize: 14,
          }}>
            <Icon name="plus" size={16}/> Eigenen Index erstellen
          </button>
        </div>

        {/* ── Ungrouped positions ── */}
        {standalonePositions.length > 0 && (
          <>
            <SectionTitle right={`${standalonePositions.length} Werte`}>Ungruppiert</SectionTitle>
            <div style={{ margin: '0 20px', background: 'var(--surface-1)', borderRadius: 14, overflow: 'hidden' }}>
              {standalonePositions.map((p, i) => (
                <div key={p.id} style={{ borderBottom: i < standalonePositions.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <StandalonePositionRow position={p} store={store}/>
                </div>
              ))}
            </div>
          </>
        )}

        <Spacer h={40}/>

        <CreateBasketSheet open={createOpen} onClose={() => setCreateOpen(false)}
          onCreate={(name) => {
            const b = store.createBasket(name);
            setCreateOpen(false);
            navigate('basket', { basketId: b.id });
          }}/>
      </div>
    );
  }

  function CreateBasketSheet({ open, onClose, onCreate }) {
    const [name, setName] = PU('');
    PU(() => { if (!open) setName(''); }, [open]);
    return (
      <Sheet open={open} onClose={onClose} title="Neuer Index">
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ fontSize: 13, color: 'var(--fg-mid)', marginBottom: 8 }}>Name</div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="z. B. Langfristiger Kern"
            style={{
              width: '100%', height: 48, background: 'var(--surface-2)',
              border: 'none', borderRadius: 12, color: 'var(--fg)',
              padding: '0 14px', fontSize: 16, outline: 'none',
            }}/>
          <Spacer h={16}/>
          <Button variant="primary" size="lg" disabled={!name.trim()} style={{ width: '100%' }}
            onClick={() => onCreate(name.trim())}>
            Leeren Basket erstellen
          </Button>
          <Spacer h={8}/>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', textAlign: 'center', lineHeight: 1.5 }}>
            Du startest passiv — Werte hinzufügen, dann Gewichtung festlegen.
          </div>
        </div>
      </Sheet>
    );
  }

  Object.assign(window, { PortfolioScreen });
})();

// ─── Theme toggle button — sun/moon icon, animated swap ──────────
function ThemeToggle() {
  const { theme, toggle } = useThemeCtx ? useThemeCtx() : { theme: 'dark', toggle: () => {} };
  const isDark = theme === 'dark';
  return (
    <button onClick={toggle} className="bb-tap"
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        width: 32, height: 32, borderRadius: 99, border: 'none',
        background: 'var(--surface-2)', color: 'var(--fg-mid)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 380ms cubic-bezier(.2,.9,.2,1), opacity 240ms ease',
        transform: isDark ? 'translateY(0) rotate(0deg)' : 'translateY(-30px) rotate(45deg)',
        opacity: isDark ? 1 : 0,
      }}>
        <Icon name="moon" size={15}/>
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 380ms cubic-bezier(.2,.9,.2,1), opacity 240ms ease',
        transform: isDark ? 'translateY(30px) rotate(-45deg)' : 'translateY(0) rotate(0deg)',
        opacity: isDark ? 0 : 1,
      }}>
        <Icon name="sun" size={15}/>
      </div>
    </button>
  );
}

window.ThemeToggle = ThemeToggle;
