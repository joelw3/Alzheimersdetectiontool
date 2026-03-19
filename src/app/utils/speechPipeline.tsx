/**
 *
 * PURPOSE:
 *   Handles all audio recording, transcription via Whisper, and the acoustic
 *   biomarker analysis template. Replace the in-browser WebkitSpeechRecognition
 *   API (currently used in ImmediateRecall.tsx and DelayedRecall.tsx) with
 *   this module for higher accuracy and future acoustic feature support
 *
 * ABOUT THE RESEARCH IMAGE (PSD scatter plots):
 *   The uploaded figures show Posterior Spectral Density (PSD) — a measure of
 *   EEG/neural oscillation power — correlated with:
 *     - AV45 SUVR (amyloid PET uptake in frontal/temporal lobes)  [top row]
 *     - MoCA scores, CDR staging, Aβ42/40 ratio                   [middle row]
 *     - Serum GFAP, NFL, p-Tau 217                                 [bottom row — IGNORED per request]
 *   PSD correlates (r ≈ 0.20, p < 0.05) with amyloid burden. This is an EEG
 *   biomarker, not a speech biomarker. SPEECH biomarkers that map to similar
 *   AD staging are:
 *     - Pause rate / duration (correlates with CDR staging)
 *     - Speech rate (syllables/sec) — slows in MCI→AD
 *     - Lexical diversity (Type-Token Ratio) — decreases in AD
 *     - Verbal fluency (words/minute) — decreases across CDR 0→0.5→≥1
 *   A TEMPLATE for these is provided in the AcousticBiomarkers section below.
 *   When a validated speech dataset (e.g. DementiaBank Pitt Corpus) is
 *   available, replace the placeholder functions with real feature extractors.
 * ─────────────────────────────────────────────────────────────────────────────
 */
 
// ─── Types ───────────────────────────────────────────────────────────────────
 
export interface TranscriptionResult {
  transcript: string;
  /** Duration of the audio clip in seconds */
  durationSeconds: number;
  /** Whether Whisper returned a high-confidence result */
  confidence: "high" | "low" | "unavailable";
}
 
export interface AcousticFeatures {
  /**
   * Total number of pauses > 0.25 s detected in the recording.
   * PLACEHOLDER — requires server-side audio analysis. Will be set to null until implemented.
   */
  pauseCount: number | null;
 
  /**
   * Mean pause duration in seconds.
   * PLACEHOLDER — same requirement as pauseCount.
   */
  meanPauseDuration: number | null;
 
  /**
   * Syllables per second over the recording.
   * PLACEHOLDER — requires phoneme segmentation.
   */
  speechRate: number | null;
 
  /**
   * Type-Token Ratio: unique words / total words. Computed from transcript.
   * This IS computable from the transcript alone (no audio needed).
   */
  lexicalDiversity: number | null;
 
  /**
   * Words per minute derived from transcript length and audio duration.
   * Computable once durationSeconds is known.
   */
  wordsPerMinute: number | null;
}
 
export interface SpeechAnalysisResult {
  transcription: TranscriptionResult;
  acousticFeatures: AcousticFeatures;
  /**
   * Combined risk signal from acoustic features.
   * Returns null until a validated model/dataset is integrated.
   * Replace computeAcousticRisk() body when dataset is available.
   */
  acousticRiskSignal: "Low" | "Moderate" | "High" | null;
}
 

export interface AudioRecorderController {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  /** Live audio level 0–1 for the VU meter indicator */
  getLevel: () => number;
}
 
export function createAudioRecorder(): AudioRecorderController {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let analyser: AnalyserNode | null = null;
  let audioCtx: AudioContext | null = null;
 
  return {
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 
      // Set up AnalyserNode for live VU meter level
      audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
 
      chunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start(100); // collect chunks every 100 ms
    },
 
    stop(): Promise<Blob> {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) return reject(new Error("Recorder not started"));
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          audioCtx?.close();
          resolve(blob);
        };
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      });
    },
 
    getLevel(): number {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      return avg / 128; // normalised 0–1
    },
  };
}
 

export async function transcribeAudio(
  audioBlob: Blob
): Promise<TranscriptionResult> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recall.webm");
 
  let response: Response;
  try {
    response = await fetch("/api/speech-to-text", {
      method: "POST",
      body: formData,
    });
  } catch {
    // Network error — fall back to empty transcript
    return { transcript: "", durationSeconds: 0, confidence: "unavailable" };
  }
 
  if (!response.ok) {
    return { transcript: "", durationSeconds: 0, confidence: "unavailable" };
  }
 
  const data = await response.json();
  return {
    transcript: data.transcript ?? "",
    durationSeconds: data.duration ?? 0,
    confidence: data.transcript ? "high" : "low",
  };
}
 

