/**
 * Synthetic training data for the RPS (Recovery Probability Score) engine.
 *
 * 400 total records — 100 per error class.
 * Train / test split: first 80 per class = training, last 20 per class = test.
 *
 * Labels:
 *   errorClass             — type of billing error
 *   overchargeRatio        — overcharge / billed (0–1)
 *   billedToAllowableRatio — billed / allowable (>=1)
 *   overchargeAmount       — absolute dollar overcharge
 *   hasGuidelineCitation   — NCCI edit, AMA CPT rule, Fair Health benchmark cited
 *   providerInNetwork      — in-network contract violations are easier to enforce
 *   disputeFiled           — was a dispute filed?
 *   disputeWon             — did it succeed?
 *
 * Approximate win rates by class (derived from published medical billing audit literature):
 *   Duplicate charge     : ~92%  (objective — same CPT, date, provider)
 *   Fee schedule         : ~88%  (in-network contract enforcement)
 *   Upcoding             : ~74%  (requires chart review; provider can argue)
 *   Unbundling           : ~61%  (modifier exceptions frequently contested)
 */

export type ErrorClass = 'upcoding' | 'duplicate' | 'unbundling' | 'fee-schedule' | 'none'

export interface TrainingRecord {
  errorClass: ErrorClass
  overchargeRatio: number
  billedToAllowableRatio: number
  overchargeAmount: number
  hasGuidelineCitation: boolean
  providerInNetwork: boolean
  disputeFiled: boolean
  disputeWon: boolean
}

function rec(
  errorClass: ErrorClass,
  billed: number,
  allowable: number,
  hasGuidelineCitation: boolean,
  providerInNetwork: boolean,
  disputeWon: boolean
): TrainingRecord {
  const overcharge = billed - allowable
  return {
    errorClass,
    overchargeRatio: overcharge / billed,
    billedToAllowableRatio: allowable > 0 ? billed / allowable : billed,
    overchargeAmount: overcharge,
    hasGuidelineCitation,
    providerInNetwork,
    disputeFiled: true,
    disputeWon,
  }
}

