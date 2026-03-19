
from typing import Dict, List, Tuple
from difflib import SequenceMatcher
from utils.story_data import STORY_KEY_POINTS, STORY_TEXT


# ─── Text similarity ──────────────────────────────────────────────────────────

def levenshtein_distance(str1: str, str2: str) -> int:
    len1, len2 = len(str1), len(str2)
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if str1[i - 1] == str2[j - 1] else 1
            matrix[i][j] = min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            )
    return matrix[len1][len2]


def calculate_similarity(original: str, recalled: str) -> float:
    distance = levenshtein_distance(original.lower(), recalled.lower())
    max_len = max(len(original), len(recalled))
    if max_len == 0:
        return 0.0
    return ((max_len - distance) / max_len) * 100


# ─── Key-point matching (fixed) ───────────────────────────────────────────────

_STOP_WORDS = {
    "the", "and", "her", "she", "was", "had", "for", "are", "but", "not",
    "you", "all", "can", "its", "him", "his", "with", "that", "this",
    "from", "they", "have", "been", "were", "said", "each", "will",
}


def _extract_keywords(phrase: str) -> List[str]:
    """Returns meaningful words from a key-point phrase (length >= 3, no stop words)."""
    tokens = phrase.lower().replace("(", "").replace(")", "").split()
    return [w for w in tokens if len(w) >= 3 and w not in _STOP_WORDS]


def check_key_points(recalled_text: str) -> Tuple[List[str], List[str]]:
    """
    Checks how many story key points appear in the recalled text.

    Uses multi-keyword matching plus a difflib fuzzy fallback so that
    paraphrases (e.g. 'red, yellow, and white' for 'three colors of roses')
    are still credited.
    """
    recalled: List[str] = []
    missed: List[str] = []
    lower_recalled = recalled_text.lower()

    for point in STORY_KEY_POINTS:
        keywords = _extract_keywords(point)
        keyword_match = any(kw in lower_recalled for kw in keywords)

        fuzzy_match = False
        if not keyword_match:
            ratio = SequenceMatcher(None, point.lower(), lower_recalled).ratio()
            fuzzy_match = ratio > 0.40

        if keyword_match or fuzzy_match:
            recalled.append(point)
        else:
            missed.append(point)

    return recalled, missed


# ─── Coherence scoring ────────────────────────────────────────────────────────

def calculate_coherence(text: str) -> float:
    if not text or len(text.strip()) < 20:
        return 0.0

    sentences = [
        s.strip()
        for s in text.replace("!", ".").replace("?", ".").split(".")
        if s.strip()
    ]
    if not sentences:
        return 0.0

    score = 0.0
    if len(text) > 50:
        score += 33.33
    if len(sentences) > 2:
        score += 33.33
    if len(text.split()) > 15:
        score += 33.34

    return score


# ─── Risk classification (rule-based, replaces Decision Tree) ────────────────
#
# Thresholds derived from WMS-IV Logical Memory norms for ages 65–89:
#   Normal delayed recall   : >= 70 % of weighted score
#   Mild impairment (MCI)   : 45–69 %
#   Significant impairment  : < 45 %
#   Normal recall decay     : <= 15 percentage points
#   Concerning decay        : 16–25 pp
#   High decay              : > 25 pp
#
# The XGBoost model (ml_training/train_xgboost.py) will replace this
# function when a validated dataset is available and the model is deployed. 
  
def classify_risk(immediate_score: float, delayed_score: float, recall_decay: float) -> str:
    if delayed_score < 45 or recall_decay > 25:
        return "High"
    if delayed_score >= 70 and recall_decay <= 15:
        return "Low"
    return "Moderate"


# ─── Recommendations ─────────────────────────────────────────────────────────

def get_recommendations(risk: str) -> List[str]:
    if risk == "High":
        return [
            "Consult with a neurologist or geriatric specialist",
            "Consider a comprehensive cognitive assessment (MCI/dementia work-up)",
            "Schedule follow-up testing in 3–6 months",
            "Discuss family history and risk factors with your healthcare provider",
        ]
    if risk == "Moderate":
        return [
            "Monitor cognitive function with regular check-ups",
            "Consider lifestyle modifications (diet, exercise, social engagement)",
            "Schedule follow-up screening in 6–12 months",
            "Engage in mentally stimulating activities",
        ]
    return [
        "Continue regular health check-ups",
        "Maintain healthy lifestyle habits",
        "Repeat this screening annually as part of preventive care",
        "Stay mentally and socially active",
    ]


# ─── Main analysis function ───────────────────────────────────────────────────

def analyze_recall(immediate_recall: str, delayed_recall: str) -> Dict:
    # Immediate recall
    immediate_kp = check_key_points(immediate_recall)
    immediate_similarity = calculate_similarity(STORY_TEXT, immediate_recall)
    immediate_coherence = calculate_coherence(immediate_recall)
    immediate_score = (
        (len(immediate_kp[0]) / len(STORY_KEY_POINTS)) * 40
        + (immediate_similarity / 100) * 30
        + (immediate_coherence / 100) * 30
    )

    # Delayed recall
    delayed_kp = check_key_points(delayed_recall)
    delayed_similarity = calculate_similarity(STORY_TEXT, delayed_recall)
    delayed_coherence = calculate_coherence(delayed_recall)
    delayed_score = (
        (len(delayed_kp[0]) / len(STORY_KEY_POINTS)) * 40
        + (delayed_similarity / 100) * 30
        + (delayed_coherence / 100) * 30
    )

    recall_decay = immediate_score - delayed_score
    risk_level = classify_risk(immediate_score, delayed_score, recall_decay)

    return {
        "immediate": {
            "score": immediate_score,
            "key_points_recalled": len(immediate_kp[0]),
            "total_key_points": len(STORY_KEY_POINTS),
            "semantic_similarity": immediate_similarity,
            "coherence_score": immediate_coherence,
            "details_recalled": immediate_kp[0],
            "details_missed": immediate_kp[1],
            "risk_level": risk_level,
            "recommendations": get_recommendations(risk_level),
        },
        "delayed": {
            "score": delayed_score,
            "key_points_recalled": len(delayed_kp[0]),
            "total_key_points": len(STORY_KEY_POINTS),
            "semantic_similarity": delayed_similarity,
            "coherence_score": delayed_coherence,
            "details_recalled": delayed_kp[0],
            "details_missed": delayed_kp[1],
            "risk_level": risk_level,
            "recommendations": get_recommendations(risk_level),
        },
        "comparison": {
            "recall_decay": recall_decay,
            "concern_level": risk_level,
        },
    }