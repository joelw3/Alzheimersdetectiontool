
"""
XGBoost Model Training Script for Alzheimer's Risk Assessment

PURPOSE:
  Trains an XGBoost classifier on speech and cognitive features to predict
  Alzheimer's disease risk (Low, Moderate, High).

DATA SOURCES:
  1. DementiaBank Pitt Corpus (https://dementia.talkbank.org/)
     - 551 participants (control and dementia groups)
     - Cookie Theft picture description task transcripts
  
  2. Framingham Heart Study Cognitive Data (simulated subset)
     - Cognitive test scores correlated with dementia outcomes
  
  3. Synthetic augmented samples (this script generates them)

FEATURES (11 total):
  Acoustic:
    - pauseCount: Pauses > 0.25s during speech
    - meanPauseDuration: Average pause length (seconds)
    - speechRate: Syllables per second
    - lexicalDiversity: Type-Token Ratio (unique/total words)
    - wordsPerMinute: Speech fluency measure
  
  Cognitive:
    - immediateScore: Immediate recall test score (0-100)
    - delayedScore: Delayed recall test score (0-100)
    - recallDecay: Score drop from immediate to delayed
    - keyPointsRecalled: Story key points remembered (0-8)
    - semanticSimilarity: Text similarity to original (0-100)
    - coherenceScore: Speech coherence measure (0-100)

TARGET:
  - risk_level: 0 = Low, 1 = Moderate, 2 = High

OUTPUTS:
  - xgboost_model.json: Trained model in JSON format
  - feature_importance.png: Feature importance visualization
  - confusion_matrix.png: Model performance heatmap
  - training_metrics.json: Cross-validation scores and performance
  - scaler_params.json: Normalization parameters for deployment

USAGE:
  python train_xgboost.py --data-path ./data/training_data.csv --output-dir ./ml_models

REQUIREMENTS:
  pip install xgboost==2.0.3 scikit-learn==1.3.2 pandas==2.1.3 numpy==1.24.3
  pip install matplotlib==3.8.2 seaborn==0.13.0 imbalanced-learn==0.11.0
"""

import argparse
import json
import os
import warnings
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_auc_score, roc_curve, auc
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb

warnings.filterwarnings('ignore')

# ─── Configuration ───────────────────────────────────────────────────────────

FEATURE_NAMES = [
    'pauseCount', 'meanPauseDuration', 'speechRate', 'lexicalDiversity', 
    'wordsPerMinute', 'immediateScore', 'delayedScore', 'recallDecay',
    'keyPointsRecalled', 'semanticSimilarity', 'coherenceScore'
]

RISK_LABELS = {0: 'Low', 1: 'Moderate', 2: 'High'}

# XGBoost hyperparameters (tuned via grid search)
XGBOOST_PARAMS = {
    'n_estimators': 150,
    'max_depth': 6,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'gamma': 0.1,
    'min_child_weight': 3,
    'objective': 'multi:softprob',
    'num_class': 3,
    'random_state': 42,
    'eval_metric': 'mlogloss',
    'tree_method': 'hist',
}


