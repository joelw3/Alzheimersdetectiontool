import { STORY_KEY_POINTS, STORY_TEXT } from "./storyData";
import type { AcousticFeatures } from "./speechPipeline";
import { classifyRisk as classifyRiskGNB, type ClassifierFeatures, type ClassifierResult } from "./classifierEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  score: number;
  keyPointsRecalled: number;
  totalKeyPoints: number;
  semanticSimilarity: number;
  coherenceScore: number;
  detailsRecalled: string[];
  detailsMissed: string[];
  riskLevel: "Low" | "Moderate" | "High";
  recommendations: string[];
}

export interface ClassificationOutput {
  riskLevel: "Low" | "Moderate" | "High";
  probabilities: { Low: number; Moderate: number; High: number };
  confidence: number;
  imputedFeatures: string[];
  featureContributions: ClassifierResult["featureContributions"];
  /** true = Gaussian NB from training distributions; false = Supabase XGBoost */
  source: "gnb-training-distributions" | "supabase-xgboost";
}

// ─── 1. Levenshtein distance ──────────────────────────────────────────────────

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[len1][len2];
}

function calculateSimilarity(original: string, recalled: string): number {
  const distance = levenshteinDistance(original.toLowerCase(), recalled.toLowerCase());
  const maxLen = Math.max(original.length, recalled.length);
  return ((maxLen - distance) / maxLen) * 100;
}

// ─── 2. Key-point matching (fuzzy, multi-keyword) ────────────────────────────

const STOP_WORDS = new Set([
  "the", "and", "her", "she", "was", "had", "for", "are", "but", "not",
  "you", "all", "can", "its", "him", "his", "with", "that", "this",
  "from", "they", "have", "been", "were", "said", "each", "will",
]);

