import { STORY_KEY_POINTS, STORY_TEXT } from "./storyData";

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

// Calculate Levenshtein distance for similarity
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

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
  const distance = levenshteinDistance(
    original.toLowerCase(),
    recalled.toLowerCase()
  );
  const maxLen = Math.max(original.length, recalled.length);
  return ((maxLen - distance) / maxLen) * 100;
}

function checkKeyPoints(recalledText: string): {
  recalled: string[];
  missed: string[];
} {
  const recalled: string[] = [];
  const missed: string[] = [];
  const lowerRecalled = recalledText.toLowerCase();

  STORY_KEY_POINTS.forEach((point) => {
    const lowerPoint = point.toLowerCase();
    // Check for partial matches
    if (lowerRecalled.includes(lowerPoint.split(" ")[0])) {
      recalled.push(point);
    } else {
      missed.push(point);
    }
  });

  return { recalled, missed };
}

function calculateCoherence(text: string): number {
  // Simple coherence check based on sentence structure and length
  if (!text || text.trim().length < 20) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 0;

  // Check for basic coherence indicators
  const hasProperLength = text.length > 50;
  const hasMultipleSentences = sentences.length > 2;
  const hasReasonableWordCount = text.split(/\s+/).length > 15;

  let score = 0;
  if (hasProperLength) score += 33;
  if (hasMultipleSentences) score += 33;
  if (hasReasonableWordCount) score += 34;

  return score;
}

export function analyzeRecall(
  immediateRecall: string,
  delayedRecall: string
): {
  immediate: AnalysisResult;
  delayed: AnalysisResult;
  comparison: {
    recallDecay: number;
    concernLevel: "Low" | "Moderate" | "High";
  };
} {
  // Analyze immediate recall
  const immediateKeyPoints = checkKeyPoints(immediateRecall);
  const immediateSimilarity = calculateSimilarity(STORY_TEXT, immediateRecall);
  const immediateCoherence = calculateCoherence(immediateRecall);

  const immediateScore =
    (immediateKeyPoints.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (immediateSimilarity / 100) * 30 +
    (immediateCoherence / 100) * 30;

  // Analyze delayed recall
  const delayedKeyPoints = checkKeyPoints(delayedRecall);
  const delayedSimilarity = calculateSimilarity(STORY_TEXT, delayedRecall);
  const delayedCoherence = calculateCoherence(delayedRecall);

  const delayedScore =
    (delayedKeyPoints.recalled.length / STORY_KEY_POINTS.length) * 40 +
    (delayedSimilarity / 100) * 30 +
    (delayedCoherence / 100) * 30;

  // Calculate recall decay
  const recallDecay = immediateScore - delayedScore;

  // Determine risk levels
  const immediateRisk =
    immediateScore >= 70 ? "Low" : immediateScore >= 50 ? "Moderate" : "High";
  const delayedRisk =
    delayedScore >= 60 ? "Low" : delayedScore >= 40 ? "Moderate" : "High";

  // Overall concern level based on decay and absolute scores
  let concernLevel: "Low" | "Moderate" | "High" = "Low";
  if (recallDecay > 30 || delayedScore < 40) {
    concernLevel = "High";
  } else if (recallDecay > 20 || delayedScore < 60) {
    concernLevel = "Moderate";
  }

  const getRecommendations = (
    risk: "Low" | "Moderate" | "High",
    isDelayed: boolean
  ): string[] => {
    if (risk === "High") {
      return [
        "Consult with a neurologist or geriatric specialist",
        "Consider comprehensive cognitive assessment",
        "Schedule follow-up testing in 3-6 months",
        "Discuss family history and risk factors with healthcare provider",
      ];
    } else if (risk === "Moderate") {
      return [
        "Monitor cognitive function with regular check-ups",
        "Consider lifestyle modifications (diet, exercise, social engagement)",
        "Schedule follow-up screening in 6-12 months",
        "Engage in cognitive training activities",
      ];
    }
    return [
      "Continue regular health check-ups",
      "Maintain healthy lifestyle habits",
      "Repeat screening annually as part of preventive care",
      "Stay mentally and socially active",
    ];
  };

  return {
    immediate: {
      score: immediateScore,
      keyPointsRecalled: immediateKeyPoints.recalled.length,
      totalKeyPoints: STORY_KEY_POINTS.length,
      semanticSimilarity: immediateSimilarity,
      coherenceScore: immediateCoherence,
      detailsRecalled: immediateKeyPoints.recalled,
      detailsMissed: immediateKeyPoints.missed,
      riskLevel: immediateRisk,
      recommendations: getRecommendations(immediateRisk, false),
    },
    delayed: {
      score: delayedScore,
      keyPointsRecalled: delayedKeyPoints.recalled.length,
      totalKeyPoints: STORY_KEY_POINTS.length,
      semanticSimilarity: delayedSimilarity,
      coherenceScore: delayedCoherence,
      detailsRecalled: delayedKeyPoints.recalled,
      detailsMissed: delayedKeyPoints.missed,
      riskLevel: delayedRisk,
      recommendations: getRecommendations(delayedRisk, true),
    },
    comparison: {
      recallDecay,
      concernLevel,
    },
  };
}
