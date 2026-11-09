// basket-detail.jsx — basket detail screen, renders by lifecycle state.
// TR-style: pure white primary, triangle deltas, big numbers, no accent tints.
// Exposes: window.BasketDetailScreen

(() => {
  const { useState: BU, useMemo: BM } = React;

  // ─── Return period tiles (3M / 6M / 12M) ────────────────────────
  // Each period has its own sign story so the row reads with visible variety:
  // recent (3M) often opposite to the long-term trend; 6M & 12M follow the all-time sign.
  function ReturnPeriods({ basketId, totalPct }) {
    const total = totalPct >= 0 ? 1 : -1;
    const periods = [
      // 3M: counter-trend — recent dip if long-term is up, or recent bounce if long-term is down
      { key: '3M',  label: '3 Mon.',  sign: -total, mag: [1.0, 4.5] },
      // 6M: with the trend, modest
      { key: '6M',  label: '6 Mon.',  sign: total,  mag: [3.0, 9.0] },
      // 12M: with the trend, larger
      { key: '12M', label: '12 Mon.', sign: total,  mag: [8.0, 22.0] },
    ];
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8, marginTop: 18,
      }}>
        {periods.map(p => {
          const mag = seededReturn(basketId + ':' + p.key, p.mag);
          const v = mag * p.sign;
          const pos = v >= 0;
          return (
            <div key={p.key} style={{
              background: 'var(--surface-1)', borderRadius: 12,
              padding: '12px 12px 14px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--fg-mid)', fontWeight: 500 }}>{p.label}</div>
              <div className="num" style={{
                marginTop: 6, fontSize: 18, fontWeight: 600,
                color: pos ? 'var(--pos)' : 'var(--neg)',
                letterSpacing: -0.3,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Icon name={pos ? 'triUp' : 'triDn'} size={12} color={pos ? 'var(--pos)' : 'var(--neg)'}/>
                {Math.abs(v).toFixed(2).replace('.', ',')}&nbsp;%
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function StatusRow({ icon, label, value, sub, onClick }) {
    return (
      <div onClick={onClick} className={onClick ? 'bb-tap' : ''} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: 'var(--surface-1)',
        borderRadius: 14,
        cursor: onClick ? 'pointer' : 'default',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg)',
        }}>
          <Icon name={icon} size={16}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--fg-mid)' }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 1 }}>{sub}</div>}
        </div>
        {onClick && <Icon name="chevR" size={16} color="var(--fg-faint)"/>}
      </div>
    );
  }

  // ─── Composition row ────────────────────────────────────────────
  function CompositionRow({ comp, basket, store, state, position, last, onTap }) {
    const inst = store.instById[comp.instrument_id];
    if (!inst) return null;
    const value = position ? position.quantity * inst.price : 0;
    const totalValue = state === 'active' ? store.valueOfBasket(basket.id) || 1 : 0;
    const actualPct = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const target = comp.weight_pct || 0;
    const drift = state === 'active' ? actualPct - target : 0;
    const isActive = state === 'active' && position;

    return (
      <div
        onClick={isActive ? onTap : undefined}
        className={isActive ? 'bb-tap' : ''}
        style={{
          padding: '14px 0',
          borderBottom: last ? 'none' : '1px solid var(--line-soft)',
          cursor: isActive ? 'pointer' : 'default',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AssetGlyph ticker={inst.ticker} type={inst.type} size={36}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {inst.name}
              </div>
              {state === 'active' ? (
                <div className="num" style={{ fontSize: 14, fontWeight: 500 }}>{fmtEur(value)}</div>
              ) : (
                <div className="num" style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 500 }}>
                  {state === 'passive' ? '0\u00A0%' : `${target}\u00A0%`}
                </div>
              )}
            </div>
            <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
              <span>{inst.ticker} · {fmtEur(inst.price)}</span>
              {state === 'active' && (
                <span style={{ display: 'inline-flex', gap: 8 }}>
                  <span>{actualPct.toFixed(1).replace('.', ',')}&nbsp;%</span>
                  {Math.abs(drift) > 0.5 && (
                    <Delta value={drift} decimals={1} suffix="" size={12}/>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, marginLeft: 48 }}>
          <Bar value={state === 'active' ? actualPct : (state === 'weighted' ? target : 0)}
                mode={state === 'active' ? 'real' : (state === 'weighted' ? 'target' : 'empty')}/>
        </div>
        {state === 'active' && position && (
          <div className="num" style={{ marginTop: 8, marginLeft: 48, fontSize: 11, color: 'var(--fg-dim)', display: 'flex', gap: 14 }}>
            <span>{position.quantity.toFixed(4).replace('.', ',')} St.</span>
            <span>Ø {fmtEur(position.avg_purchase_price)}</span>
          </div>
        )}
      </div>
    );
  }

  // ─── Position sheet — per-instrument actions ────────────────────
  // Honors the buy-only-at-basket-level / sell-at-individual-level principle.
  function PositionSheet({ open, onClose, position, basket, store, navigate }) {
    const toast = useToast();
    if (!open || !position) return null;
    const inst = store.instById[position.instrument_id];
    if (!inst) return null;
    const value = position.quantity * inst.price;
    const totalCost = position.total_invested;
    const pl = value - totalCost;
    const plPct = totalCost > 0 ? (pl / totalCost) * 100 : 0;
    const dailyDelta = value * (inst.chg / 100);

    return (
      <Sheet open={open} onClose={onClose}>
        <div style={{ padding: '4px 20px 20px' }}>
          {/* Instrument header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <AssetGlyph ticker={inst.ticker} type={inst.type} size={44}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{inst.name}</div>
              <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
                {inst.ticker} · {fmtEur(inst.price)}
              </div>
            </div>
            <Delta value={inst.chg} size={13} weight={600}/>
          </div>

          {/* Position stats */}
          <div style={{
            marginTop: 18, padding: 14, background: 'var(--surface-0)', borderRadius: 12,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
          }}>
            <Stat label="Wert" value={fmtEur(value)}/>
            <Stat label="Investiert" value={fmtEur(totalCost)} dim/>
            <Stat label="Anteile" value={position.quantity.toFixed(4).replace('.', ',')} dim/>
            <Stat label="Ø Kaufpreis" value={fmtEur(position.avg_purchase_price)} dim/>
            <Stat label="Heute"
              value={<DeltaEur value={dailyDelta} size={14} weight={600}/>}/>
            <Stat label="Gewinn / Verlust"
              value={
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: pl >= 0 ? 'var(--pos)' : 'var(--neg)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {pl >= 0 ? '+' : '−'}{fmtEur(Math.abs(pl))} · {Math.abs(plPct).toFixed(2).replace('.', ',')}&nbsp;%
                </span>
              }/>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" size="lg" icon="bag"
              onClick={() => {
                onClose();
                navigate('sell', { positionId: position.id });
              }}>Verkaufen</Button>
            <Button variant="secondary" size="md"
              onClick={() => {
                store.unlinkPosition(position.id);
                toast('Position aus Index entfernt');
                onClose();
              }}>Aus Index entfernen</Button>
          </div>

          {/* Footnote — design principle */}
          <div style={{
            marginTop: 16, padding: '12px 14px', background: 'var(--surface-0)',
            borderRadius: 10, fontSize: 11, color: 'var(--fg-mid)', lineHeight: 1.55,
          }}>
            Verkäufe sind steuerrelevant — daher pro Position, nicht pro Index.
            „Aus Index entfernen" behält die Position, löst sie nur aus der Gruppierung.
          </div>
        </div>
      </Sheet>
    );
  }

  function Stat({ label, value, dim }) {
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--fg-mid)', fontWeight: 500 }}>{label}</div>
        <div style={{
          marginTop: 4, fontSize: 14, fontWeight: 500,
          color: dim ? 'var(--fg-mid)' : 'var(--fg)',
          fontVariantNumeric: 'tabular-nums',
        }}>{value}</div>
      </div>
    );
  }

  function BasketDetailScreen({ navigate, params, goBack }) {
    const store = useStore();
    const basket = store.basketById[params.basketId];
    const [editName, setEditName] = BU(false);
    const [nameDraft, setNameDraft] = BU(basket ? basket.name : '');
    const [editing, setEditing] = BU(false);
    const [activePosition, setActivePosition] = BU(null);

    if (!basket) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-mid)' }}>
          Index nicht gefunden.
        </div>
      );
    }

    const state = store.stateOf(basket);
    const value = store.valueOfBasket(basket.id);
    const invested = store.investedOfBasket(basket.id);
    const delta = store.dailyDeltaOfBasket(basket.id);
    const totalReturn = value - invested;
    const trPct = invested > 0 ? (totalReturn / invested) * 100 : 0;
    const plan = store.planByBasket[basket.id];

    const positionsByInstr = BM(() => {
      const m = {};
      store.positions.forEach(p => {
        if (p.basket_id === basket.id) m[p.instrument_id] = p;
      });
      return m;
    }, [store.positions, basket.id]);

    const composition = basket.composition;

    const stateLabel = {
      passive: 'Passiv', weighted: 'Gewichtet', active: 'Aktiv',
    }[state];

    return (
      <div className="page bb-screen" style={{ height: '100%', overflow: 'auto', paddingBottom: 24 }}>
        <Header
          left={
            <button className="bb-tap" onClick={goBack} style={{
              width: 36, height: 36, borderRadius: 99, border: 'none',
              background: 'transparent', color: 'var(--fg)',
            }}><Icon name="chevL" size={20}/></button>
          }
          title=""
          right={
            <button className="bb-tap" onClick={() => setEditing(true)} style={{
              width: 36, height: 36, borderRadius: 99, border: 'none',
              background: 'transparent', color: 'var(--fg-mid)',
            }}><Icon name="edit" size={18}/></button>
          }
        />

        {/* ── Hero block ── */}
        <div style={{ padding: '4px 20px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <BasketGlyph glyph={basket.glyph} size={48}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editName ? (
                <input autoFocus
                  value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                  onBlur={() => { store.renameBasket(basket.id, nameDraft.trim() || basket.name); setEditName(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 22, fontWeight: 700, color: 'var(--fg)', letterSpacing: -0.4,
                    borderBottom: '1px solid var(--fg)',
                    padding: '0 0 4px',
                  }}/>
              ) : (
                <div onClick={() => !basket.is_default_favourites && (setNameDraft(basket.name), setEditName(true))}
                  style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.1 }}>
                  {basket.name}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 12, color: 'var(--fg-mid)' }}>
                <span>{stateLabel}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-faint)' }}/>
                <span>{basket.composition.length} Werte</span>
              </div>
            </div>
          </div>

          {state === 'active' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg-mid)' }}>Insgesamt</div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <MoneyDisplay amount={value} mid/>
                <Delta value={trPct} size={14} weight={600}/>
              </div>
              <div className="num" style={{ marginTop: 10, fontSize: 13, display: 'flex', gap: 16, color: 'var(--fg-mid)' }}>
                <span>
                  <DeltaEur value={delta} size={13}/>
                  <span style={{ marginLeft: 4 }}>heute</span>
                </span>
                <span>Investiert {fmtEur(invested)}</span>
              </div>

              {/* Performance chart */}
              <div style={{ margin: '18px -20px 0' }}>
                <Chart seed={basket.id} sign={trPct >= 0 ? 1 : -1} height={120}/>
              </div>

              {/* 3 / 6 / 12 mo return tiles */}
              <ReturnPeriods basketId={basket.id} totalPct={trPct}/>
            </div>
          )}

          {state === 'weighted' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg-mid)' }}>Gesamt investiert</div>
              <div style={{ marginTop: 6 }}>
                <MoneyDisplay amount={0} mid dim/>
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-mid)', marginTop: 10, lineHeight: 1.5 }}>
                Bereit zum Sparen. Sparplan starten oder einmalig kaufen.
              </div>
            </div>
          )}

          {state === 'passive' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--fg-mid)', lineHeight: 1.5 }}>
                {basket.is_default_favourites
                  ? 'Deine Favoriten. Lege Gewichtung fest, um daraus einen finanzierbaren Basket zu machen.'
                  : 'Werte hinzufügen und Gewichtung festlegen, um den Basket finanzierbar zu machen.'}
              </div>
            </div>
          )}
        </div>

        <Spacer h={20}/>

        {/* ── Status / plan row ── */}
        <div style={{ padding: '0 20px' }}>
          {state === 'active' && plan && (
            <StatusRow
              icon="repeat"
              label="Sparplan"
              value={`${fmtEur(plan.amount_eur, { decimals: 0 })} jeden Monat`}
              sub={`Nächste am ${plan.execution_day}. · automatisch`}
              onClick={() => navigate('savings', { basketId: basket.id })}
            />
          )}
          {state === 'active' && !plan && (
            <StatusRow
              icon="repeat"
              label="Kein Sparplan"
              value="Starte einen, um automatisch nachzukaufen"
              onClick={() => navigate('savings', { basketId: basket.id })}
            />
          )}
          {state === 'weighted' && (
            <StatusRow
              icon="repeat"
              label="Kein Sparplan"
              value="Sparplan empfohlen — aktiviert den Basket"
              onClick={() => navigate('savings', { basketId: basket.id })}
            />
          )}
        </div>

        {/* ── Composition list ── */}
        <SectionTitle right={state === 'weighted' ? 'Zielgewichtung' : (state === 'active' ? 'Bestand' : `${composition.length} hinzugefügt`)}>
          Zusammensetzung
        </SectionTitle>
        <div style={{ margin: '0 20px', padding: '0 16px', background: 'var(--surface-1)', borderRadius: 14 }}>
          {composition.map((c, i) => (
            <CompositionRow key={c.instrument_id} comp={c} basket={basket} store={store} state={state}
              position={positionsByInstr[c.instrument_id]} last={i === composition.length - 1}
              onTap={() => setActivePosition(positionsByInstr[c.instrument_id])}/>
          ))}
          {composition.length === 0 && (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--fg-dim)', fontSize: 14 }}>
              Noch keine Werte — füge welche aus der Suche hinzu.
            </div>
          )}
        </div>

        {state === 'passive' && (
          <>
            <Spacer h={12}/>
            <div style={{ padding: '0 20px' }}>
              <button className="bb-tap" onClick={() => navigate('search', { addToBasketId: basket.id })} style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: '1px dashed #2A2A2F', background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: 'var(--fg-mid)', fontWeight: 500, fontSize: 14,
              }}>
                <Icon name="plus" size={16}/> Werte hinzufügen
              </button>
            </div>
          </>
        )}

        <Spacer h={20}/>

        {/* ── CTA bar (inline — scrolls with content) ── */}
        <div style={{ padding: '0 20px 28px' }}>
          {state === 'passive' && (
            <Button variant="primary" size="lg" style={{ width: '100%' }}
              disabled={composition.length === 0}
              onClick={() => navigate('weights', { basketId: basket.id })}>
              {composition.length === 0 ? 'Erst Werte hinzufügen' : 'Gewichtung festlegen'}
            </Button>
          )}
          {state === 'weighted' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="primary" size="lg" icon="repeat" style={{ width: '100%' }}
                onClick={() => navigate('savings', { basketId: basket.id })}>
                Sparplan starten
              </Button>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="secondary" size="md" style={{ flex: 1 }}
                  onClick={() => navigate('buy', { basketId: basket.id })}>
                  Einmalig kaufen
                </Button>
                <Button variant="ghost" size="md" style={{ flex: 1 }}
                  onClick={() => navigate('weights', { basketId: basket.id })}>
                  Gewichte ändern
                </Button>
              </div>
            </div>
          )}
          {state === 'active' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="primary" size="lg" icon={plan ? 'edit' : 'repeat'} style={{ flex: 2 }}
                onClick={() => navigate('savings', { basketId: basket.id })}>
                {plan ? 'Sparplan bearbeiten' : 'Sparplan starten'}
              </Button>
              <Button variant="secondary" size="lg" style={{ flex: 1 }}
                onClick={() => navigate('buy', { basketId: basket.id })}>
                Mehr kaufen
              </Button>
            </div>
          )}
        </div>

        {/* Edit composition sheet */}
        <EditCompositionSheet open={editing} onClose={() => setEditing(false)}
          basket={basket} store={store}
          onAdd={() => { setEditing(false); navigate('search', { addToBasketId: basket.id }); }}
          onEditWeights={() => { setEditing(false); navigate('weights', { basketId: basket.id }); }}/>

        {/* Per-position action sheet */}
        <PositionSheet open={!!activePosition} onClose={() => setActivePosition(null)}
          position={activePosition} basket={basket} store={store} navigate={navigate}/>
      </div>
    );
  }

  function EditCompositionSheet({ open, onClose, basket, store, onAdd, onEditWeights }) {
    if (!open) return null;
    return (
      <Sheet open={open} onClose={onClose} title="Index bearbeiten">
        <div style={{ padding: '8px 20px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <Button variant="secondary" size="md" icon="plus" onClick={onAdd}>Werte hinzufügen</Button>
            <Button variant="secondary" size="md" icon="edit" onClick={onEditWeights}>Gewichte bearbeiten</Button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', padding: '4px 0 8px' }}>Aus Index entfernen</div>
          <div>
            {basket.composition.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--fg-dim)', fontSize: 14 }}>
                Noch nichts in diesem Index.
              </div>
            )}
            {basket.composition.map(c => {
              const inst = store.instById[c.instrument_id];
              if (!inst) return null;
              return (
                <div key={c.instrument_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--line-soft)',
                }}>
                  <AssetGlyph ticker={inst.ticker} type={inst.type} size={32}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{inst.ticker}</div>
                  </div>
                  <button className="bb-tap" onClick={() => store.removeFromBasket(basket.id, c.instrument_id)} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--surface-2)', border: 'none', color: 'var(--neg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="trash" size={14}/>
                  </button>
                </div>
              );
            })}
          </div>
          <Spacer h={8}/>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)', textAlign: 'center' }}>
            Änderungen wirken nur auf zukünftige Käufe — vorhandene Positionen bleiben unberührt.
          </div>
        </div>
      </Sheet>
    );
  }

  Object.assign(window, { BasketDetailScreen });
})();