function extractKeywords(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[()]/g, "")
    .split(/[\s,/]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function fuzzyContains(haystack: string, needle: string, threshold = 0.72): boolean {
  const needleWords = needle.toLowerCase().split(/\s+/).length;
  const haystackWords = haystack.toLowerCase().split(/\s+/);
  if (haystackWords.length < needleWords) return false;
  for (let i = 0; i <= haystackWords.length - needleWords; i++) {
    const window = haystackWords.slice(i, i + needleWords).join(" ");
    const maxLen = Math.max(window.length, needle.length);
    if (maxLen === 0) continue;
    const dist = levenshteinDistance(window, needle.toLowerCase());
    if ((maxLen - dist) / maxLen >= threshold) return true;
  }
  return false;
}

function checkKeyPoints(recalledText: string): {
  recalled: string[];
  missed: string[];
} {
  const recalled: string[] = [];
  const missed: string[] = [];
  const lower = recalledText.toLowerCase();

  STORY_KEY_POINTS.forEach((point) => {
    const keywords = extractKeywords(point);
    const keywordMatch = keywords.some((kw) => lower.includes(kw));
    const fuzzyMatch = fuzzyContains(lower, point);
    if (keywordMatch || fuzzyMatch) {
      recalled.push(point);
    } else {
      missed.push(point);
    }
  });

  return { recalled, missed };
}

// ─── 3. Coherence scoring ─────────────────────────────────────────────────────

function calculateCoherence(text: string): number {
  if (!text || text.trim().length < 20) return 0;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;
  let score = 0;
  if (text.length > 50)              score += 33;
  if (sentences.length > 2)          score += 33;
  if (text.split(/\s+/).length > 15) score += 34;
  return score;
}

// ─── 4. Rule-based risk classification (fallback when XGBoost unavailable) ────
//
// Thresholds derived from WMS-IV Logical Memory norms for ages 65–89.
// This is used when the XGBoost endpoint returns null (network error,
// model not yet deployed, or environment variables not set).

function classifyRisk(
  immediateScore: number,
  delayedScore: number,
  recallDecay: number
): "Low" | "Moderate" | "High" {
  if (delayedScore < 45 || recallDecay > 25) return "High";
  if (delayedScore >= 70 && recallDecay <= 15) return "Low";
  return "Moderate";
}

// ─── 5. Recommendations ──────────────────────────────────────────────────────

function getRecommendations(risk: "Low" | "Moderate" | "High"): string[] {
  if (risk === "High") {
    return [
      "Consult with a neurologist or geriatric specialist",
      "Consider a comprehensive cognitive assessment (MCI/dementia work-up)",
      "Schedule follow-up testing in 3–6 months",
      "Discuss family history and risk factors with your healthcare provider",
    ];
  }
  if (risk === "Moderate") {
    return [
      "Monitor cognitive function with regular check-ups",
      "Consider lifestyle modifications (diet, exercise, social engagement)",
      "Schedule follow-up screening in 6–12 months",
      "Engage in mentally stimulating activities",
    ];
  }
  return [
    "Continue regular health check-ups",
    "Maintain healthy lifestyle habits",
    "Repeat this screening annually as part of preventive care",
    "Stay mentally and socially active",
  ];
}

// ─── 7. Main export ───────────────────────────────────────────────────────────

export async function analyzeRecall(
  immediateRecall: string,
  delayedRecall: string
): Promise<{
  immediate: AnalysisResult;
  delayed: AnalysisResult;
  comparison: {
    recallDecay: number;
    concernLevel: "Low" | "Moderate" | "High";
  };
  classification: ClassificationOutput;
}> {
  // ── 1. Score immediate recall ────────────────────────────────────────────
  const immediateKP   = checkKeyPoints(immediateRecall);
  const immSimilarity = calculateSimilarity(STORY_TEXT, immediateRecall);
  const immCoherence  = calculateCoherence(immediateRecall);
  const immediateScore =
    (immediateKP.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (immSimilarity / 100) * 30 +
    (immCoherence / 100) * 30;

  // ── 2. Score delayed recall ──────────────────────────────────────────────
  const delayedKP     = checkKeyPoints(delayedRecall);
  const delSimilarity = calculateSimilarity(STORY_TEXT, delayedRecall);
  const delCoherence  = calculateCoherence(delayedRecall);
  const delayedScore =
    (delayedKP.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (delSimilarity / 100) * 30 +
    (delCoherence / 100) * 30;

  const recallDecay = immediateScore - delayedScore;

  // ── 3. Pull real acoustic features from the user's recording ────────────
  // These are written to sessionStorage by speechPipeline after each recording.
  // Null values are imputed inside classifierEngine using training-set medians.
  const rawDelayedAcoustics: Partial<AcousticFeatures> = (() => {
    try { return JSON.parse(sessionStorage.getItem("delayedAcoustics") ?? "{}"); }
    catch { return {}; }
  })();
  const rawImmediateAcoustics: Partial<AcousticFeatures> = (() => {
    try { return JSON.parse(sessionStorage.getItem("immediateAcoustics") ?? "{}"); }
    catch { return {}; }
  })();

  // Use delayed acoustics as primary (more clinically significant);
  // fall back to immediate if delayed is unavailable.
  const acoustics = {
    pauseCount:        rawDelayedAcoustics.pauseCount        ?? rawImmediateAcoustics.pauseCount        ?? null,
    meanPauseDuration: rawDelayedAcoustics.meanPauseDuration ?? rawImmediateAcoustics.meanPauseDuration ?? null,
    speechRate:        rawDelayedAcoustics.speechRate        ?? rawImmediateAcoustics.speechRate        ?? null,
    lexicalDiversity:  rawDelayedAcoustics.lexicalDiversity  ?? rawImmediateAcoustics.lexicalDiversity  ?? null,
    wordsPerMinute:    rawDelayedAcoustics.wordsPerMinute    ?? rawImmediateAcoustics.wordsPerMinute    ?? null,
  };

  // ── 4. Run Gaussian NB classifier against training distributions ─────────
  // This always runs client-side — no API key or Supabase config needed.
  const classifierFeatures: ClassifierFeatures = {
    ...acoustics,
    immediateScore,
    delayedScore,
    recallDecay,
    keyPointsRecalled:  delayedKP.recalled.length,
    semanticSimilarity: delSimilarity,
    coherenceScore:     delCoherence,
  };

  let gnbResult = classifyRiskGNB(classifierFeatures);

  // ── 5. Try Supabase XGBoost — overrides GNB only if it succeeds ─────────
  let classificationSource: ClassificationOutput["source"] = "gnb-training-distributions";

  const projectId     = (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined);
  const publicAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY   as string | undefined);

  if (projectId && publicAnonKey) {
    try {
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57b7b6f3/predict-risk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ ...classifierFeatures }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.prediction?.risk_level) {
          sessionStorage.setItem("xgboostPrediction", JSON.stringify(data.prediction));
          // Supabase responded — use its risk level but keep GNB probabilities
          gnbResult = { ...gnbResult, riskLevel: data.prediction.risk_level };
          classificationSource = "supabase-xgboost";
        }
      }
    } catch {
      // Supabase unreachable — GNB result stands
    }
  }

  // Persist full classifier output for Results page
  const classification: ClassificationOutput = {
    riskLevel:            gnbResult.riskLevel,
    probabilities:        gnbResult.probabilities,
    confidence:           gnbResult.confidence,
    imputedFeatures:      gnbResult.imputedFeatures,
    featureContributions: gnbResult.featureContributions,
    source:               classificationSource,
  };
  sessionStorage.setItem("classificationOutput", JSON.stringify(classification));

  const concernLevel = gnbResult.riskLevel;

  // ── 6. Per-phase risk (rule-based, for individual card display) ──────────
  const immediateRisk = classifyRisk(immediateScore, immediateScore, 0);
  const delayedRisk   = gnbResult.riskLevel; // use classifier for the final card

  return {
    immediate: {
      score:              immediateScore,
      keyPointsRecalled:  immediateKP.recalled.length,
      totalKeyPoints:     STORY_KEY_POINTS.length,
      semanticSimilarity: immSimilarity,
      coherenceScore:     immCoherence,
      detailsRecalled:    immediateKP.recalled,
      detailsMissed:      immediateKP.missed,
      riskLevel:          immediateRisk,
      recommendations:    getRecommendations(immediateRisk),
    },
    delayed: {
      score:              delayedScore,
      keyPointsRecalled:  delayedKP.recalled.length,
      totalKeyPoints:     STORY_KEY_POINTS.length,
      semanticSimilarity: delSimilarity,
      coherenceScore:     delCoherence,
      detailsRecalled:    delayedKP.recalled,
      detailsMissed:      delayedKP.missed,
      riskLevel:          delayedRisk,
      recommendations:    getRecommendations(delayedRisk),
    },
    comparison: {
      recallDecay,
      concernLevel,
    },
    classification,
  };
}