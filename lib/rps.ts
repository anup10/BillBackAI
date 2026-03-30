/**
 * RPS (Recovery Probability Score) Scoring Engine
 *
 * Pipeline:
 *  1. At module load, compute per-class statistics from synthetic training data.
 *  2. For each claim, extract numeric features.
 *  3. Apply logistic regression adjustment on top of the class base rate.
 *  4. Compute confidence score based on training sample size and feature distance.
 *  5. Generate a human-readable rationale string.
 *
 * Probability output: 0–1 (converted to 0–100 for display as `rps`)
 */

import { getTrainTestSplit, TrainingRecord, ErrorClass } from './synthetic-training-data'
import { Claim } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassStats {
  sampleSize: number
  winRate: number          // base rate: wins / total disputes filed
  avgOverchargeRatio: number
  avgBilledToAllowable: number
  avgOverchargeAmount: number
  guidelineWinRate: number   // win rate when guideline citation present
  noGuidelineWinRate: number // win rate when no citation
  inNetworkWinRate: number
  outNetworkWinRate: number
}

interface ScoredClaim {
  probability: number  // 0–1
  confidence: number   // 0–1
  rationale: string
}

// ─── Step 1: Build class statistics from training data ───────────────────────

function buildClassStats(data: TrainingRecord[]): Map<ErrorClass, ClassStats> {
  const stats = new Map<ErrorClass, ClassStats>()
  const classes: ErrorClass[] = ['duplicate', 'fee-schedule', 'upcoding', 'unbundling']

  for (const cls of classes) {
    const records = data.filter(r => r.errorClass === cls && r.disputeFiled)
    const wins = records.filter(r => r.disputeWon)

    const guidelineRecords = records.filter(r => r.hasGuidelineCitation)
    const noGuidelineRecords = records.filter(r => !r.hasGuidelineCitation)
    const inNetworkRecords = records.filter(r => r.providerInNetwork)
    const outNetworkRecords = records.filter(r => !r.providerInNetwork)

    stats.set(cls, {
      sampleSize: records.length,
      winRate: records.length > 0 ? wins.length / records.length : 0.5,
      avgOverchargeRatio: avg(records.map(r => r.overchargeRatio)),
      avgBilledToAllowable: avg(records.map(r => r.billedToAllowableRatio)),
      avgOverchargeAmount: avg(records.map(r => r.overchargeAmount)),
      guidelineWinRate: guidelineRecords.length > 0
        ? guidelineRecords.filter(r => r.disputeWon).length / guidelineRecords.length
        : 0.5,
      noGuidelineWinRate: noGuidelineRecords.length > 0
        ? noGuidelineRecords.filter(r => r.disputeWon).length / noGuidelineRecords.length
        : 0.3,
      inNetworkWinRate: inNetworkRecords.length > 0
        ? inNetworkRecords.filter(r => r.disputeWon).length / inNetworkRecords.length
        : 0.5,
      outNetworkWinRate: outNetworkRecords.length > 0
        ? outNetworkRecords.filter(r => r.disputeWon).length / outNetworkRecords.length
        : 0.4,
    })
  }

  return stats
}

// ─── Step 2: Feature extraction from a Claim ─────────────────────────────────

interface ClaimFeatures {
  overchargeRatio: number        // overcharge / billed
  billedToAllowableRatio: number // billed / allowable (unbundling uses billed / 1)
  overchargeAmount: number
  hasGuidelineCitation: boolean  // inferred from details field
  providerInNetwork: boolean     // inferred from errorClass + context
}

