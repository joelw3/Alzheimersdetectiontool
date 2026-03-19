
export type RiskLevel = "Low" | "Moderate" | "High";

export interface ClassifierFeatures {
  // Acoustic — may be null until server-side audio analysis is implemented
  pauseCount:         number | null;
  meanPauseDuration:  number | null;
  speechRate:         number | null;
  // Text-derived — always available
  lexicalDiversity:   number | null;
  wordsPerMinute:     number | null;
  // Recall scores — always available
  immediateScore:     number;
  delayedScore:       number;
  recallDecay:        number;
  keyPointsRecalled:  number;
  semanticSimilarity: number;
  coherenceScore:     number;
}

export interface ClassifierResult {
  riskLevel:    RiskLevel;
  probabilities: { Low: number; Moderate: number; High: number };
  /** 0–1, probability of the winning class */
  confidence:   number;
  /** Which features were imputed (not measured from real audio) */
  imputedFeatures: string[];
  /** Feature contributions to risk score, useful for display */
  featureContributions: Record<string, { value: number; zscore: number; direction: "risk" | "protective" | "neutral" }>;
}

// ─── Training distributions from train_xgboost.py ────────────────────────────
// Structure: { mean, std } per feature per class
// Class 0 = Low (CDR=0), Class 1 = Moderate (CDR=0.5), Class 2 = High (CDR≥1)

const FEATURE_NAMES = [
  "pauseCount", "meanPauseDuration", "speechRate", "lexicalDiversity",
  "wordsPerMinute", "immediateScore", "delayedScore", "recallDecay",
  "keyPointsRecalled", "semanticSimilarity", "coherenceScore",
] as const;

type FeatureName = typeof FEATURE_NAMES[number];

interface GaussianParams { mean: number; std: number }
type ClassDistributions = Record<FeatureName, GaussianParams>;

// Directly from generate_synthetic_training_data() in train_xgboost.py:
//   Low:      np.random.normal(mean, std)
//   Moderate: np.random.normal(mean, std)
//   High:     np.random.normal(mean, std)

const DISTRIBUTIONS: Record<0 | 1 | 2, ClassDistributions> = {
  // ── Class 0: Low risk (CDR=0, cognitively normal) ─────────────────────────
  0: {
    pauseCount:         { mean: 5,    std: 2    },
    meanPauseDuration:  { mean: 0.5,  std: 0.15 },
    speechRate:         { mean: 3.8,  std: 0.4  },
    lexicalDiversity:   { mean: 0.62, std: 0.08 },
    wordsPerMinute:     { mean: 155,  std: 20   },
    immediateScore:     { mean: 78,   std: 8    },
    delayedScore:       { mean: 72,   std: 9    },
    recallDecay:        { mean: 6,    std: 3    },
    keyPointsRecalled:  { mean: 7,    std: 1    },  // randint(5,9) → mean≈7
    semanticSimilarity: { mean: 72,   std: 10   },
    coherenceScore:     { mean: 75,   std: 10   },
  },
  // ── Class 1: Moderate risk (CDR=0.5, MCI) ─────────────────────────────────
  1: {
    pauseCount:         { mean: 10,   std: 3    },
    meanPauseDuration:  { mean: 0.8,  std: 0.25 },
    speechRate:         { mean: 3.0,  std: 0.5  },
    lexicalDiversity:   { mean: 0.48, std: 0.10 },
    wordsPerMinute:     { mean: 115,  std: 25   },
    immediateScore:     { mean: 60,   std: 10   },
    delayedScore:       { mean: 48,   std: 12   },
    recallDecay:        { mean: 12,   std: 5    },
    keyPointsRecalled:  { mean: 4,    std: 1    },  // randint(3,6) → mean≈4.5
    semanticSimilarity: { mean: 55,   std: 12   },
    coherenceScore:     { mean: 58,   std: 12   },
  },
  // ── Class 2: High risk (CDR≥1, Alzheimer's) ───────────────────────────────
  2: {
    pauseCount:         { mean: 18,   std: 5    },
    meanPauseDuration:  { mean: 1.3,  std: 0.4  },
    speechRate:         { mean: 2.2,  std: 0.5  },
    lexicalDiversity:   { mean: 0.32, std: 0.08 },
    wordsPerMinute:     { mean: 75,   std: 20   },
    immediateScore:     { mean: 38,   std: 12   },
    delayedScore:       { mean: 25,   std: 10   },
    recallDecay:        { mean: 20,   std: 7    },
    keyPointsRecalled:  { mean: 2,    std: 1.5  },  // randint(0,4) → mean≈2
    semanticSimilarity: { mean: 35,   std: 15   },
    coherenceScore:     { mean: 38,   std: 15   },
  },
};

// Class priors from train_xgboost.py: Low=60%, Moderate=25%, High=15%
const CLASS_PRIORS: Record<0 | 1 | 2, number> = { 0: 0.60, 1: 0.25, 2: 0.15 };

