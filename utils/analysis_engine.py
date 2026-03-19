
from typing import Dict, List, Tuple
from utils.story_data import STORY_KEY_POINTS, STORY_TEXT

# 🔥 NEW: Machine Learning imports
from sklearn.tree import DecisionTreeClassifier
import numpy as np


# Features:
# [immediate_score, delayed_score, recall_decay, similarity, coherence]
X = np.array([
    [85, 80, 5, 0.9, 0.85],
    [70, 60, 10, 0.75, 0.7],
    [50, 40, 20, 0.6, 0.55],
    [30, 25, 25, 0.4, 0.45],
    [90, 85, 3, 0.95, 0.9],
    [60, 50, 15, 0.65, 0.6],
])

# Labels: 0=Low, 1=Moderate, 2=High
y = np.array([0, 1, 2, 2, 0, 1])

model = DecisionTreeClassifier()
model.fit(X, y)

labels = ["Low", "Moderate", "High"]




def levenshtein_distance(str1: str, str2: str) -> int:
    len1 = len(str1)
    len2 = len(str2)
    
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j
    
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if str1[i-1] == str2[j-1] else 1
            matrix[i][j] = min(
                matrix[i-1][j] + 1,
                matrix[i][j-1] + 1,
                matrix[i-1][j-1] + cost
            )
    
    return matrix[len1][len2]


def calculate_similarity(original: str, recalled: str) -> float:
    distance = levenshtein_distance(original.lower(), recalled.lower())
    max_len = max(len(original), len(recalled))
    
    if max_len == 0:
        return 0.0
    
    return ((max_len - distance) / max_len) * 100


def check_key_points(recalled_text: str) -> Tuple[List[str], List[str]]:
    recalled = []
    missed = []
    lower_recalled = recalled_text.lower()
    
    for point in STORY_KEY_POINTS:
        first_word = point.lower().split()[0]
        if first_word in lower_recalled:
            recalled.append(point)
        else:
            missed.append(point)
    
    return recalled, missed


def calculate_coherence(text: str) -> float:
    if not text or len(text.strip()) < 20:
        return 0.0
    
    sentences = [s.strip() for s in text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
    
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


def get_recommendations(risk: str) -> List[str]:
    if risk == "High":
        return [
            "Consult with a neurologist or geriatric specialist",
            "Consider comprehensive cognitive assessment",
            "Schedule follow-up testing in 3-6 months",
            "Discuss family history and risk factors with healthcare provider"
        ]
    elif risk == "Moderate":
        return [
            "Monitor cognitive function with regular check-ups",
            "Consider lifestyle modifications (diet, exercise, social engagement)",
            "Schedule follow-up screening in 6-12 months",
            "Engage in cognitive training activities"
        ]
    else:
        return [
            "Continue regular health check-ups",
            "Maintain healthy lifestyle habits",
            "Repeat screening annually as part of preventive care",
            "Stay mentally and socially active"
        ]


def analyze_recall(immediate_recall: str, delayed_recall: str) -> Dict:

    # --- Immediate recall analysis ---
    immediate_key_points = check_key_points(immediate_recall)
    immediate_similarity = calculate_similarity(STORY_TEXT, immediate_recall)
    immediate_coherence = calculate_coherence(immediate_recall)

    immediate_score = (
        (len(immediate_key_points[0]) / len(STORY_KEY_POINTS)) * 40 +
        (immediate_similarity / 100) * 30 +
        (immediate_coherence / 100) * 30
    )

    # --- Delayed recall analysis ---
    delayed_key_points = check_key_points(delayed_recall)
    delayed_similarity = calculate_similarity(STORY_TEXT, delayed_recall)
    delayed_coherence = calculate_coherence(delayed_recall)

    delayed_score = (
        (len(delayed_key_points[0]) / len(STORY_KEY_POINTS)) * 40 +
        (delayed_similarity / 100) * 30 +
        (delayed_coherence / 100) * 30
    )

    # --- Recall decay ---
    recall_decay = immediate_score - delayed_score


    features = [[
        immediate_score,
        delayed_score,
        recall_decay,
        (immediate_similarity + delayed_similarity) / 200,   # normalize to 0–1
        (immediate_coherence + delayed_coherence) / 200      # normalize to 0–1
    ]]

    prediction = model.predict(features)[0]
    risk_level = labels[prediction]


    return {
        'immediate': {
            'score': immediate_score,
            'key_points_recalled': len(immediate_key_points[0]),
            'total_key_points': len(STORY_KEY_POINTS),
            'semantic_similarity': immediate_similarity,
            'coherence_score': immediate_coherence,
            'details_recalled': immediate_key_points[0],
            'details_missed': immediate_key_points[1],
            'risk_level': risk_level,
            'recommendations': get_recommendations(risk_level)
        },
        'delayed': {
            'score': delayed_score,
            'key_points_recalled': len(delayed_key_points[0]),
            'total_key_points': len(STORY_KEY_POINTS),
            'semantic_similarity': delayed_similarity,
            'coherence_score': delayed_coherence,
            'details_recalled': delayed_key_points[0],
            'details_missed': delayed_key_points[1],
            'risk_level': risk_level,
            'recommendations': get_recommendations(risk_level)
        },
        'comparison': {
            'recall_decay': recall_decay,
            'concern_level': risk_level
        }
    }