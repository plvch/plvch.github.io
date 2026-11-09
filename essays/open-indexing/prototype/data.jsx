// data.jsx — seed data + lifecycle helpers for the basket prototype
// Exposes: window.SEED, window.lifecycleState, window.fmtEur, window.fmtPct, window.fmtSigned

(() => {
  // ─── Instruments ────────────────────────────────────────────────
  // Realistic-looking; prices in EUR. daily_change_pct is %.
  const INSTRUMENTS = [
    // Broad ETFs
    { id: 'i_vwce', name: 'Vanguard FTSE All-World', ticker: 'VWCE', type: 'ETF',   price: 121.42, chg:  0.34 },
    { id: 'i_iwda', name: 'iShares Core MSCI World',  ticker: 'IWDA', type: 'ETF',   price:  93.18, chg:  0.21 },
    { id: 'i_eqqq', name: 'Invesco Nasdaq-100',       ticker: 'EQQQ', type: 'ETF',   price: 482.05, chg:  1.12 },
    { id: 'i_emim', name: 'iShares Core MSCI EM',     ticker: 'EMIM', type: 'ETF',   price:  31.74, chg: -0.42 },
    { id: 'i_sxr8', name: 'iShares Core S&P 500',     ticker: 'SXR8', type: 'ETF',   price: 542.91, chg:  0.55 },
    { id: 'i_x010', name: 'Xtrackers Stoxx Europe 600',ticker: 'XSX6', type: 'ETF',  price:  64.27, chg:  0.18 },
    { id: 'i_aggh', name: 'iShares EUR Aggregate Bond', ticker: 'AGGH', type: 'Bond ETF', price: 4.71, chg: -0.09 },
    { id: 'i_egov', name: 'iShares Core EUR Govt Bond', ticker: 'EGOV', type: 'Bond ETF', price: 134.18, chg: -0.14 },
    { id: 'i_iuit', name: 'iShares S&P 500 Info Tech', ticker: 'IUIT', type: 'ETF',  price:  29.85, chg:  1.42 },
    { id: 'i_isgl', name: 'iShares Physical Gold',     ticker: 'SGLN', type: 'Commodity ETF', price:  47.92, chg:  0.62 },

    // Stocks — EU Tech 5
    { id: 'i_asml', name: 'ASML Holding',         ticker: 'ASML', type: 'Stock', price: 712.40, chg:  1.85 },
    { id: 'i_sap',  name: 'SAP',                  ticker: 'SAP',  type: 'Stock', price: 218.05, chg:  0.72 },
    { id: 'i_adye', name: 'Adyen',                ticker: 'ADYEN',type: 'Stock', price: 1582.10, chg: -0.91 },
    { id: 'i_inf',  name: 'Infineon Technologies',ticker: 'IFX',  type: 'Stock', price:  34.27, chg:  2.04 },
    { id: 'i_stm',  name: 'STMicroelectronics',   ticker: 'STM',  type: 'Stock', price:  28.61, chg:  1.22 },

    // Stocks — US tech & big caps
    { id: 'i_aapl', name: 'Apple',                ticker: 'AAPL', type: 'Stock', price: 232.18, chg:  0.45 },
    { id: 'i_msft', name: 'Microsoft',            ticker: 'MSFT', type: 'Stock', price: 421.55, chg:  0.88 },
    { id: 'i_nvda', name: 'NVIDIA',               ticker: 'NVDA', type: 'Stock', price: 138.92, chg:  2.75 },
    { id: 'i_googl',name: 'Alphabet Class A',     ticker: 'GOOGL',type: 'Stock', price: 191.07, chg:  0.62 },
    { id: 'i_amzn', name: 'Amazon',               ticker: 'AMZN', type: 'Stock', price: 218.40, chg:  1.05 },
    { id: 'i_meta', name: 'Meta Platforms',       ticker: 'META', type: 'Stock', price: 612.85, chg: -0.34 },
    { id: 'i_tsla', name: 'Tesla',                ticker: 'TSLA', type: 'Stock', price: 281.16, chg:  3.42 },

    // Defensive / dividend
    { id: 'i_nesn', name: 'Nestlé',               ticker: 'NESN', type: 'Stock', price:  87.42, chg: -0.18 },
    { id: 'i_unh',  name: 'UnitedHealth',         ticker: 'UNH',  type: 'Stock', price: 552.81, chg:  0.22 },
    { id: 'i_pg',   name: 'Procter & Gamble',     ticker: 'PG',   type: 'Stock', price: 168.27, chg:  0.11 },
    { id: 'i_jnj',  name: 'Johnson & Johnson',    ticker: 'JNJ',  type: 'Stock', price: 159.43, chg: -0.07 },
    { id: 'i_ko',   name: 'Coca-Cola',            ticker: 'KO',   type: 'Stock', price:  68.92, chg:  0.05 },
    { id: 'i_mcd',  name: "McDonald's",           ticker: 'MCD',  type: 'Stock', price: 297.18, chg:  0.42 },

    // German blue-chips & misc
    { id: 'i_alv',  name: 'Allianz',              ticker: 'ALV',  type: 'Stock', price: 318.45, chg:  0.31 },
    { id: 'i_dtg',  name: 'Daimler Truck',        ticker: 'DTG',  type: 'Stock', price:  41.27, chg: -0.62 },
    { id: 'i_sie',  name: 'Siemens',              ticker: 'SIE',  type: 'Stock', price: 192.08, chg:  0.55 },
    { id: 'i_dbk',  name: 'Deutsche Bank',        ticker: 'DBK',  type: 'Stock', price:  18.42, chg:  1.18 },
    { id: 'i_lvmh', name: 'LVMH',                 ticker: 'MC',   type: 'Stock', price: 712.50, chg: -0.55 },

    // Crypto-adjacent (just stocks)
    { id: 'i_amd',  name: 'AMD',                  ticker: 'AMD',  type: 'Stock', price: 152.18, chg:  1.62 },
    { id: 'i_avgo', name: 'Broadcom',             ticker: 'AVGO', type: 'Stock', price: 178.92, chg:  1.05 },
  ];

  // ─── Static ghost configs ───────────────────────────────────────
  const GHOSTS = [
    { id: 'g_core',  name: 'Core ETFs',  glyph: '●●', desc: 'A diversified base of broad-market ETFs.' },
    { id: 'g_tech',  name: 'Tech',       glyph: '◢◤', desc: 'Major technology stocks across regions.' },
    { id: 'g_def',   name: 'Defensive',  glyph: '▣',  desc: 'Lower-volatility names — staples & healthcare.' },
    { id: 'g_div',   name: 'Dividends',  glyph: '◆',  desc: 'Established payers with steady cash returns.' },
  ];

  // ─── Baskets — covering all four lifecycle states ───────────────
  const BASKETS = [
    // ACTIVE 1 — EU Tech 5, equal-weight, with recurring plan
    {
      id: 'b_eutech',
      name: 'EU Tech 5',
      glyph: '◢◤',
      created_at: '2025-09-12',
      is_default_favourites: false,
      weights_set: true,
      composition: [
        { instrument_id: 'i_asml', weight_pct: 20 },
        { instrument_id: 'i_sap',  weight_pct: 20 },
        { instrument_id: 'i_adye', weight_pct: 20 },
        { instrument_id: 'i_inf',  weight_pct: 20 },
        { instrument_id: 'i_stm',  weight_pct: 20 },
      ],
      recurring_plan_id: 'rp_eutech',
    },
    // ACTIVE 2 — Global ETF Mix, varied weights
    {
      id: 'b_globaletf',
      name: 'Global ETF Mix',
      glyph: '●●',
      created_at: '2025-07-02',
      is_default_favourites: false,
      weights_set: true,
      composition: [
        { instrument_id: 'i_vwce', weight_pct: 30 },
        { instrument_id: 'i_iwda', weight_pct: 20 },
        { instrument_id: 'i_eqqq', weight_pct: 15 },
        { instrument_id: 'i_emim', weight_pct: 10 },
        { instrument_id: 'i_x010', weight_pct: 10 },
        { instrument_id: 'i_aggh', weight_pct:  8 },
        { instrument_id: 'i_egov', weight_pct:  4 },
        { instrument_id: 'i_isgl', weight_pct:  3 },
      ],
      recurring_plan_id: null,
    },
    // WEIGHTED — claimed Defensive ghost, weighted but not bought
    {
      id: 'b_mydef',
      name: 'My Defensive Mix',
      glyph: '▣',
      created_at: '2026-04-11',
      is_default_favourites: false,
      weights_set: true,
      composition: [
        { instrument_id: 'i_nesn', weight_pct: 25 },
        { instrument_id: 'i_pg',   weight_pct: 25 },
        { instrument_id: 'i_jnj',  weight_pct: 20 },
        { instrument_id: 'i_ko',   weight_pct: 15 },
        { instrument_id: 'i_mcd',  weight_pct: 15 },
      ],
      recurring_plan_id: null,
    },
    // PASSIVE — Favourites, default, 0% weights
    {
      id: 'b_fav',
      name: 'Favourites',
      glyph: '★',
      created_at: '2024-01-01',
      is_default_favourites: true,
      weights_set: false,
      composition: [
        { instrument_id: 'i_vwce', weight_pct: 0 },
        { instrument_id: 'i_aapl', weight_pct: 0 },
        { instrument_id: 'i_nvda', weight_pct: 0 },
        { instrument_id: 'i_msft', weight_pct: 0 },
        { instrument_id: 'i_alv',  weight_pct: 0 },
      ],
      recurring_plan_id: null,
    },
  ];

  // Ghost basket id that's already been claimed (Defensive → My Defensive Mix)
  const CLAIMED_GHOST_IDS = ['g_def'];

  // ─── Recurring plans ────────────────────────────────────────────
  const RECURRING_PLANS = [
    {
      id: 'rp_eutech',
      basket_id: 'b_eutech',
      amount_eur: 200,
      frequency: 'monthly',
      execution_day: 9,
      next_execution_at: '2026-05-09',
      active: true,
    },
  ];

  // ─── Positions (basketed + standalone) ──────────────────────────
  // For active baskets, each instrument has a Position with an avg_purchase_price + quantity.
  const POSITIONS = [
    // EU Tech 5 — fully populated (8 months of monthly buys @ 200 EUR)
    { id: 'p1',  instrument_id: 'i_asml', basket_id: 'b_eutech', quantity:  0.4912, avg_purchase_price: 695.20, total_invested: 341.61 },
    { id: 'p2',  instrument_id: 'i_sap',  basket_id: 'b_eutech', quantity:  1.6240, avg_purchase_price: 210.30, total_invested: 341.53 },
    { id: 'p3',  instrument_id: 'i_adye', basket_id: 'b_eutech', quantity:  0.2210, avg_purchase_price: 1545.20, total_invested: 341.49 },
    { id: 'p4',  instrument_id: 'i_inf',  basket_id: 'b_eutech', quantity: 10.4520, avg_purchase_price:  32.68, total_invested: 341.58 },
    { id: 'p5',  instrument_id: 'i_stm',  basket_id: 'b_eutech', quantity: 12.4710, avg_purchase_price:  27.39, total_invested: 341.62 },

    // Global ETF Mix — populated
    { id: 'p6',  instrument_id: 'i_vwce', basket_id: 'b_globaletf', quantity:  6.2410, avg_purchase_price: 117.10, total_invested: 730.82 },
    { id: 'p7',  instrument_id: 'i_iwda', basket_id: 'b_globaletf', quantity:  5.4180, avg_purchase_price:  89.92, total_invested: 487.18 },
    { id: 'p8',  instrument_id: 'i_eqqq', basket_id: 'b_globaletf', quantity:  0.7820, avg_purchase_price: 467.40, total_invested: 365.61 },
    { id: 'p9',  instrument_id: 'i_emim', basket_id: 'b_globaletf', quantity:  7.6720, avg_purchase_price:  31.78, total_invested: 243.83 },
    { id: 'p10', instrument_id: 'i_x010', basket_id: 'b_globaletf', quantity:  3.8240, avg_purchase_price:  63.71, total_invested: 243.62 },
    { id: 'p11', instrument_id: 'i_aggh', basket_id: 'b_globaletf', quantity: 41.4720, avg_purchase_price:   4.70, total_invested: 194.92 },
    { id: 'p12', instrument_id: 'i_egov', basket_id: 'b_globaletf', quantity:  0.7270, avg_purchase_price: 134.05, total_invested:  97.45 },
    { id: 'p13', instrument_id: 'i_isgl', basket_id: 'b_globaletf', quantity:  1.5290, avg_purchase_price:  47.85, total_invested:  73.16 },

    // Standalone (mocked) — Ungrouped positions
    { id: 'p14', instrument_id: 'i_tsla', basket_id: null, quantity: 1.2410, avg_purchase_price: 248.50, total_invested: 308.39 },
    { id: 'p15', instrument_id: 'i_alv',  basket_id: null, quantity: 0.9180, avg_purchase_price: 312.20, total_invested: 286.60 },
    { id: 'p16', instrument_id: 'i_amzn', basket_id: null, quantity: 1.0420, avg_purchase_price: 192.40, total_invested: 200.48 },
  ];

  // ─── Order events (Activity feed) ───────────────────────────────
  // Mix of basket buys (rolled-up) and single trades.
  const ORDER_EVENTS = [
    {
      id: 'o1', type: 'basket_buy', basket_id: 'b_eutech',
      amount_eur: 200, executed_at: '2026-04-09T08:30:00Z', status: 'filled',
      auto: true,
      fills: [
        { instrument_id: 'i_asml', eur: 40, shares: 0.0561, fill_price: 712.40 },
        { instrument_id: 'i_sap',  eur: 40, shares: 0.1834, fill_price: 218.05 },
        { instrument_id: 'i_adye', eur: 40, shares: 0.0253, fill_price: 1582.10 },
        { instrument_id: 'i_inf',  eur: 40, shares: 1.1672, fill_price:  34.27 },
        { instrument_id: 'i_stm',  eur: 40, shares: 1.3982, fill_price:  28.61 },
      ],
    },
    {
      id: 'o2', type: 'single_buy', basket_id: null,
      amount_eur: 150, executed_at: '2026-04-02T14:12:00Z', status: 'filled',
      fills: [{ instrument_id: 'i_tsla', eur: 150, shares: 0.5475, fill_price: 273.95 }],
    },
    {
      id: 'o3', type: 'basket_buy', basket_id: 'b_globaletf',
      amount_eur: 250, executed_at: '2026-03-28T10:04:00Z', status: 'filled',
      auto: false,
      fills: [
        { instrument_id: 'i_vwce', eur: 75.00, shares: 0.6234, fill_price: 120.30 },
        { instrument_id: 'i_iwda', eur: 50.00, shares: 0.5408, fill_price:  92.45 },
        { instrument_id: 'i_eqqq', eur: 37.50, shares: 0.0784, fill_price: 478.20 },
        { instrument_id: 'i_emim', eur: 25.00, shares: 0.7864, fill_price:  31.79 },
        { instrument_id: 'i_x010', eur: 25.00, shares: 0.3905, fill_price:  64.02 },
        { instrument_id: 'i_aggh', eur: 20.00, shares: 4.2553, fill_price:   4.70 },
        { instrument_id: 'i_egov', eur: 10.00, shares: 0.0746, fill_price: 134.10 },
        { instrument_id: 'i_isgl', eur:  7.50, shares: 0.1568, fill_price:  47.83 },
      ],
    },
    {
      id: 'o4', type: 'basket_buy', basket_id: 'b_eutech',
      amount_eur: 200, executed_at: '2026-03-09T08:30:00Z', status: 'filled',
      auto: true,
      fills: [
        { instrument_id: 'i_asml', eur: 40, shares: 0.0581, fill_price: 688.40 },
        { instrument_id: 'i_sap',  eur: 40, shares: 0.1908, fill_price: 209.65 },
        { instrument_id: 'i_adye', eur: 40, shares: 0.0264, fill_price: 1515.20 },
        { instrument_id: 'i_inf',  eur: 40, shares: 1.2280, fill_price:  32.58 },
        { instrument_id: 'i_stm',  eur: 40, shares: 1.4612, fill_price:  27.38 },
      ],
    },
    {
      id: 'o5', type: 'single_buy', basket_id: null,
      amount_eur: 200, executed_at: '2026-02-21T09:42:00Z', status: 'filled',
      fills: [{ instrument_id: 'i_alv', eur: 200, shares: 0.6404, fill_price: 312.20 }],
    },
    {
      id: 'o6', type: 'basket_buy', basket_id: 'b_eutech',
      amount_eur: 200, executed_at: '2026-02-09T08:30:00Z', status: 'filled',
      auto: true,
      fills: [
        { instrument_id: 'i_asml', eur: 40, shares: 0.0589, fill_price: 678.90 },
        { instrument_id: 'i_sap',  eur: 40, shares: 0.1925, fill_price: 207.80 },
        { instrument_id: 'i_adye', eur: 40, shares: 0.0269, fill_price: 1488.50 },
        { instrument_id: 'i_inf',  eur: 40, shares: 1.2620, fill_price:  31.70 },
        { instrument_id: 'i_stm',  eur: 40, shares: 1.4870, fill_price:  26.90 },
      ],
    },
  ];

  // Cash balance
  const ACCOUNT = { cash_eur: 4218.42, name: 'Lena' };

  // ─── Lifecycle helpers ──────────────────────────────────────────
  function lifecycleState(basket, positions) {
    if (!basket || !basket.composition || basket.composition.length === 0) return 'ghost';
    const hasPos = positions.some(p => p.basket_id === basket.id);
    if (!basket.weights_set) return 'passive';
    if (basket.weights_set && !hasPos) return 'weighted';
    return 'active';
  }

  // ─── Formatters ─────────────────────────────────────────────────
  const fmtEur = (n, opts = {}) => {
    const { decimals = 2, sign = false } = opts;
    if (n === null || n === undefined || isNaN(n)) return '—';
    const abs = Math.abs(n).toLocaleString('de-DE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    });
    const s = sign ? (n > 0 ? '+' : n < 0 ? '−' : '') : (n < 0 ? '−' : '');
    return `${s}${abs}\u00A0€`;
  };
  const fmtPct = (n, opts = {}) => {
    const { decimals = 2, sign = false } = opts;
    if (n === null || n === undefined || isNaN(n)) return '—';
    const abs = Math.abs(n).toFixed(decimals);
    const s = sign ? (n > 0 ? '+' : n < 0 ? '−' : '') : (n < 0 ? '−' : '');
    return `${s}${abs}%`;
  };
  const fmtSigned = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(2);

  Object.assign(window, {
    SEED: {
      INSTRUMENTS, GHOSTS, BASKETS, CLAIMED_GHOST_IDS,
      RECURRING_PLANS, POSITIONS, ORDER_EVENTS, ACCOUNT,
    },
    lifecycleState, fmtEur, fmtPct, fmtSigned,
  });
})();
