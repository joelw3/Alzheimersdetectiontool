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
    roc_auc_score,
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb
 
warnings.filterwarnings('ignore')
 
 
FEATURE_NAMES = [
    'pauseCount', 'meanPauseDuration', 'speechRate', 'lexicalDiversity',
    'wordsPerMinute', 'immediateScore', 'delayedScore', 'recallDecay',
    'keyPointsRecalled', 'semanticSimilarity', 'coherenceScore'
]
 
RISK_LABELS = {0: 'Low', 1: 'Moderate', 2: 'High'}
 
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
 

def print_real_data_confirmation(data_path: str, n_rows: int):
    """Confirms that a real dataset is being used."""
    border = "=" * 70
    print(f"\n{border}")
    print("  ✅  REAL DATASET LOADED")
    print(border)
    print(f"""
  Source:  {data_path}
  Rows:    {n_rows}
 
  Ensure this dataset has been:
    • Collected under an approved IRB / data use agreement
    • Pre-processed to match the 11 expected feature columns
    • Reviewed for class balance and data quality
 
  The resulting model will reflect real patient distributions.
""")
    print(border + "\n")
 
//Synthetic Data
 
def generate_synthetic_training_data(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates synthetic training data based on clinical literature distributions.
 
    SYNTHETIC DATA — NOT REAL PATIENT DATA
    Distributions are approximated from:
      - Alzheimer's Association 2023 Facts & Figures
      - DementiaBank speech corpus published statistics
      - Framingham Cognitive Study published norms
 
    This function exists solely to allow pipeline development before a real
    dataset is obtained. It will be bypassed automatically when --data-path
    points to a real CSV file.
 
    Risk level proportions:
      Low (CDR=0):      60%
      Moderate (CDR=0.5): 25%
      High (CDR≥1):     15%
    """
    np.random.seed(random_state)
 
    n_low      = int(n_samples * 0.60)
    n_moderate = int(n_samples * 0.25)
    n_high     = n_samples - n_low - n_moderate
 
    data = []
 
    # Low risk — cognitively normal
    for _ in range(n_low):
        data.append({
            'pauseCount':        np.random.normal(5, 2),
            'meanPauseDuration': np.random.normal(0.5, 0.15),
            'speechRate':        np.random.normal(3.8, 0.4),
            'lexicalDiversity':  np.random.normal(0.62, 0.08),
            'wordsPerMinute':    np.random.normal(155, 20),
            'immediateScore':    np.random.normal(78, 8),
            'delayedScore':      np.random.normal(72, 9),
            'recallDecay':       np.random.normal(6, 3),
            'keyPointsRecalled': np.random.randint(5, 9),
            'semanticSimilarity':np.random.normal(72, 10),
            'coherenceScore':    np.random.normal(75, 10),
            'risk_level': 0,
        })
 
    # Moderate risk — MCI
    for _ in range(n_moderate):
        data.append({
            'pauseCount':        np.random.normal(10, 3),
            'meanPauseDuration': np.random.normal(0.8, 0.25),
            'speechRate':        np.random.normal(3.0, 0.5),
            'lexicalDiversity':  np.random.normal(0.48, 0.10),
            'wordsPerMinute':    np.random.normal(115, 25),
            'immediateScore':    np.random.normal(60, 10),
            'delayedScore':      np.random.normal(48, 12),
            'recallDecay':       np.random.normal(12, 5),
            'keyPointsRecalled': np.random.randint(3, 6),
            'semanticSimilarity':np.random.normal(55, 12),
            'coherenceScore':    np.random.normal(58, 12),
            'risk_level': 1,
        })
 
    # High risk — Alzheimer's Disease
    for _ in range(n_high):
        data.append({
            'pauseCount':        np.random.normal(18, 5),
            'meanPauseDuration': np.random.normal(1.3, 0.4),
            'speechRate':        np.random.normal(2.2, 0.5),
            'lexicalDiversity':  np.random.normal(0.32, 0.08),
            'wordsPerMinute':    np.random.normal(75, 20),
            'immediateScore':    np.random.normal(38, 12),
            'delayedScore':      np.random.normal(25, 10),
            'recallDecay':       np.random.normal(20, 7),
            'keyPointsRecalled': np.random.randint(0, 4),
            'semanticSimilarity':np.random.normal(35, 15),
            'coherenceScore':    np.random.normal(38, 15),
            'risk_level': 2,
        })
 
    df = pd.DataFrame(data)
 
    # Clip to realistic ranges
    df['pauseCount']        = df['pauseCount'].clip(0, 30)
    df['meanPauseDuration'] = df['meanPauseDuration'].clip(0.1, 2.5)
    df['speechRate']        = df['speechRate'].clip(1.5, 5.0)
    df['lexicalDiversity']  = df['lexicalDiversity'].clip(0.2, 0.8)
    df['wordsPerMinute']    = df['wordsPerMinute'].clip(40, 200)
    df['immediateScore']    = df['immediateScore'].clip(0, 100)
    df['delayedScore']      = df['delayedScore'].clip(0, 100)
    df['recallDecay']       = df['recallDecay'].clip(-5, 50)
    df['keyPointsRecalled'] = df['keyPointsRecalled'].clip(0, 8)
    df['semanticSimilarity']= df['semanticSimilarity'].clip(0, 100)
    df['coherenceScore']    = df['coherenceScore'].clip(0, 100)
 
    return df
 
 
# ─── Data loading ─────────────────────────────────────────────────────────────
 
def load_or_generate_data(data_path: str = None) -> tuple[pd.DataFrame, bool]:
    """
    Loads real data if --data-path is supplied and the file exists.
    Falls back to synthetic generation otherwise.
 
    Returns:
      (dataframe, is_real_data)  — the boolean flag is passed through so
      downstream steps can attach the appropriate disclaimer to outputs.
    """
    if data_path and os.path.exists(data_path):
        df = pd.read_csv(data_path)
 
        # Validate required columns
        missing = [c for c in FEATURE_NAMES + ['risk_level'] if c not in df.columns]
        if missing:
            raise ValueError(
                f"Real dataset is missing required columns: {missing}\n"
                f"Expected columns: {FEATURE_NAMES + ['risk_level']}"
            )
 
        print_real_data_confirmation(data_path, len(df))
        return df, True
 
    # No real data — fall back to synthetic
    print_synthetic_disclaimer()
    print("Generating synthetic training data...")
    df = generate_synthetic_training_data(n_samples=1200)
 
    os.makedirs('./data', exist_ok=True)
    df.to_csv('./data/synthetic_training_data.csv', index=False)
    print("Synthetic data saved to ./data/synthetic_training_data.csv")
 
    return df, False
 
 
# ─── Preprocessing ────────────────────────────────────────────────────────────
 
def preprocess_data(df: pd.DataFrame):
    """Prepares features and target for training."""
    X = df[FEATURE_NAMES].values
    y = df['risk_level'].values
 
    # Handle missing values
    X = np.nan_to_num(X, nan=np.nanmedian(X, axis=0))
 
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
 
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)
 
    smote = SMOTE(random_state=42)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
 
    return X_train_resampled, X_test_scaled, y_train_resampled, y_test, scaler
 
 
# ─── Model training ───────────────────────────────────────────────────────────
 
def train_xgboost_model(X_train, y_train, X_test, y_test):
    """Trains XGBoost classifier with 5-fold cross-validation."""
    print("\n" + "=" * 70)
    print("TRAINING XGBOOST MODEL")
    print("=" * 70)
 
    model = xgb.XGBClassifier(**XGBOOST_PARAMS)
 
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')
 
    print(f"\nCross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"Individual fold scores: {[f'{s:.4f}' for s in cv_scores]}")
 
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
 
    y_pred       = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
 
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=list(RISK_LABELS.values())))
 
    for i in range(3):
        auc_score = roc_auc_score((y_test == i).astype(int), y_pred_proba[:, i])
        print(f"AUC-ROC for {RISK_LABELS[i]}: {auc_score:.4f}")
 
    return model, cv_scores, y_pred, y_pred_proba
 
 
# ─── Visualizations ───────────────────────────────────────────────────────────
 
def plot_feature_importance(model, output_dir: Path, is_real_data: bool):
    """Plots and saves feature importance. Adds synthetic watermark if applicable."""
    importance = model.feature_importances_
    indices    = np.argsort(importance)[::-1]
 
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_title('Feature Importance — XGBoost Model', fontsize=16, fontweight='bold')
    ax.bar(range(len(importance)), importance[indices], color='steelblue')
    ax.set_xticks(range(len(importance)))
    ax.set_xticklabels([FEATURE_NAMES[i] for i in indices], rotation=45, ha='right')
    ax.set_xlabel('Features', fontsize=12)
    ax.set_ylabel('Importance Score', fontsize=12)
 
    if not is_real_data:
        fig.text(
            0.5, 0.5,
            'SYNTHETIC DATA\nNOT FOR CLINICAL USE',
            fontsize=28, color='red', alpha=0.15,
            ha='center', va='center', rotation=30,
            fontweight='bold', transform=ax.transAxes
        )
 
    plt.tight_layout()
    plt.savefig(output_dir / 'feature_importance.png', dpi=300)
    print(f"\nFeature importance plot saved to {output_dir / 'feature_importance.png'}")
    plt.close()
 
 
def plot_confusion_matrix(y_test, y_pred, output_dir: Path, is_real_data: bool):
    """Plots and saves confusion matrix. Adds synthetic watermark if applicable."""
    cm = confusion_matrix(y_test, y_pred)
 
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=list(RISK_LABELS.values()),
                yticklabels=list(RISK_LABELS.values()), ax=ax)
    ax.set_title('Confusion Matrix', fontsize=16, fontweight='bold')
    ax.set_ylabel('True Label', fontsize=12)
    ax.set_xlabel('Predicted Label', fontsize=12)
 
    if not is_real_data:
        ax.text(
            0.5, 0.5,
            'SYNTHETIC DATA\nNOT FOR CLINICAL USE',
            fontsize=22, color='red', alpha=0.15,
            ha='center', va='center', rotation=30,
            fontweight='bold', transform=ax.transAxes
        )
 
    plt.tight_layout()
    plt.savefig(output_dir / 'confusion_matrix.png', dpi=300)
    print(f"Confusion matrix saved to {output_dir / 'confusion_matrix.png'}")
    plt.close()
 
 
# ─── Export ───────────────────────────────────────────────────────────────────
 
def export_model(model, scaler, cv_scores, output_dir: Path, is_real_data: bool):
    """Exports trained model, scaler, and metadata. Flags synthetic models clearly."""
    output_dir.mkdir(parents=True, exist_ok=True)
 
    model_path = output_dir / 'xgboost_model.json'
    model.save_model(model_path)
    print(f"\nModel saved to {model_path}")
 
    scaler_params = {
        'mean':          scaler.mean_.tolist(),
        'scale':         scaler.scale_.tolist(),
        'feature_names': FEATURE_NAMES,
    }
    with open(output_dir / 'scaler_params.json', 'w') as f:
        json.dump(scaler_params, f, indent=2)
    print(f"Scaler parameters saved to {output_dir / 'scaler_params.json'}")
 
    metrics = {
        # ── Data provenance ──────────────────────────────────────────────────
        'data_source': (
            'REAL_DATASET' if is_real_data
            else 'SYNTHETIC — NOT FOR CLINICAL USE'
        ),
        'clinical_use_approved': is_real_data,
        'synthetic_data_disclaimer': (
            None if is_real_data else
            'This model was trained on synthetically generated data based on '
            'published clinical literature distributions. It has not been '
            'validated against a real patient cohort and must not be used '
            'for clinical decision-making. Replace with a real dataset from '
            'DementiaBank, ADNI, or PREVENT-AD before any clinical deployment.'
        ),
 
        # ── Model metadata ───────────────────────────────────────────────────
        'model_type':        'XGBoost Classifier',
        'n_features':        len(FEATURE_NAMES),
        'feature_names':     FEATURE_NAMES,
        'risk_labels':       RISK_LABELS,
        'cross_val_scores':  cv_scores.tolist(),
        'mean_cv_accuracy':  float(cv_scores.mean()),
        'std_cv_accuracy':   float(cv_scores.std()),
        'hyperparameters':   XGBOOST_PARAMS,
        'training_date':     datetime.now().isoformat(),
    }
    with open(output_dir / 'training_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Training metrics saved to {output_dir / 'training_metrics.json'}")
 
    # Write a plain-text DISCLAIMER file alongside the model
    if not is_real_data:
        disclaimer_path = output_dir / 'DISCLAIMER.txt'
        with open(disclaimer_path, 'w') as f:
            f.write(
                "SYNTHETIC DATA MODEL — NOT FOR CLINICAL USE\n"
                "=" * 50 + "\n\n"
                "This model was trained on synthetically generated data.\n"
                "It must NOT be used to assess real patients.\n\n"
                "To replace with a real model:\n"
                "  1. Obtain a validated dataset (DementiaBank, ADNI, PREVENT-AD)\n"
                "  2. Prepare a CSV with the required 12 columns\n"
                "  3. Run: python train_xgboost.py --data-path ./data/real_dataset.csv\n\n"
                f"Generated: {datetime.now().isoformat()}\n"
            )
        print(f"Disclaimer file written to {disclaimer_path}")
 
 
 
def main():
    parser = argparse.ArgumentParser(
        description="Train XGBoost model for Alzheimer's risk assessment"
    )
    parser.add_argument(
        '--data-path', type=str, default=None,
        help=(
            'Path to real training data CSV. '
            'If omitted, synthetic data is used (development only).'
        )
    )
    parser.add_argument(
        '--output-dir', type=str, default='./ml_models',
        help='Directory to save trained model and outputs'
    )
    args = parser.parse_args()
 
    output_dir = Path(args.output_dir)
 
    print("\n" + "=" * 70)
    print("ALZHEIMER'S RISK ASSESSMENT — XGBOOST TRAINING PIPELINE")
    print("=" * 70)
 
    # Load data — prints disclaimer or confirmation depending on source
    df, is_real_data = load_or_generate_data(args.data_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Risk level distribution:\n{df['risk_level'].value_counts().sort_index()}")
 
    # Preprocess
    X_train, X_test, y_train, y_test, scaler = preprocess_data(df)
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Test samples:     {len(X_test)}")
 
    # Train
    model, cv_scores, y_pred, y_pred_proba = train_xgboost_model(
        X_train, y_train, X_test, y_test
    )
 
    # Visualize — watermarked if synthetic
    plot_feature_importance(model, output_dir, is_real_data)
    plot_confusion_matrix(y_test, y_pred, output_dir, is_real_data)
 
    # Export — includes DISCLAIMER.txt if synthetic
    export_model(model, scaler, cv_scores, output_dir, is_real_data)
 
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE")
    print("=" * 70)
 
    if not is_real_data:
        print("""
⚠️  Reminder: this model was trained on SYNTHETIC data.
   Do not deploy it for real patient assessments.
   See DISCLAIMER.txt in the output directory.
""")
    else:
        print("""
✅  Model trained on real dataset and ready for validation.
   Review confusion_matrix.png and training_metrics.json
   before deploying to production.
""")
 
    print(f"All outputs saved to: {output_dir.resolve()}")
    print("\nNext steps:")
    if not is_real_data:
        print("  1. Obtain a real dataset (DementiaBank / ADNI / PREVENT-AD)")
        print("  2. Re-run with --data-path to train a clinically valid model")
        print("  3. Then review outputs and copy model to deployment environment")
    else:
        print("  1. Review feature_importance.png and confusion_matrix.png")
        print("  2. Copy xgboost_model.json to your deployment environment")
        print("  3. Update the inference server to load the trained model")
        print("  4. Test predictions with held-out patient data")
 
 
if __name__ == '__main__':
    main()