function extractFeatures(claim: Claim): ClaimFeatures {
  const overcharge = claim.overcharge ?? 0
  const billed = claim.billed ?? 1
  const allowable = claim.allowable > 0 ? claim.allowable : 1

  // For unbundling the allowable is 0 (shouldn't be billed at all)
  // use billed as denominator so ratio = 1.0 (100% overcharge)
  const billedToAllowable = claim.errorClass === 'unbundling'
    ? billed  // treat as billed / 1 → just the dollar amount context
    : billed / allowable

  // Infer guideline citation from details text
  const details = (claim.details ?? '').toLowerCase()
  const hasGuidelineCitation =
    details.includes('ncci') ||
    details.includes('ama') ||
    details.includes('cpt') ||
    details.includes('per') ||
    details.includes('bundl') ||
    details.includes('edit') ||
    details.includes('guideline') ||
    details.includes('commercial') ||
    details.includes('fair health') ||
    details.includes('benchmark')

  // Infer in-network from details / error class
  // Fee schedule violations on in-network providers are stronger
  const providerInNetwork =
    details.includes('in-network') ||
    details.includes('contracted') ||
    details.includes('contract') ||
    claim.errorClass === 'fee-schedule' // fee schedule violations typically imply contract

  return {
    overchargeRatio: billed > 0 ? overcharge / billed : 0,
    billedToAllowableRatio: billedToAllowable,
    overchargeAmount: overcharge,
    hasGuidelineCitation,
    providerInNetwork,
  }
}

// ─── Step 3: Logistic regression scoring ─────────────────────────────────────
//
// sigmoid(log_odds) → probability
// log_odds = logit(base_rate) + Σ(weight_i * (feature_i - mean_i) / std_i)
//
// Weights were chosen to reflect domain knowledge:
//   - overcharge ratio has the strongest signal
//   - billed/allowable ratio adds additional signal
//   - guideline citation is a strong discrete signal
//   - in-network moderates the base

const FEATURE_WEIGHTS = {
  overchargeRatio: 1.8,        // higher overcharge % → stronger case
  billedToAllowableRatio: 0.9, // more egregious markup → stronger
  guidelineCitation: 0.7,      // presence of specific rule citation → boost
  inNetwork: 0.5,              // in-network contract violations → boost
  largeAmount: 0.4,            // large $ amount → worth pursuing harder
}