export const TRAINING_DATA: TrainingRecord[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // DUPLICATE CHARGE  — 100 records  (records 0–99)
  // Win rate target: ~92%  |  Train: 0–79  |  Test: 80–99
  // Loses mainly on very small amounts or when no citation exists
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Training set: records 0–79 ─────────────────────────────────────────────
  rec('duplicate', 710,  355,  true,  true,  true),
  rec('duplicate', 420,  210,  true,  true,  true),
  rec('duplicate', 890,  445,  true,  false, true),
  rec('duplicate', 60,   30,   true,  true,  true),
  rec('duplicate', 340,  170,  true,  true,  true),
  rec('duplicate', 1200, 600,  true,  true,  true),
  rec('duplicate', 185,  92,   true,  false, true),
  rec('duplicate', 540,  270,  true,  true,  true),
  rec('duplicate', 90,   45,   true,  true,  true),
  rec('duplicate', 760,  380,  true,  true,  true),
  rec('duplicate', 230,  115,  true,  false, true),
  rec('duplicate', 480,  240,  true,  true,  true),
  rec('duplicate', 320,  160,  true,  true,  true),
  rec('duplicate', 640,  320,  true,  true,  true),
  rec('duplicate', 110,  55,   true,  true,  true),
  rec('duplicate', 870,  435,  true,  false, true),
  rec('duplicate', 200,  100,  true,  true,  true),
  rec('duplicate', 560,  280,  true,  true,  true),
  rec('duplicate', 75,   37,   true,  true,  false),
  rec('duplicate', 940,  470,  true,  true,  true),
  rec('duplicate', 1500, 750,  true,  true,  true),
  rec('duplicate', 280,  140,  true,  false, true),
  rec('duplicate', 410,  205,  true,  true,  true),
  rec('duplicate', 620,  310,  true,  true,  true),
  rec('duplicate', 95,   47,   true,  true,  false),
  rec('duplicate', 730,  365,  true,  true,  true),
  rec('duplicate', 450,  225,  true,  false, true),
  rec('duplicate', 310,  155,  true,  true,  true),
  rec('duplicate', 1100, 550,  true,  true,  true),
  rec('duplicate', 660,  330,  true,  true,  true),
  rec('duplicate', 820,  410,  true,  false, true),
  rec('duplicate', 190,  95,   true,  true,  true),
  rec('duplicate', 500,  250,  true,  true,  true),
  rec('duplicate', 145,  72,   false, true,  false),
  rec('duplicate', 980,  490,  true,  true,  true),
  rec('duplicate', 370,  185,  true,  true,  true),
  rec('duplicate', 580,  290,  true,  false, true),
  rec('duplicate', 250,  125,  true,  true,  true),
  rec('duplicate', 690,  345,  true,  true,  true),
  rec('duplicate', 130,  65,   true,  true,  true),
  // new training records 40–79
  rec('duplicate', 1350, 675,  true,  true,  true),
  rec('duplicate', 460,  230,  true,  true,  true),
  rec('duplicate', 810,  405,  true,  false, true),
  rec('duplicate', 270,  135,  true,  true,  true),
  rec('duplicate', 1050, 525,  true,  true,  true),
  rec('duplicate', 380,  190,  true,  true,  true),
  rec('duplicate', 920,  460,  true,  false, true),
  rec('duplicate', 155,  77,   true,  true,  true),
  rec('duplicate', 670,  335,  true,  true,  true),
  rec('duplicate', 1700, 850,  true,  true,  true),
  rec('duplicate', 490,  245,  true,  true,  true),
  rec('duplicate', 340,  170,  true,  false, true),
  rec('duplicate', 780,  390,  true,  true,  true),
  rec('duplicate', 1250, 625,  true,  true,  true),
  rec('duplicate', 215,  107,  true,  true,  true),
  rec('duplicate', 600,  300,  true,  false, true),
  rec('duplicate', 88,   44,   false, false, false),
  rec('duplicate', 1400, 700,  true,  true,  true),
  rec('duplicate', 520,  260,  true,  true,  true),
  rec('duplicate', 350,  175,  true,  true,  true),
  rec('duplicate', 2100, 1050, true,  true,  true),
  rec('duplicate', 440,  220,  true,  true,  true),
  rec('duplicate', 760,  380,  true,  false, true),
  rec('duplicate', 170,  85,   true,  true,  true),
  rec('duplicate', 1600, 800,  true,  true,  true),
  rec('duplicate', 680,  340,  true,  true,  true),
  rec('duplicate', 290,  145,  true,  false, true),
  rec('duplicate', 1800, 900,  true,  true,  true),
  rec('duplicate', 420,  210,  true,  true,  true),
  rec('duplicate', 560,  280,  true,  true,  true),
  rec('duplicate', 104,  52,   false, true,  false),
  rec('duplicate', 930,  465,  true,  true,  true),
  rec('duplicate', 2400, 1200, true,  true,  true),
  rec('duplicate', 305,  152,  true,  true,  true),
  rec('duplicate', 715,  357,  true,  false, true),
  rec('duplicate', 1150, 575,  true,  true,  true),
  rec('duplicate', 470,  235,  true,  true,  true),
  rec('duplicate', 850,  425,  true,  true,  true),
  rec('duplicate', 225,  112,  true,  true,  true),
  rec('duplicate', 990,  495,  true,  false, true),

  // ── Test set: records 80–99 ────────────────────────────────────────────────
  rec('duplicate', 630,  315,  true,  true,  true),
  rec('duplicate', 1100, 550,  true,  true,  true),
  rec('duplicate', 390,  195,  true,  false, true),
  rec('duplicate', 840,  420,  true,  true,  true),
  rec('duplicate', 66,   33,   false, false, false),
  rec('duplicate', 1280, 640,  true,  true,  true),
  rec('duplicate', 520,  260,  true,  true,  true),
  rec('duplicate', 740,  370,  true,  false, true),
  rec('duplicate', 1950, 975,  true,  true,  true),
  rec('duplicate', 310,  155,  true,  true,  true),
  rec('duplicate', 580,  290,  true,  true,  true),
  rec('duplicate', 1450, 725,  true,  true,  true),
  rec('duplicate', 275,  137,  true,  true,  true),
  rec('duplicate', 870,  435,  true,  false, true),
  rec('duplicate', 72,   36,   true,  true,  false),
  rec('duplicate', 1600, 800,  true,  true,  true),
  rec('duplicate', 430,  215,  true,  true,  true),
  rec('duplicate', 695,  347,  true,  true,  true),
  rec('duplicate', 1100, 550,  true,  false, true),
  rec('duplicate', 240,  120,  true,  true,  true),

  // ═══════════════════════════════════════════════════════════════════════════
  // FEE SCHEDULE VIOLATION  — 100 records  (records 100–199)
  // Win rate target: ~88%  |  Train: 100–179  |  Test: 180–199
  // In-network providers bound by contract — strongest cases
  // Losses mainly out-of-network with no benchmark citation
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Training set: records 100–179 ─────────────────────────────────────────
  rec('fee-schedule', 2840, 1220, true,  true,  true),
  rec('fee-schedule', 4800, 1660, true,  true,  true),
  rec('fee-schedule', 1900, 850,  true,  true,  true),
  rec('fee-schedule', 3200, 1400, true,  true,  true),
  rec('fee-schedule', 960,  420,  true,  true,  true),
  rec('fee-schedule', 5500, 2100, true,  true,  true),
  rec('fee-schedule', 1250, 680,  true,  true,  true),
  rec('fee-schedule', 780,  390,  false, false, false),
  rec('fee-schedule', 2100, 900,  true,  true,  true),
  rec('fee-schedule', 3900, 1600, true,  true,  true),
  rec('fee-schedule', 1450, 720,  true,  false, false),
  rec('fee-schedule', 6200, 2400, true,  true,  true),
  rec('fee-schedule', 870,  460,  true,  true,  true),
  rec('fee-schedule', 2300, 1050, true,  true,  true),
  rec('fee-schedule', 4100, 1800, true,  true,  true),
  rec('fee-schedule', 1650, 800,  true,  true,  true),
  rec('fee-schedule', 990,  500,  true,  true,  false),
  rec('fee-schedule', 3400, 1500, true,  true,  true),
  rec('fee-schedule', 7800, 3100, true,  true,  true),
  rec('fee-schedule', 1100, 580,  false, true,  true),
  rec('fee-schedule', 2600, 1100, true,  true,  true),
  rec('fee-schedule', 5100, 2200, true,  true,  true),
  rec('fee-schedule', 940,  510,  true,  false, false),
  rec('fee-schedule', 1800, 820,  true,  true,  true),
  rec('fee-schedule', 3700, 1600, true,  true,  true),
  rec('fee-schedule', 1350, 700,  true,  true,  true),
  rec('fee-schedule', 4500, 1900, true,  true,  true),
  rec('fee-schedule', 680,  370,  false, false, false),
  rec('fee-schedule', 2900, 1250, true,  true,  true),
  rec('fee-schedule', 1200, 630,  true,  true,  true),
  rec('fee-schedule', 8400, 3300, true,  true,  true),
  rec('fee-schedule', 1700, 790,  true,  true,  true),
  rec('fee-schedule', 3100, 1380, true,  true,  true),
  rec('fee-schedule', 920,  480,  true,  true,  false),
  rec('fee-schedule', 5800, 2500, true,  true,  true),
  rec('fee-schedule', 2200, 970,  true,  false, false),
  rec('fee-schedule', 1550, 750,  true,  true,  true),
  rec('fee-schedule', 4300, 1850, true,  true,  true),
  rec('fee-schedule', 760,  400,  false, true,  true),
  rec('fee-schedule', 3600, 1550, true,  true,  true),
  // new training records 140–179
  rec('fee-schedule', 2450, 1080, true,  true,  true),
  rec('fee-schedule', 6700, 2800, true,  true,  true),
  rec('fee-schedule', 1320, 670,  true,  true,  true),
  rec('fee-schedule', 4950, 2050, true,  true,  true),
  rec('fee-schedule', 880,  450,  true,  true,  true),
  rec('fee-schedule', 3350, 1480, true,  true,  true),
  rec('fee-schedule', 1080, 560,  false, false, false),
  rec('fee-schedule', 7200, 2950, true,  true,  true),
  rec('fee-schedule', 2750, 1190, true,  true,  true),
  rec('fee-schedule', 1480, 730,  true,  true,  true),
  rec('fee-schedule', 5300, 2250, true,  true,  true),
  rec('fee-schedule', 830,  430,  true,  true,  true),
  rec('fee-schedule', 3800, 1650, true,  true,  true),
  rec('fee-schedule', 9100, 3600, true,  true,  true),
  rec('fee-schedule', 1600, 780,  true,  true,  true),
  rec('fee-schedule', 2050, 920,  true,  false, false),
  rec('fee-schedule', 4700, 2000, true,  true,  true),
  rec('fee-schedule', 1150, 610,  false, true,  true),
  rec('fee-schedule', 3250, 1420, true,  true,  true),
  rec('fee-schedule', 6400, 2650, true,  true,  true),
  rec('fee-schedule', 975,  520,  true,  true,  true),
  rec('fee-schedule', 2350, 1040, true,  true,  true),
  rec('fee-schedule', 4200, 1780, true,  true,  true),
  rec('fee-schedule', 1380, 710,  true,  true,  true),
  rec('fee-schedule', 720,  380,  false, false, false),
  rec('fee-schedule', 5650, 2380, true,  true,  true),
  rec('fee-schedule', 1900, 860,  true,  true,  true),
  rec('fee-schedule', 3050, 1320, true,  true,  true),
  rec('fee-schedule', 8800, 3450, true,  true,  true),
  rec('fee-schedule', 1750, 810,  true,  true,  true),
  rec('fee-schedule', 2680, 1160, true,  false, false),
  rec('fee-schedule', 4400, 1870, true,  true,  true),
  rec('fee-schedule', 1020, 540,  true,  true,  true),
  rec('fee-schedule', 3500, 1520, true,  true,  true),
  rec('fee-schedule', 6100, 2550, true,  true,  true),
  rec('fee-schedule', 860,  460,  true,  true,  true),
  rec('fee-schedule', 2500, 1090, true,  true,  true),
  rec('fee-schedule', 1275, 660,  true,  true,  true),
  rec('fee-schedule', 4050, 1740, true,  true,  true),
  rec('fee-schedule', 7500, 3050, true,  true,  true),

  // ── Test set: records 180–199 ──────────────────────────────────────────────
  rec('fee-schedule', 3100, 1350, true,  true,  true),
  rec('fee-schedule', 1480, 720,  true,  true,  true),
  rec('fee-schedule', 5200, 2200, true,  true,  true),
  rec('fee-schedule', 950,  490,  false, false, false),
  rec('fee-schedule', 2750, 1200, true,  true,  true),
  rec('fee-schedule', 6900, 2850, true,  true,  true),
  rec('fee-schedule', 1350, 690,  true,  true,  true),
  rec('fee-schedule', 4100, 1750, true,  true,  true),
  rec('fee-schedule', 880,  470,  true,  false, false),
  rec('fee-schedule', 3300, 1450, true,  true,  true),
  rec('fee-schedule', 8200, 3300, true,  true,  true),
  rec('fee-schedule', 1700, 800,  true,  true,  true),
  rec('fee-schedule', 2200, 980,  true,  true,  true),
  rec('fee-schedule', 5500, 2350, true,  true,  true),
  rec('fee-schedule', 1050, 550,  false, true,  true),
  rec('fee-schedule', 3800, 1650, true,  true,  true),
  rec('fee-schedule', 1200, 620,  true,  true,  true),
  rec('fee-schedule', 4600, 1960, true,  true,  true),
  rec('fee-schedule', 790,  410,  false, false, false),
  rec('fee-schedule', 2900, 1260, true,  true,  true),

  // ═══════════════════════════════════════════════════════════════════════════
  // UPCODING  — 100 records  (records 200–299)
  // Win rate target: ~74%  |  Train: 200–279  |  Test: 280–299
  // Requires chart review — provider can argue documentation supports higher code
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Training set: records 200–279 ─────────────────────────────────────────
  rec('upcoding', 425,  211,  true,  true,  true),
  rec('upcoding', 1240, 680,  true,  true,  true),
  rec('upcoding', 380,  195,  true,  false, false),
  rec('upcoding', 620,  310,  true,  true,  true),
  rec('upcoding', 890,  445,  true,  true,  false),
  rec('upcoding', 1450, 720,  true,  true,  true),
  rec('upcoding', 290,  158,  false, true,  false),
  rec('upcoding', 760,  380,  true,  true,  true),
  rec('upcoding', 510,  265,  true,  false, true),
  rec('upcoding', 1100, 560,  true,  true,  true),
  rec('upcoding', 340,  185,  false, false, false),
  rec('upcoding', 680,  340,  true,  true,  true),
  rec('upcoding', 920,  480,  true,  true,  false),
  rec('upcoding', 1650, 820,  true,  true,  true),
  rec('upcoding', 430,  225,  true,  true,  true),
  rec('upcoding', 570,  295,  false, true,  false),
  rec('upcoding', 840,  430,  true,  false, true),
  rec('upcoding', 1380, 700,  true,  true,  true),
  rec('upcoding', 260,  145,  false, false, false),
  rec('upcoding', 950,  490,  true,  true,  true),
  rec('upcoding', 720,  370,  true,  true,  false),
  rec('upcoding', 1200, 610,  true,  true,  true),
  rec('upcoding', 390,  205,  false, true,  false),
  rec('upcoding', 830,  425,  true,  true,  true),
  rec('upcoding', 460,  240,  true,  false, false),
  rec('upcoding', 1050, 535,  true,  true,  true),
  rec('upcoding', 315,  168,  false, false, false),
  rec('upcoding', 670,  345,  true,  true,  true),
  rec('upcoding', 1320, 665,  true,  true,  true),
  rec('upcoding', 490,  255,  true,  true,  false),
  rec('upcoding', 780,  400,  true,  false, true),
  rec('upcoding', 1480, 745,  true,  true,  true),
  rec('upcoding', 360,  190,  false, true,  false),
  rec('upcoding', 910,  465,  true,  true,  true),
  rec('upcoding', 540,  280,  true,  true,  false),
  rec('upcoding', 1170, 590,  true,  true,  true),
  rec('upcoding', 420,  220,  false, false, false),
  rec('upcoding', 650,  335,  true,  true,  true),
  rec('upcoding', 880,  450,  true,  false, true),
  rec('upcoding', 1400, 710,  true,  true,  true),
  // new training records 240–279
  rec('upcoding', 740,  380,  true,  true,  true),
  rec('upcoding', 1550, 780,  true,  true,  true),
  rec('upcoding', 310,  170,  false, false, false),
  rec('upcoding', 960,  490,  true,  true,  true),
  rec('upcoding', 530,  275,  true,  true,  false),
  rec('upcoding', 1260, 640,  true,  true,  true),
  rec('upcoding', 440,  230,  false, true,  false),
  rec('upcoding', 870,  445,  true,  false, true),
  rec('upcoding', 1700, 855,  true,  true,  true),
  rec('upcoding', 290,  155,  false, false, false),
  rec('upcoding', 760,  390,  true,  true,  true),
  rec('upcoding', 1130, 570,  true,  true,  false),
  rec('upcoding', 480,  250,  true,  true,  true),
  rec('upcoding', 1350, 680,  true,  true,  true),
  rec('upcoding', 600,  315,  false, true,  false),
  rec('upcoding', 1010, 520,  true,  true,  true),
  rec('upcoding', 350,  185,  false, false, false),
  rec('upcoding', 820,  420,  true,  false, true),
  rec('upcoding', 1600, 810,  true,  true,  true),
  rec('upcoding', 500,  260,  true,  true,  false),
  rec('upcoding', 1080, 545,  true,  true,  true),
  rec('upcoding', 375,  200,  false, true,  false),
  rec('upcoding', 700,  360,  true,  true,  true),
  rec('upcoding', 1420, 715,  true,  true,  true),
  rec('upcoding', 560,  290,  true,  false, false),
  rec('upcoding', 990,  505,  true,  true,  true),
  rec('upcoding', 270,  148,  false, false, false),
  rec('upcoding', 1180, 595,  true,  true,  true),
  rec('upcoding', 645,  335,  true,  true,  false),
  rec('upcoding', 1300, 660,  true,  true,  true),
  rec('upcoding', 415,  215,  false, true,  false),
  rec('upcoding', 850,  435,  true,  false, true),
  rec('upcoding', 1500, 755,  true,  true,  true),
  rec('upcoding', 470,  245,  true,  true,  true),
  rec('upcoding', 925,  475,  true,  true,  false),
  rec('upcoding', 1240, 625,  true,  true,  true),
  rec('upcoding', 330,  180,  false, false, false),
  rec('upcoding', 780,  400,  true,  true,  true),
  rec('upcoding', 1060, 540,  true,  true,  true),
  rec('upcoding', 590,  305,  true,  false, true),

  // ── Test set: records 280–299 ──────────────────────────────────────────────
  rec('upcoding', 910,  465,  true,  true,  true),
  rec('upcoding', 1450, 730,  true,  true,  true),
  rec('upcoding', 380,  200,  false, false, false),
  rec('upcoding', 720,  370,  true,  true,  true),
  rec('upcoding', 1100, 560,  true,  true,  false),
  rec('upcoding', 505,  265,  true,  false, true),
  rec('upcoding', 290,  155,  false, true,  false),
  rec('upcoding', 840,  430,  true,  true,  true),
  rec('upcoding', 1350, 680,  true,  true,  true),
  rec('upcoding', 460,  240,  true,  true,  false),
  rec('upcoding', 670,  345,  true,  true,  true),
  rec('upcoding', 1200, 610,  true,  true,  true),
  rec('upcoding', 340,  180,  false, false, false),
  rec('upcoding', 980,  500,  true,  true,  true),
  rec('upcoding', 520,  270,  false, true,  false),
  rec('upcoding', 1550, 780,  true,  true,  true),
  rec('upcoding', 760,  390,  true,  false, true),
  rec('upcoding', 430,  225,  true,  true,  false),
  rec('upcoding', 1050, 535,  true,  true,  true),
  rec('upcoding', 615,  320,  true,  true,  true),

  // ═══════════════════════════════════════════════════════════════════════════
  // UNBUNDLING  — 100 records  (records 300–399)
  // Win rate target: ~61%  |  Train: 300–379  |  Test: 380–399
  // Providers often argue modifier exceptions (e.g. -59) — most contested error
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Training set: records 300–379 ─────────────────────────────────────────
  rec('unbundling', 1580, 0,  true,  true,  true),
  rec('unbundling', 4200, 0,  true,  true,  false),
  rec('unbundling', 3100, 0,  true,  false, true),
  rec('unbundling', 890,  0,  true,  true,  true),
  rec('unbundling', 2400, 0,  false, true,  false),
  rec('unbundling', 1200, 0,  true,  true,  true),
  rec('unbundling', 5600, 0,  true,  true,  true),
  rec('unbundling', 740,  0,  false, false, false),
  rec('unbundling', 3800, 0,  true,  true,  false),
  rec('unbundling', 1650, 0,  true,  true,  true),
  rec('unbundling', 920,  0,  true,  false, false),
  rec('unbundling', 2800, 0,  true,  true,  true),
  rec('unbundling', 4900, 0,  true,  true,  true),
  rec('unbundling', 670,  0,  false, true,  false),
  rec('unbundling', 1380, 0,  true,  true,  true),
  rec('unbundling', 3200, 0,  false, false, false),
  rec('unbundling', 2100, 0,  true,  true,  false),
  rec('unbundling', 5100, 0,  true,  true,  true),
  rec('unbundling', 810,  0,  true,  false, true),
  rec('unbundling', 1900, 0,  true,  true,  true),
  rec('unbundling', 3500, 0,  false, true,  false),
  rec('unbundling', 1050, 0,  true,  true,  true),
  rec('unbundling', 2650, 0,  true,  false, false),
  rec('unbundling', 4400, 0,  true,  true,  true),
  rec('unbundling', 760,  0,  false, false, false),
  rec('unbundling', 1750, 0,  true,  true,  false),
  rec('unbundling', 3000, 0,  true,  true,  true),
  rec('unbundling', 6200, 0,  true,  true,  true),
  rec('unbundling', 980,  0,  false, true,  false),
  rec('unbundling', 2300, 0,  true,  true,  true),
  rec('unbundling', 1450, 0,  true,  false, true),
  rec('unbundling', 3700, 0,  true,  true,  false),
  rec('unbundling', 850,  0,  false, false, false),
  rec('unbundling', 2050, 0,  true,  true,  true),
  rec('unbundling', 4600, 0,  true,  true,  true),
  rec('unbundling', 1120, 0,  true,  false, false),
  rec('unbundling', 2900, 0,  true,  true,  true),
  rec('unbundling', 690,  0,  false, true,  false),
  rec('unbundling', 3400, 0,  true,  true,  false),
  rec('unbundling', 1600, 0,  true,  true,  true),
  // new training records 340–379
  rec('unbundling', 2200, 0,  true,  true,  true),
  rec('unbundling', 5800, 0,  true,  true,  true),
  rec('unbundling', 780,  0,  false, false, false),
  rec('unbundling', 3600, 0,  true,  true,  false),
  rec('unbundling', 1350, 0,  true,  true,  true),
  rec('unbundling', 2700, 0,  false, true,  false),
  rec('unbundling', 4100, 0,  true,  true,  true),
  rec('unbundling', 960,  0,  true,  false, false),
  rec('unbundling', 1800, 0,  true,  true,  true),
  rec('unbundling', 6500, 0,  true,  true,  true),
  rec('unbundling', 830,  0,  false, false, false),
  rec('unbundling', 3300, 0,  true,  true,  false),
  rec('unbundling', 1500, 0,  true,  true,  true),
  rec('unbundling', 2500, 0,  true,  false, true),
  rec('unbundling', 4800, 0,  false, true,  false),
  rec('unbundling', 1150, 0,  true,  true,  true),
  rec('unbundling', 3900, 0,  true,  true,  true),
  rec('unbundling', 720,  0,  false, false, false),
  rec('unbundling', 2050, 0,  true,  true,  false),
  rec('unbundling', 5300, 0,  true,  true,  true),
  rec('unbundling', 1020, 0,  true,  false, false),
  rec('unbundling', 2850, 0,  true,  true,  true),
  rec('unbundling', 3600, 0,  false, true,  false),
  rec('unbundling', 1700, 0,  true,  true,  true),
  rec('unbundling', 4300, 0,  true,  true,  false),
  rec('unbundling', 900,  0,  false, false, false),
  rec('unbundling', 2150, 0,  true,  true,  true),
  rec('unbundling', 6800, 0,  true,  true,  true),
  rec('unbundling', 1250, 0,  true,  false, false),
  rec('unbundling', 3100, 0,  true,  true,  true),
  rec('unbundling', 870,  0,  false, true,  false),
  rec('unbundling', 4500, 0,  true,  true,  true),
  rec('unbundling', 1650, 0,  true,  true,  false),
  rec('unbundling', 2400, 0,  true,  false, true),
  rec('unbundling', 5100, 0,  false, true,  false),
  rec('unbundling', 1100, 0,  true,  true,  true),
  rec('unbundling', 3800, 0,  true,  true,  true),
  rec('unbundling', 750,  0,  false, false, false),
  rec('unbundling', 2600, 0,  true,  true,  false),
  rec('unbundling', 1950, 0,  true,  true,  true),

  // ── Test set: records 380–399 ──────────────────────────────────────────────
  rec('unbundling', 2800, 0,  true,  true,  true),
  rec('unbundling', 4200, 0,  true,  true,  false),
  rec('unbundling', 1100, 0,  true,  false, true),
  rec('unbundling', 680,  0,  false, false, false),
  rec('unbundling', 3500, 0,  true,  true,  true),
  rec('unbundling', 1800, 0,  false, true,  false),
  rec('unbundling', 5400, 0,  true,  true,  true),
  rec('unbundling', 950,  0,  true,  true,  false),
  rec('unbundling', 2300, 0,  true,  false, false),
  rec('unbundling', 6100, 0,  true,  true,  true),
  rec('unbundling', 1350, 0,  true,  true,  true),
  rec('unbundling', 3200, 0,  false, true,  false),
  rec('unbundling', 820,  0,  false, false, false),
  rec('unbundling', 4700, 0,  true,  true,  true),
  rec('unbundling', 1600, 0,  true,  true,  false),
  rec('unbundling', 2700, 0,  true,  true,  true),
  rec('unbundling', 1050, 0,  true,  false, false),
  rec('unbundling', 3900, 0,  true,  true,  true),
  rec('unbundling', 760,  0,  false, false, false),
  rec('unbundling', 2100, 0,  true,  true,  true),
]

/**
 * Returns the 80/20 train/test split.
 * First 80 records of each class  → training
 * Last  20 records of each class  → test
 */
export const TRAIN_PER_CLASS = 80
export const TEST_PER_CLASS  = 20

export function getTrainTestSplit(): { train: TrainingRecord[]; test: TrainingRecord[] } {
  const classes: ErrorClass[] = ['duplicate', 'fee-schedule', 'upcoding', 'unbundling']
  const train: TrainingRecord[] = []
  const test: TrainingRecord[]  = []

  for (const cls of classes) {
    const classRecords = TRAINING_DATA.filter(r => r.errorClass === cls)
    train.push(...classRecords.slice(0, TRAIN_PER_CLASS))
    test.push(...classRecords.slice(TRAIN_PER_CLASS))
  }

  return { train, test }
}