// Features derived from the research literature on speech-based AD biomarkers.
// Functions marked PLACEHOLDER require a validated dataset or audio-analysis
// backend before they return real values.
//
// The PSD correlations in the uploaded images (r≈0.20, p<0.05 with AV45 SUVR)
// suggest even weak speech-derived PSD proxies add signal. Map when available:
//   CDR=0 (CU) → low pause rate, high speech rate, high TTR
//   CDR=0.5 (MCI) → moderately elevated pause rate
//   CDR≥1 (AD) → significantly elevated pause rate, low speech rate, low TTR
 
function computeLexicalDiversity(transcript: string): number | null {
  const words = transcript.toLowerCase().match(/\b[a-z']+\b/g);
  if (!words || words.length < 10) return null; // too short to be meaningful
  const unique = new Set(words);
  return unique.size / words.length; // Type-Token Ratio, range 0–1
}
 
function computeWordsPerMinute(
  transcript: string,
  durationSeconds: number
): number | null {
  if (durationSeconds < 5) return null;
  const wordCount = transcript.trim().split(/\s+/).length;
  return (wordCount / durationSeconds) * 60;
}
 
/** ── PLACEHOLDER: pause analysis ─────────────────────────────────────────────
 * To implement:
 *   1. Send the audio blob to a new backend endpoint /api/acoustic-features
 *   2. In Python, use webrtcvad or Parselmouth to detect silence segments
 *   3. Return { pauseCount, meanPauseDuration, speechRate }
 *   4. Replace the null returns below with the fetched values
 * ─────────────────────────────────────────────────────────────────────────── */
async function fetchAcousticFeaturesFromServer(
  _audioBlob: Blob
): Promise<Pick<AcousticFeatures, "pauseCount" | "meanPauseDuration" | "speechRate">> {
  // PLACEHOLDER — endpoint does not exist yet.
  // When implemented, POST the blob to /api/acoustic-features and parse response.
  return {
    pauseCount: null,
    meanPauseDuration: null,
    speechRate: null,
  };
}
 
/** PLACEHOLDER: acoustic risk model 
 * Once dataset is obtained, train a logistic regression or lightweight classifier on:
 *   [pauseCount, meanPauseDuration, speechRate, lexicalDiversity, wordsPerMinute]
 * and replace this function body with the trained model's inference logic.
 *
 * The PSD scatter plots show CDR=0 (red) clusters at low PSD, CDR=0.5 (green)
 * at mid PSD, CDR≥1 (blue) at higher PSD. A speech-feature model would
 * produce a graph and analysis across pause rate and lexical diversity.
 */
function computeAcousticRisk(
  features: AcousticFeatures
): "Low" | "Moderate" | "High" | null {
  // Return null if core features are unavailable (placeholder state)
  if (features.pauseCount === null && features.speechRate === null) return null;
 
  // ── Interim heuristic (replace with trained model) 
  // Based on literature norms for connected speech in adults 65+:
  //   Normal speech rate: 120–180 wpm
  //   Mild impairment: 90–120 wpm
  //   Significant impairment: <90 wpm
  //   Normal TTR: >0.45
  //   Impaired TTR: <0.35
  const wpm = features.wordsPerMinute;
  const ttr = features.lexicalDiversity;
 
  let signals = 0;
  if (wpm !== null && wpm < 90) signals += 2;
  else if (wpm !== null && wpm < 120) signals += 1;
  if (ttr !== null && ttr < 0.35) signals += 2;
  else if (ttr !== null && ttr < 0.45) signals += 1;
 
  if (signals >= 3) return "High";
  if (signals >= 1) return "Moderate";
  return "Low";
}
 
//   4. Master function — transcribe + extract features 
//
//   const result = await transcribeAndAnalyze(audioBlob);
//   setRecordedText(result.transcription.transcript);
//   sessionStorage.setItem("immediateRecallAcoustics", JSON.stringify(result.acousticFeatures));
 
export async function transcribeAndAnalyze(
  audioBlob: Blob
): Promise<SpeechAnalysisResult> {
  const [transcription, serverAcoustics] = await Promise.all([
    transcribeAudio(audioBlob),
    fetchAcousticFeaturesFromServer(audioBlob),
  ]);
 
  const acousticFeatures: AcousticFeatures = {
    ...serverAcoustics,
    lexicalDiversity: computeLexicalDiversity(transcription.transcript),
    wordsPerMinute: computeWordsPerMinute(
      transcription.transcript,
      transcription.durationSeconds
    ),
  };
 
  return {
    transcription,
    acousticFeatures,
    acousticRiskSignal: computeAcousticRisk(acousticFeatures),
  };
}