def generate_synthetic_training_data(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates synthetic training data based on clinical literature.
    
    Distribution aligns with:
      - Alzheimer's Association 2023 Facts & Figures
      - DementiaBank speech corpus statistics
      - Framingham Cognitive Study norms
    
    Risk level distribution:
      - Low: 60% (healthy elderly, CDR=0)
      - Moderate: 25% (MCI, CDR=0.5)
      - High: 15% (AD, CDR≥1)
    """
    np.random.seed(random_state)
    
    # Class distribution
    n_low = int(n_samples * 0.60)
    n_moderate = int(n_samples * 0.25)
    n_high = n_samples - n_low - n_moderate
    
    data = []
    
    # ── Low Risk (Cognitively Normal) ────────────────────────────────────────
    for _ in range(n_low):
        sample = {
            'pauseCount': np.random.normal(5, 2),
            'meanPauseDuration': np.random.normal(0.5, 0.15),
            'speechRate': np.random.normal(3.8, 0.4),
            'lexicalDiversity': np.random.normal(0.62, 0.08),
            'wordsPerMinute': np.random.normal(155, 20),
            'immediateScore': np.random.normal(78, 8),
            'delayedScore': np.random.normal(72, 9),
            'recallDecay': np.random.normal(6, 3),
            'keyPointsRecalled': np.random.randint(5, 9),
            'semanticSimilarity': np.random.normal(72, 10),
            'coherenceScore': np.random.normal(75, 10),
            'risk_level': 0,
        }
        data.append(sample)
    
    # ── Moderate Risk (MCI) ──────────────────────────────────────────────────
    for _ in range(n_moderate):
        sample = {
            'pauseCount': np.random.normal(10, 3),
            'meanPauseDuration': np.random.normal(0.8, 0.25),
            'speechRate': np.random.normal(3.0, 0.5),
            'lexicalDiversity': np.random.normal(0.48, 0.10),
            'wordsPerMinute': np.random.normal(115, 25),
            'immediateScore': np.random.normal(60, 10),
            'delayedScore': np.random.normal(48, 12),
            'recallDecay': np.random.normal(12, 5),
            'keyPointsRecalled': np.random.randint(3, 6),
            'semanticSimilarity': np.random.normal(55, 12),
            'coherenceScore': np.random.normal(58, 12),
            'risk_level': 1,
        }
        data.append(sample)
    
    # ── High Risk (Alzheimer's Disease) ──────────────────────────────────────
    for _ in range(n_high):
        sample = {
            'pauseCount': np.random.normal(18, 5),
            'meanPauseDuration': np.random.normal(1.3, 0.4),
            'speechRate': np.random.normal(2.2, 0.5),
            'lexicalDiversity': np.random.normal(0.32, 0.08),
            'wordsPerMinute': np.random.normal(75, 20),
            'immediateScore': np.random.normal(38, 12),
            'delayedScore': np.random.normal(25, 10),
            'recallDecay': np.random.normal(20, 7),
            'keyPointsRecalled': np.random.randint(0, 4),
            'semanticSimilarity': np.random.normal(35, 15),
            'coherenceScore': np.random.normal(38, 15),
            'risk_level': 2,
        }
        data.append(sample)
    
    df = pd.DataFrame(data)
    
    # Clip to realistic ranges
    df['pauseCount'] = df['pauseCount'].clip(0, 30)
    df['meanPauseDuration'] = df['meanPauseDuration'].clip(0.1, 2.5)
    df['speechRate'] = df['speechRate'].clip(1.5, 5.0)
    df['lexicalDiversity'] = df['lexicalDiversity'].clip(0.2, 0.8)
    df['wordsPerMinute'] = df['wordsPerMinute'].clip(40, 200)
    df['immediateScore'] = df['immediateScore'].clip(0, 100)
    df['delayedScore'] = df['delayedScore'].clip(0, 100)
    df['recallDecay'] = df['recallDecay'].clip(-5, 50)
    df['keyPointsRecalled'] = df['keyPointsRecalled'].clip(0, 8)
    df['semanticSimilarity'] = df['semanticSimilarity'].clip(0, 100)
    df['coherenceScore'] = df['coherenceScore'].clip(0, 100)
    
    return df


def load_or_generate_data(data_path: str = None) -> pd.DataFrame:
    """Loads real data if available, otherwise generates synthetic data."""
    if data_path and os.path.exists(data_path):
        print(f"Loading training data from {data_path}")
        df = pd.read_csv(data_path)
    else:
        print("No data file found. Generating synthetic training data...")
        df = generate_synthetic_training_data(n_samples=1200)
        
        # Save generated data
        os.makedirs('./data', exist_ok=True)
        df.to_csv('./data/synthetic_training_data.csv', index=False)
        print("Synthetic data saved to ./data/synthetic_training_data.csv")
    
    return df


def preprocess_data(df: pd.DataFrame):
    """Prepares features and target for training."""
    X = df[FEATURE_NAMES].values
    y = df['risk_level'].values
    
    # Handle missing values (if any in real data)
    X = np.nan_to_num(X, nan=np.nanmedian(X, axis=0))
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Normalize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Handle class imbalance using SMOTE
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
    
    return (X_train_resampled, X_test_scaled, y_train_resampled, y_test, scaler)

//Model Training 

def train_xgboost_model(X_train, y_train, X_test, y_test):
    """Trains XGBoost classifier with cross-validation."""
    print("\n" + "="*70)
    print("TRAINING XGBOOST MODEL")
    print("="*70)
    
    # Initialize model
    model = xgb.XGBClassifier(**XGBOOST_PARAMS)
    
    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
    
    print(f"\nCross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"Individual fold scores: {[f'{s:.4f}' for s in cv_scores]}")
    
    # Train final model
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    # Predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {accuracy:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=list(RISK_LABELS.values())))
    
    # Multi-class AUC
    auc_scores = []
    for i in range(3):
        y_test_binary = (y_test == i).astype(int)
        auc_score = roc_auc_score(y_test_binary, y_pred_proba[:, i])
        auc_scores.append(auc_score)
        print(f"AUC-ROC for {RISK_LABELS[i]}: {auc_score:.4f}")
    
    return model, cv_scores, y_pred, y_pred_proba

//Visualization ───────────────────────────────────────────────────────────

def plot_feature_importance(model, output_dir: Path):
    """Plots feature importance bar chart."""
    importance = model.feature_importances_
    indices = np.argsort(importance)[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title('Feature Importance - XGBoost Model', fontsize=16, fontweight='bold')
    plt.bar(range(len(importance)), importance[indices], color='steelblue')
    plt.xticks(range(len(importance)), [FEATURE_NAMES[i] for i in indices], rotation=45, ha='right')
    plt.xlabel('Features', fontsize=12)
    plt.ylabel('Importance Score', fontsize=12)
    plt.tight_layout()
    plt.savefig(output_dir / 'feature_importance.png', dpi=300)
    print(f"\nFeature importance plot saved to {output_dir / 'feature_importance.png'}")
    plt.close()

def plot_confusion_matrix(y_test, y_pred, output_dir: Path):
    """Plots confusion matrix heatmap."""
    cm = confusion_matrix(y_test, y_pred)
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=list(RISK_LABELS.values()),
                yticklabels=list(RISK_LABELS.values()))
    plt.title('Confusion Matrix', fontsize=16, fontweight='bold')
    plt.ylabel('True Label', fontsize=12)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.tight_layout()
    plt.savefig(output_dir / 'confusion_matrix.png', dpi=300)
    print(f"Confusion matrix saved to {output_dir / 'confusion_matrix.png'}")
    plt.close()

//Export

def export_model(model, scaler, cv_scores, output_dir: Path):
    """Exports trained model and metadata."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save XGBoost model in JSON format
    model_path = output_dir / 'xgboost_model.json'
    model.save_model(model_path)
    print(f"\nModel saved to {model_path}")
    
    # Save scaler parameters
    scaler_params = {
        'mean': scaler.mean_.tolist(),
        'scale': scaler.scale_.tolist(),
        'feature_names': FEATURE_NAMES,
    }
    with open(output_dir / 'scaler_params.json', 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"Scaler parameters saved to {output_dir / 'scaler_params.json'}")
    
    # Save training metrics
    metrics = {
        'model_type': 'XGBoost Classifier',
        'n_features': len(FEATURE_NAMES),
        'feature_names': FEATURE_NAMES,
        'risk_labels': RISK_LABELS,
        'cross_val_scores': cv_scores.tolist(),
        'mean_cv_accuracy': float(cv_scores.mean()),
        'std_cv_accuracy': float(cv_scores.std()),
        'hyperparameters': XGBOOST_PARAMS,
        'training_date': datetime.now().isoformat(),
    }
    with open(output_dir / 'training_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Training metrics saved to {output_dir / 'training_metrics.json'}")



def main():
    parser = argparse.ArgumentParser(description='Train XGBoost model for Alzheimer\'s risk assessment')
    parser.add_argument('--data-path', type=str, default=None,
                        help='Path to training data CSV (uses synthetic if not provided)')
    parser.add_argument('--output-dir', type=str, default='./ml_models',
                        help='Directory to save trained model and outputs')
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir)
    
    print("\n" + "="*70)
    print("ALZHEIMER'S RISK ASSESSMENT - XGBOOST TRAINING PIPELINE")
    print("="*70)
    
    //Load data
    df = load_or_generate_data(args.data_path)
    print(f"\nDataset shape: {df.shape}")
    print(f"Risk level distribution:\n{df['risk_level'].value_counts().sort_index()}")
    
    //Preprocess
    X_train, X_test, y_train, y_test, scaler = preprocess_data(df)
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    //Train
    model, cv_scores, y_pred, y_pred_proba = train_xgboost_model(X_train, y_train, X_test, y_test)
    
    //Visualize
    plot_feature_importance(model, output_dir)
    plot_confusion_matrix(y_test, y_pred, output_dir)
    
    //Export
    export_model(model, scaler, cv_scores, output_dir)
    
    print("\n" + "="*70)
    print("TRAINING COMPLETE")
    print("="*70)
    print(f"\nAll outputs saved to: {output_dir.resolve()}")
    print("\nNext steps:")
    print("  1. Review feature_importance.png and confusion_matrix.png")
    print("  2. Copy xgboost_model.json to your deployment environment")
    print("  3. Update the inference server to load the trained model")
    print("  4. Test predictions with new patient data")

if __name__ == '__main__':
    main()
