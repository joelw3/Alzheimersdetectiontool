import { STORY_KEY_POINTS, STORY_TEXT } from "./storyData";
import type { AcousticFeatures } from "./speechPipeline";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// Types (unchanged interface so Results.tsx needs no edits)

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

//1. Levenshtein distance (unchanged) 

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


const STOP_WORDS = new Set(["the", "and", "her", "she", "was", "had", "for", "are", "but", "not", "you", "all", "can", "its", "him", "his", "with", "that", "this", "from", "they", "have", "been", "were", "said", "each", "will"]);

function extractKeywords(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[()]/g, "")
    .split(/[\s,/]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function fuzzyContains(haystack: string, needle: string, threshold = 0.72): boolean {
  // Slide a window of needle's word-length over haystack and check similarity
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
    // Match if ANY keyword is present in the recall text
    const keywordMatch = keywords.some((kw) => lower.includes(kw));
    // Fallback: fuzzy phrase match (catches paraphrases)
    const fuzzyMatch = fuzzyContains(lower, point);

    if (keywordMatch || fuzzyMatch) {
      recalled.push(point);
    } else {
      missed.push(point);
    }
  });

  return { recalled, missed };
}



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

function classifyRisk(
  immediateScore: number,
  delayedScore: number,
  recallDecay: number
): "Low" | "Moderate" | "High" {
  // High: poor delayed recall OR very rapid forgetting
  if (delayedScore < 45 || recallDecay > 25) return "High";
  // Low: good delayed score AND minimal decay
  if (delayedScore >= 70 && recallDecay <= 15) return "Low";
  // Everything else: Moderate
  return "Moderate";
}

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

// ─── 6. Main export — analyzeRecall ──────────────────────────────────────────
//
// FILE:  src/app/utils/analysisEngine.ts
// WHERE: replaces the entire analyzeRecall() function (lines 95–end of original)
// SIGNATURE: unchanged — Results.tsx calls analyzeRecall(immediateRecall, delayedRecall)
// and reads .immediate, .delayed, .comparison — all fields preserved.

// ─── XGBoost Integration (NEW) ───────────────────────────────────────────────

async function getXGBoostPrediction(
  immediateScore: number,
  delayedScore: number,
  recallDecay: number,
  immediateKP: number,
  delayedKP: number,
  immSimilarity: number,
  delSimilarity: number,
  immCoherence: number,
  delCoherence: number
): Promise<"Low" | "Moderate" | "High" | null> {
  try {
    // Get acoustic features from session storage
    const immediateAcoustics = sessionStorage.getItem("immediateAcoustics");
    const delayedAcoustics = sessionStorage.getItem("delayedAcoustics");

    let acousticFeatures = {};
    
    if (delayedAcoustics) {
      const features = JSON.parse(delayedAcoustics);
      acousticFeatures = {
        pauseCount: features.pauseCount,
        meanPauseDuration: features.meanPauseDuration,
        speechRate: features.speechRate,
        lexicalDiversity: features.lexicalDiversity,
        wordsPerMinute: features.wordsPerMinute,
      };
    }

    // Prepare features for XGBoost model
    const xgboostFeatures = {
      ...acousticFeatures,
      immediateScore,
      delayedScore,
      recallDecay,
      keyPointsRecalled: delayedKP, // Use delayed recall key points as primary
      semanticSimilarity: delSimilarity,
      coherenceScore: delCoherence,
    };

    console.log("Sending features to XGBoost model:", xgboostFeatures);

    // Call XGBoost prediction endpoint
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-57b7b6f3/predict-risk`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(xgboostFeatures),
      }
    );

    if (!response.ok) {
      console.error("XGBoost prediction failed:", await response.text());
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.prediction) {
      console.log("XGBoost prediction:", data.prediction);
      
      // Store prediction details for Results page
      sessionStorage.setItem("xgboostPrediction", JSON.stringify(data.prediction));
      
      return data.prediction.risk_level;
    }

    return null;
  } catch (error) {
    console.error("XGBoost prediction error:", error);
    return null;
  }
}

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
}> {
  // ── Immediate recall ──────────────────────────────────────────────────
  const immediateKP   = checkKeyPoints(immediateRecall);
  const immSimilarity = calculateSimilarity(STORY_TEXT, immediateRecall);
  const immCoherence  = calculateCoherence(immediateRecall);
  const immediateScore =
    (immediateKP.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (immSimilarity / 100) * 30 +
    (immCoherence / 100) * 30;

  // ── Delayed recall ────────────────────────────────────────────────────
  const delayedKP     = checkKeyPoints(delayedRecall);
  const delSimilarity = calculateSimilarity(STORY_TEXT, delayedRecall);
  const delCoherence  = calculateCoherence(delayedRecall);
  const delayedScore =
    (delayedKP.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (delSimilarity / 100) * 30 +
    (delCoherence / 100) * 30;

  // ── Recall decay ──────────────────────────────────────────────────────
  const recallDecay = immediateScore - delayedScore;

  // ── Risk classification (rule-based, replaces Decision Tree) ─────────
  const immediateRisk = classifyRisk(immediateScore, immediateScore, 0);
  const delayedRisk   = classifyRisk(immediateScore, delayedScore, recallDecay);
  let   concernLevel  = classifyRisk(immediateScore, delayedScore, recallDecay);

  // ─── XGBoost Prediction ──────────────────────────────────────────────
  const xgboostPrediction = await getXGBoostPrediction(
    immediateScore,
    delayedScore,
    recallDecay,
    immediateKP.recalled.length,
    delayedKP.recalled.length,
    immSimilarity,
    delSimilarity,
    immCoherence,
    delCoherence
  );

  if (xgboostPrediction) {
    concernLevel = xgboostPrediction;
  }

  return {
    immediate: {
      score: immediateScore,
      keyPointsRecalled: immediateKP.recalled.length,
      totalKeyPoints: STORY_KEY_POINTS.length,
      semanticSimilarity: immSimilarity,
      coherenceScore: immCoherence,
      detailsRecalled: immediateKP.recalled,
      detailsMissed: immediateKP.missed,
      riskLevel: mergeAcousticSignal(immediateRisk, "immediateAcoustics"),
      recommendations: getRecommendations(immediateRisk),
    },
    delayed: {
      score: delayedScore,
      keyPointsRecalled: delayedKP.recalled.length,
      totalKeyPoints: STORY_KEY_POINTS.length,
      semanticSimilarity: delSimilarity,
      coherenceScore: delCoherence,
      detailsRecalled: delayedKP.recalled,
      detailsMissed: delayedKP.missed,
      riskLevel: delayedRisk,
      recommendations: getRecommendations(delayedRisk),
    },
    comparison: {
      recallDecay,
      concernLevel,
    },
  };
}