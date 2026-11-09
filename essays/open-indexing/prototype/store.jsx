// store.jsx — central state for the basket prototype.
// Exposes: window.useStore (hook), window.StoreProvider

const { createContext: SCtxC, useContext: SCtxU, useState: SU, useEffect: SE, useRef: SR, useMemo: SM } = React;

const StoreContext = SCtxC(null);

function StoreProvider({ children }) {
  // Deep-clone seed so we can mutate freely.
  const seed = window.SEED;
  const [instruments, setInstruments] = SU(() => seed.INSTRUMENTS.map(x => ({ ...x })));
  const [baskets, setBaskets]         = SU(() => seed.BASKETS.map(b => ({ ...b, composition: b.composition.map(c => ({ ...c })) })));
  const [claimedGhostIds, setClaimedGhostIds] = SU(() => [...seed.CLAIMED_GHOST_IDS]);
  const [plans, setPlans]             = SU(() => seed.RECURRING_PLANS.map(p => ({ ...p })));
  const [positions, setPositions]     = SU(() => seed.POSITIONS.map(p => ({ ...p })));
  const [orders, setOrders]           = SU(() => seed.ORDER_EVENTS.map(o => ({ ...o, fills: o.fills.map(f => ({ ...f })) })));
  const [account, setAccount]         = SU(() => ({ ...seed.ACCOUNT }));

  // Live price ticking — small random walk for "feel".
  SE(() => {
    const id = setInterval(() => {
      setInstruments(prev => prev.map(i => {
        // ±0.25% drift
        const drift = (Math.random() - 0.5) * 0.005;
        const np = Math.max(0.01, i.price * (1 + drift));
        // small daily-change drift too
        const ndchg = i.chg + (Math.random() - 0.5) * 0.05;
        return { ...i, price: np, chg: Math.max(-9, Math.min(9, ndchg)) };
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Lookups
  const instById = SM(() => Object.fromEntries(instruments.map(i => [i.id, i])), [instruments]);
  const basketById = SM(() => Object.fromEntries(baskets.map(b => [b.id, b])), [baskets]);
  const planByBasket = SM(() => Object.fromEntries(plans.map(p => [p.basket_id, p])), [plans]);

  // Lifecycle state for a basket
  const stateOf = (basket) => window.lifecycleState(basket, positions);

  // Computed value of a basket = sum(positions.qty * current_price) for that basket
  const valueOfBasket = (basketId) => {
    return positions
      .filter(p => p.basket_id === basketId)
      .reduce((s, p) => s + p.quantity * (instById[p.instrument_id]?.price || 0), 0);
  };
  const investedOfBasket = (basketId) => positions
    .filter(p => p.basket_id === basketId)
    .reduce((s, p) => s + p.total_invested, 0);

  // Daily delta in EUR for a basket (sum of qty*price*chg/100)
  const dailyDeltaOfBasket = (basketId) => {
    return positions
      .filter(p => p.basket_id === basketId)
      .reduce((s, p) => {
        const inst = instById[p.instrument_id];
        if (!inst) return s;
        return s + p.quantity * inst.price * (inst.chg / 100);
      }, 0);
  };

  // Total portfolio value
  const totalValue = SM(() => {
    return positions.reduce((s, p) => s + p.quantity * (instById[p.instrument_id]?.price || 0), 0) + account.cash_eur;
  }, [positions, instById, account.cash_eur]);
  const totalInvestedAssets = SM(() => {
    return positions.reduce((s, p) => s + p.quantity * (instById[p.instrument_id]?.price || 0), 0);
  }, [positions, instById]);
  const totalDailyDelta = SM(() => {
    return positions.reduce((s, p) => {
      const inst = instById[p.instrument_id];
      if (!inst) return s;
      return s + p.quantity * inst.price * (inst.chg / 100);
    }, 0);
  }, [positions, instById]);

  // ── Actions ───────────────────────────────────────────────
  const toggleFavourite = (instrumentId) => {
    setBaskets(prev => prev.map(b => {
      if (!b.is_default_favourites) return b;
      const has = b.composition.some(c => c.instrument_id === instrumentId);
      return has
        ? { ...b, composition: b.composition.filter(c => c.instrument_id !== instrumentId) }
        : { ...b, composition: [...b.composition, { instrument_id: instrumentId, weight_pct: 0 }] };
    }));
  };

  const addToBasket = (basketId, instrumentId) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== basketId) return b;
      if (b.composition.some(c => c.instrument_id === instrumentId)) return b;
      // If basket was weighted, adding pushes back to passive (weights need re-set).
      return {
        ...b,
        composition: [...b.composition, { instrument_id: instrumentId, weight_pct: 0 }],
      };
    }));
  };

  const removeFromBasket = (basketId, instrumentId) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== basketId) return b;
      return { ...b, composition: b.composition.filter(c => c.instrument_id !== instrumentId) };
    }));
  };

  const setWeights = (basketId, weights /* {instrument_id: pct} */) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== basketId) return b;
      return {
        ...b,
        weights_set: true,
        composition: b.composition.map(c => ({
          ...c, weight_pct: weights[c.instrument_id] ?? c.weight_pct,
        })),
      };
    }));
  };

  const claimGhost = (ghostId, name) => {
    const ghost = window.SEED.GHOSTS.find(g => g.id === ghostId);
    if (!ghost) return null;
    const newId = 'b_' + ghostId.slice(2) + '_' + Date.now().toString(36);
    const basket = {
      id: newId,
      name: name || ghost.name,
      glyph: ghost.glyph,
      created_at: new Date().toISOString().slice(0, 10),
      is_default_favourites: false,
      weights_set: false,
      composition: [],
      recurring_plan_id: null,
    };
    setBaskets(prev => [basket, ...prev]);
    setClaimedGhostIds(prev => [...prev, ghostId]);
    return basket;
  };

  const createBasket = (name, glyph = '◆') => {
    const id = 'b_new_' + Date.now().toString(36);
    const basket = {
      id, name, glyph, created_at: new Date().toISOString().slice(0,10),
      is_default_favourites: false, weights_set: false,
      composition: [], recurring_plan_id: null,
    };
    setBaskets(prev => [basket, ...prev]);
    return basket;
  };

  const renameBasket = (basketId, name) => {
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, name } : b));
  };

  // Execute a basket buy: write 1 OrderEvent + upsert N positions
  const executeBuy = (basketId, amountEur, opts = {}) => {
    const basket = baskets.find(b => b.id === basketId);
    if (!basket) return null;
    const fills = basket.composition
      .filter(c => c.weight_pct > 0)
      .map(c => {
        const inst = instById[c.instrument_id];
        const eur = +(amountEur * c.weight_pct / 100).toFixed(2);
        const shares = +(eur / inst.price).toFixed(4);
        return { instrument_id: c.instrument_id, eur, shares, fill_price: inst.price };
      });
    const orderId = 'o_' + Date.now().toString(36);
    const event = {
      id: orderId,
      type: 'basket_buy', basket_id: basketId,
      amount_eur: amountEur,
      executed_at: new Date().toISOString(),
      status: 'filled',
      auto: opts.auto || false,
      fills,
    };
    setOrders(prev => [event, ...prev]);
    setPositions(prev => {
      let next = [...prev];
      fills.forEach(f => {
        const idx = next.findIndex(p => p.basket_id === basketId && p.instrument_id === f.instrument_id);
        if (idx >= 0) {
          const p = next[idx];
          const newQty = p.quantity + f.shares;
          const newInvested = p.total_invested + f.eur;
          const newAvg = newInvested / newQty;
          next[idx] = { ...p, quantity: newQty, total_invested: newInvested, avg_purchase_price: newAvg };
        } else {
          next.push({
            id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2,5),
            instrument_id: f.instrument_id,
            basket_id: basketId,
            quantity: f.shares,
            avg_purchase_price: f.fill_price,
            total_invested: f.eur,
          });
        }
      });
      return next;
    });
    setAccount(prev => ({ ...prev, cash_eur: Math.max(0, prev.cash_eur - amountEur) }));
    return event;
  };

  // Sell a position: reduce qty proportionally, credit cash, write a sell event.
  // basketId may be null (standalone position).
  const sellPosition = (positionId, eurAmount) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return null;
    const inst = instById[pos.instrument_id];
    if (!inst) return null;
    const positionValue = pos.quantity * inst.price;
    const eur = Math.min(eurAmount, positionValue);
    const shares = eur / inst.price;
    const newQty = Math.max(0, pos.quantity - shares);
    // Reduce total_invested proportionally (so avg cost stays constant)
    const newInvested = newQty === 0 ? 0 : pos.total_invested * (newQty / pos.quantity);

    const orderId = 'o_sell_' + Date.now().toString(36);
    const event = {
      id: orderId,
      type: 'single_sell',
      basket_id: pos.basket_id,
      amount_eur: eur,
      executed_at: new Date().toISOString(),
      status: 'filled',
      fills: [{ instrument_id: pos.instrument_id, eur, shares, fill_price: inst.price }],
    };
    setOrders(prev => [event, ...prev]);

    setPositions(prev => {
      if (newQty < 0.0001) {
        return prev.filter(p => p.id !== positionId);
      }
      return prev.map(p => p.id === positionId
        ? { ...p, quantity: newQty, total_invested: newInvested }
        : p);
    });
    setAccount(prev => ({ ...prev, cash_eur: prev.cash_eur + eur }));
    return event;
  };

  // Unlink a position from its basket (becomes standalone). Keeps the holding.
  const unlinkPosition = (positionId) => {
    setPositions(prev => prev.map(p => p.id === positionId
      ? { ...p, basket_id: null }
      : p));
  };

  const setRecurringPlan = (basketId, plan /* {amount_eur, frequency, execution_day} */) => {
    setPlans(prev => {
      const existing = prev.find(p => p.basket_id === basketId);
      if (existing) {
        return prev.map(p => p.basket_id === basketId ? { ...p, ...plan, active: true } : p);
      }
      const newPlan = {
        id: 'rp_' + Date.now().toString(36),
        basket_id: basketId,
        active: true,
        next_execution_at: '2026-05-' + String(plan.execution_day || 9).padStart(2, '0'),
        ...plan,
      };
      return [...prev, newPlan];
    });
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, recurring_plan_id: 'rp_' + basketId } : b));
  };

  const cancelRecurringPlan = (basketId) => {
    setPlans(prev => prev.filter(p => p.basket_id !== basketId));
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, recurring_plan_id: null } : b));
  };

  const value = {
    instruments, instById,
    baskets, basketById,
    claimedGhostIds, ghosts: window.SEED.GHOSTS,
    plans, planByBasket,
    positions, orders, account,
    stateOf,
    valueOfBasket, investedOfBasket, dailyDeltaOfBasket,
    totalValue, totalInvestedAssets, totalDailyDelta,
    toggleFavourite, addToBasket, removeFromBasket,
    setWeights, claimGhost, createBasket, renameBasket,
    executeBuy, sellPosition, unlinkPosition,
    setRecurringPlan, cancelRecurringPlan,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function useStore() { return SCtxU(StoreContext); }

Object.assign(window, { StoreProvider, useStore });
