/**
 * mlIntegrationGuide.ts
 * FILE: src/app/utils/mlIntegrationGuide.ts
 *
 * A living reference document describing what has been implemented,
 * what is a placeholder pending real data, and what is planned.
 *
 * CURRENT STATUS (as of this version):
 *   ✅ Levenshtein-based text similarity
 *   ✅ Multi-keyword + fuzzy key-point matching (first-word bug fixed)
 *   ✅ Rule-based risk classification (WMS-IV norms, replaces Decision Tree)
 *   ✅ MediaRecorder blob pipeline replacing webkitSpeechRecognition
 *   ✅ Whisper transcription via /api/speech-to-text
 *   ✅ Lexical diversity (TTR) and words-per-minute from transcript
 *   ✅ XGBoost inference endpoint (supabase/functions/server/xgboost_model.tsx)
 *      — currently running a weighted heuristic pending a real trained model
 *   🔲 Pause count and mean pause duration (requires /api/acoustic-features)
 *   🔲 Speech rate from audio (requires phoneme segmentation backend)
 *   🔲 XGBoost model trained on real patient data (DementiaBank / ADNI)
 *   🔲 Longitudinal trend analysis across multiple sessions
 */

// ─── What still needs a real dataset ─────────────────────────────────────────
//
// The XGBoost model in supabase/functions/server/xgboost_model.tsx currently
// uses a weighted heuristic (predictWithHeuristic) rather than a trained model.
// This will be replaced once a validated dataset is obtained.
//
// Recommended data sources:
//   1. DementiaBank Pitt Corpus      — https://dementia.talkbank.org/
//      Story recall + connected speech; 551 participants; requires DUA
//   2. ADNI                          — https://adni.loni.usc.edu/
//      Longitudinal cognitive scores; free with registration
//   3. ADReSS Challenge Dataset      — balanced audio + transcripts
//   4. PREVENT-AD                    — https://prevent-alzheimer.net/
//      Pre-symptomatic cohort with speech and cognitive measures
//
// When a dataset is available:
//   1. Run ml_training/train_xgboost.py with --data-path ./data/real_dataset.csv
//   2. The script outputs xgboost_model.json and scaler_params.json
//   3. Load xgboost_model.json in xgboost_model.tsx, replacing predictWithHeuristic
//   4. Update the imputation defaults in imputeMissingFeatures() to match the
//      real dataset medians printed by the training script

// ─── Acoustic features still needed ──────────────────────────────────────────
//
// speechPipeline.ts currently computes:
//   - lexicalDiversity (TTR) from transcript text — implemented
//   - wordsPerMinute from transcript + audio duration — implemented
//
// Still requiring a backend audio-analysis endpoint (/api/acoustic-features):
//   - pauseCount (pauses > 0.25 s) — use webrtcvad or Parselmouth in Python
//   - meanPauseDuration             — same
//   - speechRate (syllables/sec)   — requires phoneme segmentation (Montreal Forced Aligner)
//
// These three features feed directly into the XGBoost model. The model's
// imputeMissingFeatures() function fills them with training-set medians until
// the backend endpoint is implemented, so the system degrades gracefully.

// ─── Future enhancements ──────────────────────────────────────────────────────
//
// Phase 1 — Improve semantic scoring
//   Replace Levenshtein similarity with sentence embeddings for better handling
//   of paraphrases. Candidate: sentence-transformers/all-MiniLM-L6-v2 via
//   @xenova/transformers (runs in-browser, no additional backend needed).
//
//   Example:
//     import { pipeline } from '@xenova/transformers';
//     const embed = await pipeline('feature-extraction', 'sentence-transformers/all-MiniLM-L6-v2');
//     const [a] = await embed(originalStory);
//     const [b] = await embed(recalledStory);
//     const cosine = dotProduct(a, b) / (magnitude(a) * magnitude(b));
//
// Phase 2 — Named Entity Recognition
//   Automatically extract and score person names, locations, and objects
//   from the recalled text instead of relying on the fixed STORY_KEY_POINTS list.
//   Candidate: spaCy (Python backend) or wink-nlp (browser-side).
//
// Phase 3 — Longitudinal tracking
//   The dashboard currently shows individual session scores. Adding a trend
//   line across sessions (e.g. delayed-recall score over time per patient)
//   would provide a stronger clinical signal than any single test.
//   A score decline of > 10 points over 6 months is a clinically significant
//   finding independent of absolute score level.
//
// Phase 4 — Explainable AI
//   Add SHAP values from the XGBoost model to the results page so clinicians
//   can see which features drove the risk classification. xgboost supports
//   SHAP natively via model.get_booster().predict(data, pred_contribs=True).

// ─── Regulatory and ethical notes ────────────────────────────────────────────
//
// - This tool is a screening aid, not a diagnostic device. All results pages
//   and downloaded reports include a disclaimer to this effect.
// - If used beyond internal research, FDA Class II device classification may
//   apply. Clinical validation studies would be required.
// - Patient data must be handled in compliance with HIPAA (US) or PIPEDA (CA).
//   The current in-memory storage in app.py is for development only and must
//   be replaced with an encrypted, access-controlled database before deployment.
// - Test across diverse populations (education level, primary language, cultural
//   background) before clinical deployment to avoid algorithmic bias.

export const ML_INTEGRATION_STATUS = {
  currentApproach: "Rule-based NLP (Levenshtein + fuzzy key-point matching) with XGBoost heuristic",
  xgboostModelState: "Heuristic placeholder — replace predictWithHeuristic() once real model trained",
  acousticFeaturesState: "TTR and WPM implemented; pauseCount/speechRate pending /api/acoustic-features endpoint",
  readyForProduction: false,
  nextSteps: [
    "Obtain DementiaBank or ADNI dataset and run ml_training/train_xgboost.py",
    "Implement /api/acoustic-features endpoint using webrtcvad or Parselmouth",
    "Replace predictWithHeuristic() in xgboost_model.tsx with loaded JSON model",
    "Add sentence-embedding similarity to replace Levenshtein (Phase 1)",
    "Implement longitudinal trend chart in Dashboard (Phase 3)",
  ],
} as const;