// flows.jsx — Set Weights, Savings, Buy, Search, Activity, Claim, BuySuccess
// TR-influenced visual language: pure black, white primary, triangle deltas,
// big de-DE numbers, no mint accents, brand-colored asset tiles.

(() => {
  const { useState: FU, useEffect: FE, useMemo: FM, useRef: FR } = React;

  const sum = (arr) => arr.reduce((s, x) => s + (x || 0), 0);
  const ord = (d) => `${d}.`; // German ordinal

  // ─── Set Weights screen ─────────────────────────────────────────
  function WeightsScreen({ navigate, params, goBack }) {
    const store = useStore();
    const basket = store.basketById[params.basketId];

    const initial = FM(() => {
      const out = {};
      const n = basket.composition.length;
      const equal = n > 0 ? Math.floor(100 / n) : 0;
      const remainder = 100 - equal * n;
      basket.composition.forEach((c, i) => {
        out[c.instrument_id] = c.weight_pct > 0
          ? c.weight_pct
          : equal + (i === 0 ? remainder : 0);
      });
      return out;
    }, [basket.id]);

    const [weights, setWeights] = FU(initial);
    const [equalSplitTick, setEqualSplitTick] = FU(0);

    const total = sum(Object.values(weights));
    const valid = total === 100;

    const setWeight = (id, val) => {
      let v = parseFloat(val);
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(100, Math.round(v)));
      setWeights(w => ({ ...w, [id]: v }));
    };

    const equalSplit = () => {
      const n = basket.composition.length;
      const equal = Math.floor(100 / n);
      const rem = 100 - equal * n;
      const next = {};
      basket.composition.forEach((c, i) => {
        next[c.instrument_id] = equal + (i === 0 ? rem : 0);
      });
      setWeights(next);
      setEqualSplitTick(t => t + 1);
    };

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
          title="Gewichtung"
          right={
            <button className="bb-tap" onClick={equalSplit} style={{
              padding: '6px 12px', height: 32, borderRadius: 8,
              background: 'var(--surface-2)', border: 'none',
              color: 'var(--fg-mid)', fontSize: 12, fontWeight: 500,
            }}>Gleich verteilen</button>
          }
        />
        <div style={{ padding: '0 20px 8px', fontSize: 13, color: 'var(--fg-mid)' }}>
          100&nbsp;% auf {basket.composition.length} Werte verteilen.
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 200px' }}>
          {basket.composition.map((c, i) => {
            const inst = store.instById[c.instrument_id];
            if (!inst) return null;
            const w = weights[c.instrument_id] || 0;
            return (
              <div key={c.instrument_id} style={{
                padding: '14px 0', borderBottom: '1px solid var(--line-soft)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AssetGlyph ticker={inst.ticker} type={inst.type} size={36}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>{inst.ticker}</div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    background: 'var(--surface-2)', borderRadius: 10, padding: '0 2px', height: 40,
                  }}>
                    <button className="bb-tap" onClick={() => setWeight(c.instrument_id, w - 5)} style={{
                      width: 28, height: 28, border: 'none', background: 'transparent',
                      color: 'var(--fg-mid)', fontSize: 18,
                    }}>−</button>
                    <input
                      key={equalSplitTick + '_' + c.instrument_id}
                      type="number"
                      value={w}
                      onChange={e => setWeight(c.instrument_id, e.target.value)}
                      style={{
                        width: 52, height: 32, background: 'transparent', border: 'none',
                        textAlign: 'right', color: 'var(--fg)', fontSize: 16,
                        fontWeight: 600, outline: 'none',
                        fontFamily: 'var(--font-mono)',
                        padding: 0,
                      }}/>
                    <span style={{ color: 'var(--fg-mid)', fontSize: 14, padding: '0 6px 0 2px' }}>%</span>
                    <button className="bb-tap" onClick={() => setWeight(c.instrument_id, w + 5)} style={{
                      width: 28, height: 28, border: 'none', background: 'transparent',
                      color: 'var(--fg-mid)', fontSize: 18,
                    }}>+</button>
                  </div>
                </div>
                <div style={{ marginTop: 10, marginLeft: 48 }}>
                  <Bar value={w} mode="target"/>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '14px 20px 32px',
          background: 'var(--bg)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--fg-mid)' }}>Summe</span>
            <span className="num" style={{
              fontSize: 18, fontWeight: 600,
              color: valid ? 'var(--pos)' : (total > 100 ? 'var(--neg)' : 'var(--warn)'),
            }}>
              {total}&nbsp;% {valid ? '✓' : (total > 100 ? `(−${total - 100})` : `(noch ${100 - total})`)}
            </span>
          </div>
          <Button variant="primary" size="lg" disabled={!valid} style={{ width: '100%' }}
            onClick={() => {
              store.setWeights(basket.id, weights);
              goBack();
            }}>
            Gewichtung speichern
          </Button>
        </div>
      </div>
    );
  }

  // ─── Recurring Savings (hero flow) ──────────────────────────────
  function SavingsScreen({ navigate, params, goBack }) {
    const store = useStore();
    const basket = store.basketById[params.basketId];
    const existingPlan = store.planByBasket[basket.id];
    const toast = useToast();

    const [amount, setAmount] = FU(existingPlan ? String(existingPlan.amount_eur) : '100');
    const [frequency, setFrequency] = FU(existingPlan ? existingPlan.frequency : 'monthly');
    const [day, setDay] = FU(existingPlan ? existingPlan.execution_day : 9);

    const numAmt = parseFloat(amount) || 0;
    const smallestWeight = Math.min(...basket.composition.map(c => c.weight_pct).filter(w => w > 0));
    const minAmount = smallestWeight > 0 ? Math.ceil(100 / smallestWeight) : 1;
    const valid = numAmt >= minAmount;

    const previewRows = basket.composition
      .filter(c => c.weight_pct > 0)
      .map(c => {
        const inst = store.instById[c.instrument_id];
        const eur = numAmt * c.weight_pct / 100;
        const shares = inst ? eur / inst.price : 0;
        return { inst, eur, shares, weight: c.weight_pct };
      });

    const days = [2, 9, 16, 23];
    const freqLabel = { weekly: 'Woche', biweekly: '2 Wochen', monthly: 'Monat' }[frequency];
    const yearMult = { weekly: 52, biweekly: 26, monthly: 12 }[frequency];

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
          title={existingPlan ? 'Sparplan bearbeiten' : 'Sparplan starten'}
          right={existingPlan ? (
            <button className="bb-tap" onClick={() => { store.cancelRecurringPlan(basket.id); toast('Sparplan beendet'); goBack(); }} style={{
              padding: '6px 12px', height: 32, borderRadius: 8,
              background: 'transparent', border: 'none',
              color: 'var(--neg)', fontSize: 13, fontWeight: 500,
            }}>Beenden</button>
          ) : null}
        />

        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 130 }}>
          <div style={{ padding: '4px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BasketGlyph glyph={basket.glyph} size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Index</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{basket.name}</div>
            </div>
          </div>

          <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--fg-mid)' }}>
              Jeden {freqLabel}
            </div>
            <div style={{ marginTop: 12 }}>
              <MoneyDisplay amount={numAmt} big/>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--fg-dim)' }}>
              ≈ {fmtEur(numAmt * yearMult, { decimals: 0 })} pro Jahr
            </div>
          </div>

          <div style={{ padding: '16px 20px 8px' }}>
            <SegControl value={frequency} onChange={setFrequency} options={[
              { value: 'weekly', label: 'Wöchentl.' },
              { value: 'biweekly', label: '2 Wo.' },
              { value: 'monthly', label: 'Monatl.' },
            ]}/>
          </div>

          <div style={{ padding: '12px 20px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Ausführungstag
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {days.map(d => (
                <button key={d} onClick={() => setDay(d)} className="bb-tap" style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: day === d ? 'var(--accent)' : 'var(--surface-2)',
                  color: day === d ? 'var(--accent-fg)' : 'var(--fg)',
                  border: 'none',
                  fontWeight: 600, fontSize: 14,
                }}>
                  {ord(d)}
                </button>
              ))}
            </div>
          </div>

          {!valid && numAmt > 0 && (
            <div style={{ margin: '8px 20px 0', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(250,204,21,0.08)',
              color: 'var(--warn)', fontSize: 12, lineHeight: 1.5,
            }}>
              Mindestens {fmtEur(minAmount, { decimals: 0 })} — wenigstens 1&nbsp;€ pro Wert.
            </div>
          )}

          <div style={{ padding: '20px 20px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Aufteilung pro Ausführung
            </div>
            <div style={{ background: 'var(--surface-1)', borderRadius: 14, padding: '4px 14px' }}>
              {previewRows.map((r, i) => (
                <div key={r.inst?.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i === previewRows.length - 1 ? 'none' : '1px solid var(--line-soft)',
                }}>
                  <div className="num" style={{ width: 36, fontSize: 12, color: 'var(--fg-mid)', fontWeight: 500 }}>{r.weight}&nbsp;%</div>
                  <AssetGlyph ticker={r.inst?.ticker} type={r.inst?.type} size={28}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.inst?.ticker}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>{fmtEur(r.eur)}</div>
                    <div className="num" style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{r.shares.toFixed(4).replace('.', ',')} St.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--bg)',
          paddingBottom: 28,
        }}>
          <div style={{ padding: '8px 20px 0' }}>
            <Button variant="primary" size="lg" disabled={!valid} style={{ width: '100%' }} icon="repeat"
              onClick={() => {
                store.setRecurringPlan(basket.id, { amount_eur: numAmt, frequency, execution_day: day });
                if (store.stateOf(basket) !== 'active') {
                  store.executeBuy(basket.id, numAmt, { auto: true });
                  toast('Sparplan gestartet · erste Ausführung erfolgt');
                } else {
                  toast(existingPlan ? 'Sparplan aktualisiert' : 'Sparplan gestartet');
                }
                goBack();
              }}>
              {existingPlan ? 'Änderungen speichern' : `${fmtEur(numAmt, { decimals: 0 })} sparen`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Buy (one-tap) ──────────────────────────────────────────────
  function BuyScreen({ navigate, params, goBack }) {
    const store = useStore();
    const basket = store.basketById[params.basketId];
    const [amount, setAmount] = FU('100');
    const [confirming, setConfirming] = FU(false);

    const numAmt = parseFloat(amount) || 0;
    const smallestWeight = Math.min(...basket.composition.map(c => c.weight_pct).filter(w => w > 0));
    const minAmount = smallestWeight > 0 ? Math.ceil(100 / smallestWeight) : 1;
    const valid = numAmt >= minAmount && numAmt <= store.account.cash_eur;

    const handleNumPad = (k) => {
      if (k === '⌫') setAmount(a => a.length > 1 ? a.slice(0, -1) : '0');
      else if (k === ',') { if (!amount.includes(',') && !amount.includes('.')) setAmount(a => a + '.'); }
      else setAmount(a => (a === '0' ? k : a + k));
    };

    const previewRows = basket.composition
      .filter(c => c.weight_pct > 0)
      .map(c => {
        const inst = store.instById[c.instrument_id];
        const eur = numAmt * c.weight_pct / 100;
        const shares = inst ? eur / inst.price : 0;
        return { inst, eur, shares, weight: c.weight_pct };
      });

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
          title="Einmalig kaufen"
        />

        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 380 }}>
          <div style={{ padding: '4px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BasketGlyph glyph={basket.glyph} size={32}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Index</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{basket.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Verfügbar</div>
              <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fmtEur(store.account.cash_eur)}</div>
            </div>
          </div>

          <div style={{ padding: '24px 20px 8px', textAlign: 'center' }}>
            <MoneyDisplay amount={numAmt} big/>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-dim)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <LiveDot color="var(--fg-mid)"/> 1 Tap → {previewRows.length} Ausführungen
            </div>
          </div>

          <div style={{ padding: '12px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Vorschau</div>
            <div style={{ background: 'var(--surface-1)', borderRadius: 14, padding: '4px 14px' }}>
              {previewRows.map((r, i) => (
                <div key={r.inst?.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i === previewRows.length - 1 ? 'none' : '1px solid var(--line-soft)',
                }}>
                  <div className="num" style={{ width: 36, fontSize: 12, color: 'var(--fg-mid)', fontWeight: 500 }}>{r.weight}&nbsp;%</div>
                  <AssetGlyph ticker={r.inst?.ticker} type={r.inst?.type} size={28}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.inst?.ticker}</div>
                    <div className="num" style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{fmtEur(r.inst?.price)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>{fmtEur(r.eur)}</div>
                    <div className="num" style={{ fontSize: 11, color: 'var(--fg-dim)' }}>{r.shares.toFixed(4).replace('.', ',')} St.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {numAmt > store.account.cash_eur && (
            <div style={{ margin: '0 20px', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(248,113,113,0.08)',
              color: 'var(--neg)', fontSize: 12,
            }}>
              Nicht genug Cash. Verfügbar {fmtEur(store.account.cash_eur)}.
            </div>
          )}
          {numAmt > 0 && numAmt < minAmount && (
            <div style={{ margin: '0 20px', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(250,204,21,0.08)',
              color: 'var(--warn)', fontSize: 12,
            }}>
              Mindestens {fmtEur(minAmount, { decimals: 0 })} — wenigstens 1&nbsp;€ pro Wert.
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
          paddingBottom: 28,
        }}>
          <NumPad onPress={handleNumPad}/>
          <div style={{ padding: '0 20px' }}>
            <Button variant="primary" size="lg" disabled={!valid || confirming} style={{ width: '100%' }}
              onClick={() => {
                if (confirming) return;
                setConfirming(true);
                setTimeout(() => {
                  const ev = store.executeBuy(basket.id, numAmt);
                  navigate('buySuccess', { basketId: basket.id, orderId: ev.id });
                }, 600);
              }}>
              {confirming ? 'Wird ausgeführt…' : `Kaufen ${fmtEur(numAmt, { decimals: 0 })}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Sell (per-position) ────────────────────────────────────────
  function SellScreen({ navigate, params, goBack }) {
    const store = useStore();
    const toast = useToast();
    const position = store.positions.find(p => p.id === params.positionId);
    const inst = position ? store.instById[position.instrument_id] : null;
    const basket = position && position.basket_id ? store.basketById[position.basket_id] : null;
    const [amount, setAmount] = FU(position ? String(Math.floor(position.quantity * (inst?.price || 1))) : '0');
    const [confirming, setConfirming] = FU(false);

    if (!position || !inst) {
      return (
        <div className="page" style={{ padding: 40, textAlign: 'center', color: 'var(--fg-mid)' }}>
          Position nicht gefunden.
        </div>
      );
    }

    const numAmt = parseFloat(amount) || 0;
    const positionValue = position.quantity * inst.price;
    const valid = numAmt > 0 && numAmt <= positionValue + 0.01;
    const shares = numAmt / inst.price;
    const fraction = numAmt / positionValue;
    const costSold = position.total_invested * fraction;
    const realizedPL = numAmt - costSold;

    const handleNumPad = (k) => {
      if (k === '⌫') setAmount(a => a.length > 1 ? a.slice(0, -1) : '0');
      else if (k === ',') { if (!amount.includes(',') && !amount.includes('.')) setAmount(a => a + '.'); }
      else setAmount(a => (a === '0' ? k : a + k));
    };

    const presets = [0.25, 0.5, 1.0];

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
          title="Verkaufen"
        />

        <div style={{ flex: 1, overflow: 'auto', paddingBottom: 360 }}>
          {/* Instrument summary */}
          <div style={{ padding: '4px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AssetGlyph ticker={inst.ticker} type={inst.type} size={36}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
              <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
                {inst.ticker} · {fmtEur(inst.price)} <Delta value={inst.chg} size={11} weight={500} style={{ marginLeft: 6 }}/>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Wert</div>
              <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fmtEur(positionValue)}</div>
            </div>
          </div>
          {basket && (
            <div style={{ padding: '0 20px 8px', fontSize: 11, color: 'var(--fg-mid)' }}>
              Aus Index „{basket.name}"
            </div>
          )}

          {/* Amount hero */}
          <div style={{ padding: '20px 20px 4px', textAlign: 'center' }}>
            <MoneyDisplay amount={numAmt} big/>
            <div className="num" style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-dim)' }}>
              ≈ {shares.toFixed(4).replace('.', ',')} St. · {(fraction * 100).toFixed(0)}&nbsp;% der Position
            </div>
          </div>

          {/* Quick fractions */}
          <div style={{ padding: '14px 20px 8px', display: 'flex', gap: 8 }}>
            {presets.map(f => {
              const eur = Math.round(positionValue * f);
              const active = Math.abs(numAmt - eur) < 0.5;
              return (
                <button key={f} onClick={() => setAmount(String(eur))} className="bb-tap" style={{
                  flex: 1, height: 38, borderRadius: 10,
                  background: active ? 'var(--fg)' : 'var(--surface-2)',
                  color: active ? 'var(--bg)' : 'var(--fg)',
                  border: 'none', fontWeight: 600, fontSize: 13,
                }}>{Math.round(f * 100)}&nbsp;%</button>
              );
            })}
          </div>

          {/* Realized P/L preview */}
          <div style={{ padding: '14px 20px 0' }}>
            <div style={{
              background: 'var(--surface-1)', borderRadius: 12, padding: 14,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Realisiert</div>
                <div className="num" style={{
                  marginTop: 4, fontSize: 18, fontWeight: 600,
                  color: realizedPL >= 0 ? 'var(--pos)' : 'var(--neg)',
                  letterSpacing: -0.3,
                }}>
                  {realizedPL >= 0 ? '+' : '−'}{fmtEur(Math.abs(realizedPL))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-mid)' }}>Erlös → Cash</div>
                <div className="num" style={{ marginTop: 4, fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>
                  +{fmtEur(numAmt)}
                </div>
              </div>
            </div>
          </div>

          {realizedPL > 0 && (
            <div style={{ margin: '10px 20px 0', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(250,204,21,0.08)',
              color: 'var(--warn)', fontSize: 12, lineHeight: 1.5,
            }}>
              Hinweis: Realisierte Gewinne sind steuerlich relevant.
            </div>
          )}

          {numAmt > positionValue && (
            <div style={{ margin: '10px 20px 0', padding: '10px 12px', borderRadius: 10,
              background: 'rgba(248,113,113,0.08)',
              color: 'var(--neg)', fontSize: 12,
            }}>
              Mehr als der aktuelle Wert — maximal {fmtEur(positionValue)}.
            </div>
          )}
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--bg)',
          paddingBottom: 28,
        }}>
          <NumPad onPress={handleNumPad}/>
          <div style={{ padding: '0 20px' }}>
            <Button variant="primary" size="lg" disabled={!valid || confirming} style={{ width: '100%' }}
              onClick={() => {
                if (confirming) return;
                setConfirming(true);
                setTimeout(() => {
                  store.sellPosition(position.id, numAmt);
                  toast(`${fmtEur(numAmt, { decimals: 0 })} verkauft`);
                  goBack();
                }, 600);
              }}>
              {confirming ? 'Wird ausgeführt…' : `Verkaufen ${fmtEur(numAmt, { decimals: 0 })}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  function BuySuccessScreen({ navigate, params }) {
    const store = useStore();
    const basket = store.basketById[params.basketId];
    const order = store.orders.find(o => o.id === params.orderId);
    if (!order) return null;

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '40px 20px 100px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--accent)', color: 'var(--accent-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'sheet-up 350ms cubic-bezier(.2,.9,.2,1)',
            }}>
              <Icon name="check" size={32} color="var(--accent-fg)" stroke={2.5}/>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>
              {basket.name} gekauft
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: 'var(--fg-mid)' }}>
              {fmtEur(order.amount_eur, { decimals: 0 })} auf {order.fills.length} Werte verteilt
            </div>
          </div>

          <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface-2)',
            borderRadius: 12, color: 'var(--fg)', fontSize: 13, fontWeight: 500,
            textAlign: 'center', letterSpacing: 0.2,
          }}>
            1 Tap → {order.fills.length} Ausführungen, 1 Eintrag
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Ausführungen</div>
            <div style={{ background: 'var(--surface-1)', borderRadius: 14, padding: '4px 14px' }}>
              {order.fills.map((f, i) => {
                const inst = store.instById[f.instrument_id];
                return (
                  <div key={f.instrument_id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0',
                    borderBottom: i === order.fills.length - 1 ? 'none' : '1px solid var(--line-soft)',
                    animation: `sheet-up 380ms ${i * 50}ms cubic-bezier(.2,.9,.2,1) both`,
                  }}>
                    <AssetGlyph ticker={inst?.ticker} type={inst?.type} size={32}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{inst?.name}</div>
                      <div className="num" style={{ fontSize: 11, color: 'var(--fg-dim)', marginTop: 2 }}>
                        {f.shares.toFixed(4).replace('.', ',')} @ {fmtEur(f.fill_price)}
                      </div>
                    </div>
                    <div className="num" style={{ fontSize: 14, fontWeight: 500 }}>{fmtEur(f.eur)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '14px 20px 32px',
          background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="lg" style={{ flex: 1 }}
              onClick={() => navigate('activity')}>
              Zur Aktivität
            </Button>
            <Button variant="primary" size="lg" style={{ flex: 1 }}
              onClick={() => navigate('basket', { basketId: basket.id }, { reset: true })}>
              Fertig
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Search screen ──────────────────────────────────────────────
  function SearchScreen({ navigate, params, goBack }) {
    const store = useStore();
    const [q, setQ] = FU('');
    const [pickerForInst, setPickerForInst] = FU(null);
    const targetBasketId = params.addToBasketId || null;

    const fav = store.baskets.find(b => b.is_default_favourites);
    const favIds = new Set(fav?.composition.map(c => c.instrument_id));

    const list = FM(() => {
      const lc = q.trim().toLowerCase();
      if (!lc) return store.instruments;
      return store.instruments.filter(i =>
        i.name.toLowerCase().includes(lc) ||
        i.ticker.toLowerCase().includes(lc));
    }, [q, store.instruments]);

    // When targeting an existing basket: how many have been added?
    const targetBasket = targetBasketId ? store.basketById[targetBasketId] : null;
    const addedCount = targetBasket ? targetBasket.composition.length : 0;

    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={targetBasketId ? (
            <button className="bb-tap"
              onClick={() => navigate('basket', { basketId: targetBasketId }, { reset: true })}
              style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}>
              <Icon name="chevL" size={20}/>
            </button>
          ) : null}
          title={targetBasketId ? `Zu „${targetBasket?.name}"` : 'Suche'}
          large={!targetBasketId}
        />

        <div style={{ padding: '0 20px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface-2)',
            borderRadius: 12, padding: '0 14px', height: 44,
          }}>
            <Icon name="search" size={16} color="var(--fg-mid)"/>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Aktien, ETFs, Kürzel…"
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--fg)',
                fontSize: 15, outline: 'none' }}/>
            {q && (
              <button onClick={() => setQ('')} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mid)', cursor: 'pointer' }}>
                <Icon name="close" size={14}/>
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>          {list.map(inst => {
            const isFav = favIds.has(inst.id);
            const isInTarget = targetBasketId && store.basketById[targetBasketId]?.composition.some(c => c.instrument_id === inst.id);
            return (
              <div key={inst.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--line-soft)',
              }}>
                <AssetGlyph ticker={inst.ticker} type={inst.type} size={36}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.name}</div>
                  <div className="num" style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
                    {inst.ticker} · {inst.type}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 4 }}>
                  <div className="num" style={{ fontSize: 13, fontWeight: 500 }}>{fmtEur(inst.price)}</div>
                  <Delta value={inst.chg} size={11} weight={500} style={{ marginTop: 2 }}/>
                </div>
                {targetBasketId ? (
                  <button className="bb-tap" onClick={() => store.addToBasket(targetBasketId, inst.id)} style={{
                    width: 36, height: 36, borderRadius: 99, border: 'none',
                    background: isInTarget ? 'var(--accent)' : 'var(--surface-2)',
                    color: isInTarget ? 'var(--accent-fg)' : 'var(--fg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={isInTarget ? 'check' : 'plus'} size={16}/>
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="bb-tap" onClick={() => store.toggleFavourite(inst.id)} style={{
                      width: 36, height: 36, borderRadius: 99, border: 'none',
                      background: 'var(--surface-2)',
                      color: isFav ? '#FFD86B' : 'var(--fg-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={isFav ? 'star' : 'starOutline'} size={16} fill={isFav ? '#FFD86B' : 'none'}/>
                    </button>
                    <button className="bb-tap" onClick={() => setPickerForInst(inst)} style={{
                      width: 36, height: 36, borderRadius: 99, border: 'none',
                      background: 'var(--surface-2)', color: 'var(--fg-mid)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="plus" size={16}/>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {targetBasketId && <div style={{ height: 100 }}/>}
        </div>

        {/* Sticky "Done" CTA when adding to an existing basket */}
        {targetBasketId && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '14px 20px 32px',
            background: 'linear-gradient(to top, var(--bg) 65%, rgba(0,0,0,0))',
          }}>
            <Button variant="primary" size="lg" style={{ width: '100%' }}
              onClick={() => navigate('basket', { basketId: targetBasketId }, { reset: true })}>
              {addedCount === 0
                ? 'Schließen'
                : addedCount === 1
                  ? '1 Wert hinzugefügt · Fertig'
                  : `${addedCount} Werte hinzugefügt · Fertig`}
            </Button>
          </div>
        )}

        <Sheet open={!!pickerForInst} onClose={() => setPickerForInst(null)} title={pickerForInst ? `${pickerForInst.ticker} hinzufügen zu…` : ''}>
          <div style={{ padding: '4px 12px 16px' }}>
            {store.baskets.map(b => {
              const has = b.composition.some(c => c.instrument_id === pickerForInst?.id);
              const stateLabel = { passive: 'Passiv', weighted: 'Gewichtet', active: 'Aktiv' }[store.stateOf(b)];
              return (
                <div key={b.id} onClick={() => {
                  if (!has && pickerForInst) store.addToBasket(b.id, pickerForInst.id);
                  setPickerForInst(null);
                }} className="bb-tap" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                }}>
                  <BasketGlyph glyph={b.glyph} size={36}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2 }}>
                      {stateLabel} · {b.composition.length} Werte
                    </div>
                  </div>
                  {has ? <Icon name="check" size={18} color="var(--fg)"/> : <Icon name="plus" size={18} color="var(--fg-mid)"/>}
                </div>
              );
            })}
            <div style={{ height: 1, background: 'var(--line-soft)', margin: '8px 0' }}/>
            <div onClick={() => {
              const b = store.createBasket('Neuer Index');
              if (pickerForInst) store.addToBasket(b.id, pickerForInst.id);
              setPickerForInst(null);
            }} className="bb-tap" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
              color: 'var(--fg)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="plus" size={18}/>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Neuen Index erstellen</div>
            </div>
          </div>
        </Sheet>
      </div>
    );
  }

  // ─── Activity ───────────────────────────────────────────────────
  function ActivityScreen({ navigate }) {
    const store = useStore();
    const [filter, setFilter] = FU('all');
    const [expanded, setExpanded] = FU({});

    const filtered = store.orders.filter(o => {
      if (filter === 'baskets') return o.type === 'basket_buy';
      if (filter === 'single') return o.type === 'single_buy' || o.type === 'single_sell';
      return true;
    });

    return (
      <div className="page bb-screen" style={{ height: '100%', overflow: 'auto', paddingBottom: 120 }}>
        <Header title="Aktivität" large/>

        <div style={{ padding: '0 20px 12px' }}>
          <SegControl value={filter} onChange={setFilter} options={[
            { value: 'all', label: 'Alle' },
            { value: 'baskets', label: 'Indexes' },
            { value: 'single', label: 'Einzeln' },
          ]}/>
        </div>

        <div style={{ padding: '0 20px' }}>
          {filtered.map((o) => {
            const isBasket = o.type === 'basket_buy';
            const isSell = o.type === 'single_sell';
            const basket = isBasket ? store.basketById[o.basket_id] : null;
            const isOpen = expanded[o.id];
            const date = new Date(o.executed_at);
            const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
            const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={o.id} style={{
                marginBottom: 8, borderRadius: 14,
                background: 'var(--surface-1)',
                overflow: 'hidden',
              }}>
                <div className="bb-tap" onClick={() => isBasket && setExpanded(e => ({ ...e, [o.id]: !e[o.id] }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    cursor: isBasket ? 'pointer' : 'default',
                  }}>
                  {isBasket ? (
                    <BasketGlyph glyph={basket?.glyph} size={36}/>
                  ) : (
                    <AssetGlyph ticker={store.instById[o.fills[0].instrument_id]?.ticker}
                      type={store.instById[o.fills[0].instrument_id]?.type} size={36}/>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {isBasket
                          ? basket?.name
                          : (isSell ? 'Verkauft · ' : '') + (store.instById[o.fills[0].instrument_id]?.name || '')}
                      </span>
                      {isBasket && o.auto && (
                        <span style={{
                          padding: '1px 6px', borderRadius: 4, fontSize: 10,
                          background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 600,
                        }}>Auto</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--fg-mid)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{dateStr} · {timeStr}</span>
                      {isBasket && (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-faint)' }}/>
                          <span style={{ color: 'var(--fg)', fontWeight: 500 }}>
                            {o.fills.length} Werte
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num" style={{
                      fontSize: 15, fontWeight: 600,
                      color: isSell ? 'var(--pos)' : 'var(--fg)',
                    }}>{isSell ? '+' : '−'}{fmtEur(o.amount_eur)}</div>
                    {isBasket && (
                      <div style={{ marginTop: 4, color: 'var(--fg-faint)', display: 'flex', justifyContent: 'flex-end' }}>
                        <Icon name={isOpen ? 'chevD' : 'chevR'} size={14}/>
                      </div>
                    )}
                  </div>
                </div>

                {isBasket && isOpen && (
                  <div style={{
                    padding: '4px 16px 14px',
                    background: 'var(--surface-0)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-mid)', padding: '12px 0 6px' }}>
                      {o.fills.length} Ausführungen
                    </div>
                    {o.fills.map((f, i) => {
                      const inst = store.instById[f.instrument_id];
                      return (
                        <div key={f.instrument_id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 0',
                          borderBottom: i === o.fills.length - 1 ? 'none' : '1px solid var(--line-soft)',
                          animation: `sheet-up 220ms ${i * 30}ms cubic-bezier(.2,.9,.2,1) both`,
                        }}>
                          <div style={{ width: 14, height: 1, background: 'var(--line)', flexShrink: 0 }}/>
                          <AssetGlyph ticker={inst?.ticker} type={inst?.type} size={26}/>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst?.name}</div>
                            <div className="num" style={{ fontSize: 10, color: 'var(--fg-dim)', marginTop: 1 }}>
                              {f.shares.toFixed(4).replace('.', ',')} @ {fmtEur(f.fill_price)}
                            </div>
                          </div>
                          <div className="num" style={{ fontSize: 12, fontWeight: 500 }}>{fmtEur(f.eur)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Claim ghost ────────────────────────────────────────────────
  function ClaimGhostScreen({ navigate, params, goBack }) {
    const store = useStore();
    const ghost = store.ghosts.find(g => g.id === params.ghostId);
    const [name, setName] = FU(ghost ? ghost.name : '');
    if (!ghost) return null;
    return (
      <div className="page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Header
          left={<button className="bb-tap" onClick={goBack} style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--fg)' }}><Icon name="chevL" size={20}/></button>}
          title="Index übernehmen"
        />
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <BasketGlyph glyph={ghost.glyph} size={64}/>
            <div style={{ textAlign: 'center', maxWidth: 280 }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ghost.name}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-mid)', lineHeight: 1.5 }}>{ghost.desc}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--fg-mid)', marginBottom: 8 }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{
              width: '100%', height: 48, background: 'var(--surface-2)',
              border: 'none', borderRadius: 12, color: 'var(--fg)',
              padding: '0 14px', fontSize: 16, outline: 'none',
            }}/>
          <Spacer h={4}/>
          <div style={{ fontSize: 12, color: 'var(--fg-dim)' }}>
            Wir erstellen einen leeren Index — du wählst die Werte selbst.
          </div>

          <Spacer h={20}/>

          <div style={{ background: 'var(--surface-0)', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 24, height: 24, borderRadius: 99,
                background: 'var(--surface-2)', color: 'var(--fg-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name="info" size={14}/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-mid)', lineHeight: 1.6 }}>
                Basket Broker schlägt keine Werte vor. Der Name ist nur die Idee — du entscheidest, was in den Index kommt und wie er gewichtet wird.
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}/>

          <Button variant="primary" size="lg" disabled={!name.trim()} style={{ width: '100%' }}
            onClick={() => {
              const b = store.claimGhost(ghost.id, name.trim());
              if (b) navigate('search', { addToBasketId: b.id }, { reset: true });
            }}>
            Übernehmen und Werte hinzufügen
          </Button>
        </div>
      </div>
    );
  }

  Object.assign(window, {
    WeightsScreen, SavingsScreen, BuyScreen, BuySuccessScreen, SellScreen,
    SearchScreen, ActivityScreen, ClaimGhostScreen,
  });
})();