// Training-set medians for imputation (from xgboost_model.tsx imputeMissingFeatures)
const IMPUTATION_DEFAULTS: Record<FeatureName, number> = {
  pauseCount:         8.5,
  meanPauseDuration:  0.65,
  speechRate:         3.2,
  lexicalDiversity:   0.52,
  wordsPerMinute:     125,
  immediateScore:     62,
  delayedScore:       55,
  recallDecay:        7,
  keyPointsRecalled:  4,
  semanticSimilarity: 58,
  coherenceScore:     60,
};

// ─── Gaussian log-likelihood ──────────────────────────────────────────────────

function logGaussian(x: number, mean: number, std: number): number {
  const variance = std * std;
  return -0.5 * Math.log(2 * Math.PI * variance) - ((x - mean) ** 2) / (2 * variance);
}

// ─── Feature vector builder with imputation ───────────────────────────────────

function buildFeatureVector(raw: ClassifierFeatures): {
  values: Record<FeatureName, number>;
  imputed: string[];
} {
  const imputed: string[] = [];

  const resolve = (name: FeatureName, val: number | null): number => {
    if (val !== null && isFinite(val)) return val;
    imputed.push(name);
    return IMPUTATION_DEFAULTS[name];
  };

  return {
    values: {
      pauseCount:         resolve("pauseCount",         raw.pauseCount),
      meanPauseDuration:  resolve("meanPauseDuration",  raw.meanPauseDuration),
      speechRate:         resolve("speechRate",          raw.speechRate),
      lexicalDiversity:   resolve("lexicalDiversity",   raw.lexicalDiversity),
      wordsPerMinute:     resolve("wordsPerMinute",      raw.wordsPerMinute),
      immediateScore:     resolve("immediateScore",      raw.immediateScore),
      delayedScore:       resolve("delayedScore",        raw.delayedScore),
      recallDecay:        resolve("recallDecay",         raw.recallDecay),
      keyPointsRecalled:  resolve("keyPointsRecalled",  raw.keyPointsRecalled),
      semanticSimilarity: resolve("semanticSimilarity", raw.semanticSimilarity),
      coherenceScore:     resolve("coherenceScore",      raw.coherenceScore),
    },
    imputed,
  };
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export function classifyRisk(features: ClassifierFeatures): ClassifierResult {
  const { values, imputed } = buildFeatureVector(features);

  // Compute log-posterior for each class: log P(C) + sum log P(x_i | C)
  const logPosteriors: Record<0 | 1 | 2, number> = { 0: 0, 1: 0, 2: 0 };

  for (const classIdx of [0, 1, 2] as const) {
    logPosteriors[classIdx] = Math.log(CLASS_PRIORS[classIdx]);
    for (const feat of FEATURE_NAMES) {
      const { mean, std } = DISTRIBUTIONS[classIdx][feat];
      logPosteriors[classIdx] += logGaussian(values[feat], mean, std);
    }
  }

  // Softmax over log-posteriors for calibrated probabilities
  const maxLog = Math.max(...Object.values(logPosteriors));
  const expScores = {
    0: Math.exp(logPosteriors[0] - maxLog),
    1: Math.exp(logPosteriors[1] - maxLog),
    2: Math.exp(logPosteriors[2] - maxLog),
  };
  const sumExp = expScores[0] + expScores[1] + expScores[2];
  const probs = {
    Low:      expScores[0] / sumExp,
    Moderate: expScores[1] / sumExp,
    High:     expScores[2] / sumExp,
  };

  // Winning class
  const riskLevel: RiskLevel =
    probs.High >= probs.Low && probs.High >= probs.Moderate ? "High" :
    probs.Moderate >= probs.Low ? "Moderate" : "Low";

  const confidence = Math.max(probs.Low, probs.Moderate, probs.High);

  // Feature contributions — z-score of each value vs the winning class mean
  // to show which features most pushed toward that classification
  const winClass = riskLevel === "Low" ? 0 : riskLevel === "Moderate" ? 1 : 2;
  const featureContributions: ClassifierResult["featureContributions"] = {};

  for (const feat of FEATURE_NAMES) {
    const { mean, std } = DISTRIBUTIONS[winClass][feat];
    const zscore = (values[feat] - mean) / std;

    // "risk" direction = higher value → higher risk class
    // Determine by comparing class 2 mean vs class 0 mean
    const riskDirection =
      DISTRIBUTIONS[2][feat].mean > DISTRIBUTIONS[0][feat].mean ? 1 : -1;
    const alignedZ = zscore * riskDirection;

    featureContributions[feat] = {
      value: values[feat],
      zscore,
      direction: alignedZ > 0.5 ? "risk" : alignedZ < -0.5 ? "protective" : "neutral",
    };
  }

  return { riskLevel, probabilities: probs, confidence, imputedFeatures: imputed, featureContributions };
}