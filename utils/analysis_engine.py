"""
AI Analysis Engine for Alzheimer's Early Detection
Analyzes story recall using NLP techniques
"""

from typing import Dict, List, Tuple
from utils.story_data import STORY_KEY_POINTS, STORY_TEXT


def levenshtein_distance(str1: str, str2: str) -> int:
    """
    Calculate Levenshtein distance between two strings
    Returns the minimum number of edits needed to transform str1 into str2
    """
    len1 = len(str1)
    len2 = len(str2)
    
    # Create matrix
    matrix = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    
    # Initialize first column and row
    for i in range(len1 + 1):
        matrix[i][0] = i
    for j in range(len2 + 1):
        matrix[0][j] = j
    
    # Fill the matrix
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if str1[i-1] == str2[j-1] else 1
            matrix[i][j] = min(
                matrix[i-1][j] + 1,      # deletion
                matrix[i][j-1] + 1,      # insertion
                matrix[i-1][j-1] + cost  # substitution
            )
    
    return matrix[len1][len2]


def calculate_similarity(original: str, recalled: str) -> float:
    """
    Calculate semantic similarity percentage using Levenshtein distance
    """
    distance = levenshtein_distance(
        original.lower(),
        recalled.lower()
    )
    max_len = max(len(original), len(recalled))
    
    if max_len == 0:
        return 0.0
    
    similarity = ((max_len - distance) / max_len) * 100
    return similarity


def check_key_points(recalled_text: str) -> Tuple[List[str], List[str]]:
    """
    Check which key points from the story were recalled
    Returns: (recalled_points, missed_points)
    """
    recalled = []
    missed = []
    lower_recalled = recalled_text.lower()
    
    for point in STORY_KEY_POINTS:
        lower_point = point.lower()
        # Check for partial matches (first word of key point)
        first_word = lower_point.split()[0]
        if first_word in lower_recalled:
            recalled.append(point)
        else:
            missed.append(point)
    
    return recalled, missed


def calculate_coherence(text: str) -> float:
    """
    Calculate coherence score based on sentence structure and length
    """
    if not text or len(text.strip()) < 20:
        return 0.0
    
    # Split into sentences
    sentences = [s.strip() for s in text.replace('!', '.').replace('?', '.').split('.') if s.strip()]
    
    if not sentences:
        return 0.0
    
    # Check coherence indicators
    has_proper_length = len(text) > 50
    has_multiple_sentences = len(sentences) > 2
    has_reasonable_word_count = len(text.split()) > 15
    
    score = 0.0
    if has_proper_length:
        score += 33.33
    if has_multiple_sentences:
        score += 33.33
    if has_reasonable_word_count:
        score += 33.34
    
    return score


def get_risk_level(score: float, is_delayed: bool = False) -> str:
    """
    Determine risk level based on score
    """
    if is_delayed:
        if score >= 60:
            return "Low"
        elif score >= 40:
            return "Moderate"
        else:
            return "High"
    else:
        if score >= 70:
            return "Low"
        elif score >= 50:
            return "Moderate"
        else:
            return "High"


def get_recommendations(risk: str, is_delayed: bool) -> List[str]:
    """
    Get recommendations based on risk level
    """
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
    """
    Main analysis function that processes both recall attempts
    Returns comprehensive analysis results
    """
    # Analyze immediate recall
    immediate_key_points = check_key_points(immediate_recall)
    immediate_similarity = calculate_similarity(STORY_TEXT, immediate_recall)
    immediate_coherence = calculate_coherence(immediate_recall)
    
    immediate_score = (
        (len(immediate_key_points[0]) / len(STORY_KEY_POINTS)) * 40 +
        (immediate_similarity / 100) * 30 +
        (immediate_coherence / 100) * 30
    )
    
    # Analyze delayed recall
    delayed_key_points = check_key_points(delayed_recall)
    delayed_similarity = calculate_similarity(STORY_TEXT, delayed_recall)
    delayed_coherence = calculate_coherence(delayed_recall)
    
    delayed_score = (
        (len(delayed_key_points[0]) / len(STORY_KEY_POINTS)) * 40 +
        (delayed_similarity / 100) * 30 +
        (delayed_coherence / 100) * 30
    )
    
    # Calculate recall decay
    recall_decay = immediate_score - delayed_score
    
    # Determine risk levels
    immediate_risk = get_risk_level(immediate_score, False)
    delayed_risk = get_risk_level(delayed_score, True)
    
    # Overall concern level based on decay and absolute scores
    if recall_decay > 30 or delayed_score < 40:
        concern_level = "High"
    elif recall_decay > 20 or delayed_score < 60:
        concern_level = "Moderate"
    else:
        concern_level = "Low"
    
    return {
        'immediate': {
            'score': immediate_score,
            'key_points_recalled': len(immediate_key_points[0]),
            'total_key_points': len(STORY_KEY_POINTS),
            'semantic_similarity': immediate_similarity,
            'coherence_score': immediate_coherence,
            'details_recalled': immediate_key_points[0],
            'details_missed': immediate_key_points[1],
            'risk_level': immediate_risk,
            'recommendations': get_recommendations(immediate_risk, False)
        },
        'delayed': {
            'score': delayed_score,
            'key_points_recalled': len(delayed_key_points[0]),
            'total_key_points': len(STORY_KEY_POINTS),
            'semantic_similarity': delayed_similarity,
            'coherence_score': delayed_coherence,
            'details_recalled': delayed_key_points[0],
            'details_missed': delayed_key_points[1],
            'risk_level': delayed_risk,
            'recommendations': get_recommendations(delayed_risk, True)
        },
        'comparison': {
            'recall_decay': recall_decay,
            'concern_level': concern_level
        }
    }