function logit(p: number): number {
  const clamped = Math.max(0.001, Math.min(0.999, p))
  return Math.log(clamped / (1 - clamped))
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function scoreWithLogisticRegression(
  features: ClaimFeatures,
  classStats: ClassStats
): number {
  const baseLogOdds = logit(classStats.winRate)

  // Normalize features relative to training class averages
  const overchargeRatioDelta = features.overchargeRatio - classStats.avgOverchargeRatio
  const billedRatioDelta = features.billedToAllowableRatio > 1
    ? (features.billedToAllowableRatio - classStats.avgBilledToAllowable)
    : 0

  // Discrete feature adjustments: compare to class-level win rate splits
  const guidelineAdjustment = features.hasGuidelineCitation
    ? logit(classStats.guidelineWinRate) - logit(classStats.winRate)
    : logit(classStats.noGuidelineWinRate) - logit(classStats.winRate)

  const networkAdjustment = features.providerInNetwork
    ? logit(classStats.inNetworkWinRate) - logit(classStats.winRate)
    : logit(classStats.outNetworkWinRate) - logit(classStats.winRate)

  // Large dollar amounts add urgency signal (log-scaled)
  const amountSignal = features.overchargeAmount > 0
    ? Math.log(features.overchargeAmount + 1) / Math.log(10000) // normalize to ~0–1 range
    : 0

  const adjustedLogOdds =
    baseLogOdds +
    FEATURE_WEIGHTS.overchargeRatio * overchargeRatioDelta +
    FEATURE_WEIGHTS.billedToAllowableRatio * billedRatioDelta +
    guidelineAdjustment * FEATURE_WEIGHTS.guidelineCitation +
    networkAdjustment * FEATURE_WEIGHTS.inNetwork +
    FEATURE_WEIGHTS.largeAmount * (amountSignal - 0.5) // center around 0

  return sigmoid(adjustedLogOdds)
}

// ─── Step 4: Confidence score ─────────────────────────────────────────────────
//
// Confidence is lower when:
//   - Training sample for this class is small
//   - This claim's features are far from the training distribution (out-of-distribution)

function computeConfidence(features: ClaimFeatures, classStats: ClassStats): number {
  // Sample size factor: more data = more confident
  // 40 records → ~1.0, 10 records → ~0.6
  const sampleFactor = Math.min(1, classStats.sampleSize / 40)

  // Feature distance from training mean (Euclidean-ish, normalized)
  const overchargeDistance = Math.abs(features.overchargeRatio - classStats.avgOverchargeRatio)
  const billedDistance = features.billedToAllowableRatio > 1
    ? Math.abs(features.billedToAllowableRatio - classStats.avgBilledToAllowable) / classStats.avgBilledToAllowable
    : 0

  const featureDistance = (overchargeDistance + billedDistance) / 2

  // Distance penalty: if claim looks very different from training data, reduce confidence
  const distancePenalty = Math.min(0.4, featureDistance * 0.5)

  const confidence = sampleFactor * (1 - distancePenalty)
  return Math.max(0.3, Math.min(1.0, confidence))
}

// ─── Step 5: Human-readable rationale ────────────────────────────────────────

function buildRationale(
  claim: Claim,
  features: ClaimFeatures,
  classStats: ClassStats,
  probability: number,
  confidence: number
): string {
  const winPct = Math.round(classStats.winRate * 100)
  const probPct = Math.round(probability * 100)
  const confPct = Math.round(confidence * 100)
  const overPct = Math.round(features.overchargeRatio * 100)

  const errorLabels: Record<string, string> = {
    duplicate: 'Duplicate charge',
    'fee-schedule': 'Fee schedule violation',
    upcoding: 'Upcoding',
    unbundling: 'Unbundling',
  }
  const errorLabel = errorLabels[claim.errorClass] ?? claim.error

  const parts: string[] = []

  // Base rate context
  parts.push(
    `${errorLabel} disputes have a ${winPct}% historical win rate across ${classStats.sampleSize} similar cases in our training data.`
  )

  // Overcharge magnitude
  if (features.overchargeRatio >= 0.5) {
    parts.push(
      `This claim's ${overPct}% overcharge ratio is strong supporting evidence — well above the class average of ${Math.round(classStats.avgOverchargeRatio * 100)}%.`
    )
  } else if (features.overchargeRatio >= 0.2) {
    parts.push(
      `The ${overPct}% overcharge ratio is moderate and consistent with prior successful disputes of this type.`
    )
  } else {
    parts.push(
      `The overcharge ratio of ${overPct}% is below average for this error type, which slightly weakens the case.`
    )
  }

  // Guideline citation
  if (features.hasGuidelineCitation) {
    parts.push(
      `A specific coding guideline or benchmark citation was detected in the audit details, which historically improves dispute outcomes by ${Math.round((classStats.guidelineWinRate - classStats.winRate) * 100)}pp.`
    )
  } else {
    parts.push(
      `No specific guideline citation was detected — including a reference to NCCI edits, AMA CPT rules, or Fair Health benchmarks would strengthen this dispute.`
    )
  }

  // Network status
  if (features.providerInNetwork) {
    parts.push(`Provider appears to be in-network, making contractual enforcement more straightforward.`)
  }

  // Dollar amount context
  if (features.overchargeAmount >= 1000) {
    parts.push(`The $${features.overchargeAmount.toLocaleString()} overcharge is material and warrants full dispute filing.`)
  } else if (features.overchargeAmount >= 200) {
    parts.push(`The $${features.overchargeAmount.toLocaleString()} overcharge is worth disputing given the clear error type.`)
  } else {
    parts.push(`The $${features.overchargeAmount.toLocaleString()} overcharge is small — weigh dispute cost against recovery potential.`)
  }

  // Confidence note
  if (confidence < 0.6) {
    parts.push(`Confidence is ${confPct}% — this claim has unusual characteristics compared to training data; human review is recommended before filing.`)
  } else {
    parts.push(`Model confidence: ${confPct}% based on ${classStats.sampleSize} training records.`)
  }

  // Final verdict
  parts.push(`Predicted dispute success probability: ${probPct}%.`)

  return parts.join(' ')
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Build stats once at module load — training split only
const { train: TRAIN_RECORDS, test: TEST_RECORDS } = getTrainTestSplit()
const CLASS_STATS = buildClassStats(TRAIN_RECORDS)

/**
 * Apply RPS scoring to a list of claims.
 * Adds probability (as `rps` 0–100), confidence (0–1), rpsClass, and rationale.
 */
export function applyRPSScoring(claims: Claim[]): Claim[] {
  // Rule-based duplicate cross-check before scoring
  const duplicateCandidates = findRuleBasedDuplicates(claims)

  return claims.map(claim => {
    if (claim.errorClass === 'none' || claim.overcharge <= 0) {
      return { ...claim, rps: null, rpsClass: null, confidence: null, rationale: null }
    }

    const stats = CLASS_STATS.get(claim.errorClass)
    if (!stats) {
      return { ...claim, rps: null, rpsClass: null, confidence: null, rationale: null }
    }

    const features = extractFeatures(claim)

    // If rule-based check flags a duplicate that Claude missed, boost confidence
    const isDuplicateConfirmed = duplicateCandidates.has(claim.id)
    if (isDuplicateConfirmed && claim.errorClass !== 'duplicate') {
      features.hasGuidelineCitation = true // rule-based confirmation acts as a citation
    }

    const probability = scoreWithLogisticRegression(features, stats)
    const confidence = computeConfidence(features, stats)
    const rationale = buildRationale(claim, features, stats, probability, confidence)

    const rps = Math.round(probability * 100)
    const rpsClass = rps >= 75 ? 'high' : rps >= 45 ? 'med' : 'low'

    return { ...claim, rps, rpsClass, confidence, rationale }
  })
}

/**
 * Compute a dollar-weighted average RPS across all flagged claims.
 * Larger overcharges have more influence on the case-level score.
 */
export function computeWeightedRPS(claims: Claim[]): number {
  const flagged = claims.filter(c => c.rps !== null && c.overcharge > 0)
  if (flagged.length === 0) return 0

  const totalOvercharge = flagged.reduce((s, c) => s + c.overcharge, 0)
  if (totalOvercharge === 0) return 0

  const weightedSum = flagged.reduce((s, c) => s + (c.rps! * c.overcharge), 0)
  return Math.round(weightedSum / totalOvercharge)
}

/**
 * Rule-based duplicate detection.
 * Flags claim IDs where the same CPT code appears more than once
 * on the same date from the same provider — independent of Claude's classification.
 */
function findRuleBasedDuplicates(claims: Claim[]): Set<string> {
  const duplicates = new Set<string>()
  const seen = new Map<string, string>() // key → first claim id

  for (const claim of claims) {
    const key = `${claim.cpt}|${claim.date}|${claim.provider}`
    if (seen.has(key)) {
      duplicates.add(claim.id)
      // Also flag the original if Claude didn't classify it as duplicate
      const firstId = seen.get(key)!
      duplicates.add(firstId)
    } else {
      seen.set(key, claim.id)
    }
  }

  return duplicates
}

/**
 * Recommendation text for the RPS panel action card.
 */
export function getRecommendation(
  claims: Claim[],
  weightedRPS: number
): { title: string; desc: string; urgency: 'high' | 'med' | 'low' } {
  const flagged = claims.filter(c => c.overcharge > 0)
  const highConf = flagged.filter(c => (c.rps ?? 0) >= 75)
  const totalOvercharge = flagged.reduce((s, c) => s + c.overcharge, 0)

  if (weightedRPS >= 75) {
    return {
      urgency: 'high',
      title: `File disputes for ${highConf.length} high-probability claim${highConf.length !== 1 ? 's' : ''}`,
      desc: `$${totalOvercharge.toLocaleString()} in recoverable overcharges with ${weightedRPS}% weighted success probability. High-confidence errors — recommend immediate dispute filing.`,
    }
  }
  if (weightedRPS >= 45) {
    return {
      urgency: 'med',
      title: 'Review flagged claims before filing',
      desc: `${flagged.length} claim${flagged.length !== 1 ? 's' : ''} flagged with moderate recovery probability. Request supporting documentation before proceeding.`,
    }
  }
  return {
    urgency: 'low',
    title: 'Human review recommended',
    desc: `Low overall recovery probability (${weightedRPS}%). Claims may have ambiguous documentation — escalate to clinical review team before filing disputes.`,
  }
}

// ─── Model Evaluation ─────────────────────────────────────────────────────────
//
// Runs the scoring pipeline against the held-out test split (20 records per class)
// and returns accuracy, precision, recall, F1, and per-class metrics.
// Threshold: predicted probability >= 0.5 → predicted win.

export interface ClassEvaluation {
  errorClass: ErrorClass
  testSize: number
  actualWinRate: number    // ground-truth win rate in test set
  predictedWinRate: number // model's mean predicted probability
  accuracy: number         // correct predictions / total
  truePositives: number
  falsePositives: number
  trueNegatives: number
  falseNegatives: number
}

export interface ModelEvaluation {
  trainSize: number
  testSize: number
  overall: {
    accuracy: number
    precision: number   // TP / (TP + FP)
    recall: number      // TP / (TP + FN)
    f1: number          // 2 * P * R / (P + R)
  }
  byClass: ClassEvaluation[]
}

/**
 * Score a training record directly using its ground-truth features,
 * bypassing the text-inference step used for live claims.
 * This gives a clean, unbiased evaluation of the logistic regression.
 */
function scoreRecord(record: TrainingRecord): number {
  const stats = CLASS_STATS.get(record.errorClass)
  if (!stats) return 0.5

  const features: ClaimFeatures = {
    overchargeRatio:        record.overchargeRatio,
    billedToAllowableRatio: record.billedToAllowableRatio,
    overchargeAmount:       record.overchargeAmount,
    hasGuidelineCitation:   record.hasGuidelineCitation,
    providerInNetwork:      record.providerInNetwork,
  }

  return scoreWithLogisticRegression(features, stats)
}

export function evaluateModel(): ModelEvaluation {
  const classes: ErrorClass[] = ['duplicate', 'fee-schedule', 'upcoding', 'unbundling']
  const THRESHOLD = 0.5

  let totalTP = 0, totalFP = 0, totalTN = 0, totalFN = 0

  const byClass: ClassEvaluation[] = classes.map(cls => {
    const records = TEST_RECORDS.filter(r => r.errorClass === cls)
    let tp = 0, fp = 0, tn = 0, fn = 0
    let sumPredicted = 0

    for (const r of records) {
      const prob = scoreRecord(r)
      sumPredicted += prob
      const predictedWin = prob >= THRESHOLD
      const actualWin    = r.disputeWon

      if (predictedWin  && actualWin)  tp++
      if (predictedWin  && !actualWin) fp++
      if (!predictedWin && !actualWin) tn++
      if (!predictedWin && actualWin)  fn++
    }

    totalTP += tp; totalFP += fp; totalTN += tn; totalFN += fn

    const wins = records.filter(r => r.disputeWon).length
    return {
      errorClass:       cls,
      testSize:         records.length,
      actualWinRate:    records.length > 0 ? wins / records.length : 0,
      predictedWinRate: records.length > 0 ? sumPredicted / records.length : 0,
      accuracy:         records.length > 0 ? (tp + tn) / records.length : 0,
      truePositives:    tp,
      falsePositives:   fp,
      trueNegatives:    tn,
      falseNegatives:   fn,
    }
  })

  const totalSamples = totalTP + totalFP + totalTN + totalFN
  const accuracy  = totalSamples > 0 ? (totalTP + totalTN) / totalSamples : 0
  const precision = (totalTP + totalFP) > 0 ? totalTP / (totalTP + totalFP) : 0
  const recall    = (totalTP + totalFN) > 0 ? totalTP / (totalTP + totalFN) : 0
  const f1        = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0

  return {
    trainSize: TRAIN_RECORDS.length,
    testSize:  TEST_RECORDS.length,
    overall: { accuracy, precision, recall, f1 },
    byClass,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}
