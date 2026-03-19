import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Brain, TrendingDown, CheckCircle, AlertTriangle, AlertCircle,
  Home, Download, BarChart3, Activity,
} from "lucide-react";
import { analyzeRecall } from "../utils/analysisEngine";
import type { ClassificationOutput } from "../utils/analysisEngine";
import { ComparisonChart } from "../components/ComparisonChart";

interface MocaPreSurvey {
  trailMaking:   { score: 0 | 1; path: string[]; errors: number };
  forwardDigit:  { score: 0 | 1; response: string; correct: string };
  backwardDigit: { score: 0 | 1; response: string; correct: string };
  totalScore:    number;
  completedAt:   string;
}

export function Results() {
  const navigate = useNavigate();
  const [analysis, setAnalysis]               = useState<any>(null);
  const [patientInfo, setPatientInfo]         = useState<any>(null);
  const [classification, setClassification]   = useState<ClassificationOutput | null>(null);
  const [mocaSurvey, setMocaSurvey]           = useState<MocaPreSurvey | null>(null);

  useEffect(() => {
    const immediateRecall = sessionStorage.getItem("immediateRecall");
    const delayedRecall   = sessionStorage.getItem("delayedRecall");
    const info            = sessionStorage.getItem("patientInfo");
    const mocaRaw         = sessionStorage.getItem("mocaPreSurvey");

    if (!immediateRecall || !delayedRecall) { navigate("/"); return; }
    if (info)     setPatientInfo(JSON.parse(info));
    if (mocaRaw)  setMocaSurvey(JSON.parse(mocaRaw));

    const run = async () => {
      const results = await analyzeRecall(immediateRecall, delayedRecall);
      setAnalysis(results);
      setClassification(results.classification);

      const saved = JSON.parse(localStorage.getItem("testResults") || "[]");
      saved.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        patientInfo: info ? JSON.parse(info) : null,
        immediateRecall,
        delayedRecall,
        mocaPreSurvey: mocaRaw ? JSON.parse(mocaRaw) : null,
        analysis: results,
      });
      localStorage.setItem("testResults", JSON.stringify(saved));
    };
    run();
  }, [navigate]);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Analyzing results...</div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    if (risk === "Low")      return "text-green-600 bg-green-50 border-green-200";
    if (risk === "Moderate") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (risk === "High")     return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getRiskIcon = (risk: string) => {
    if (risk === "Low")      return <CheckCircle className="w-12 h-12" />;
    if (risk === "Moderate") return <AlertTriangle className="w-12 h-12" />;
    if (risk === "High")     return <AlertCircle className="w-12 h-12" />;
    return null;
  };

  const FEAT_LABELS: Record<string, string> = {
    pauseCount: "Pause Count", meanPauseDuration: "Mean Pause Duration",
    speechRate: "Speech Rate", lexicalDiversity: "Lexical Diversity",
    wordsPerMinute: "Words / Minute", immediateScore: "Immediate Score",
    delayedScore: "Delayed Score", recallDecay: "Recall Decay",
    keyPointsRecalled: "Key Points Recalled", semanticSimilarity: "Semantic Similarity",
    coherenceScore: "Coherence",
  };

  const downloadReport = () => {
    const mocaBlock = mocaSurvey ? `
MOCA PRE-SURVEY (Attention Tasks)
----------------------------------
Trail Making (Alternating):       ${mocaSurvey.trailMaking.score}/1${mocaSurvey.trailMaking.errors > 0 ? ` (${mocaSurvey.trailMaking.errors} error(s))` : " (no errors)"}
Forward Digit Span (2-1-8-5-4):   ${mocaSurvey.forwardDigit.score}/1  (response: ${mocaSurvey.forwardDigit.response || "—"})
Backward Digit Span (7-4-2→2-4-7):${mocaSurvey.backwardDigit.score}/1  (response: ${mocaSurvey.backwardDigit.response || "—"})
MoCA Attention Sub-score:         ${mocaSurvey.totalScore}/3
` : "";

    const classBlock = classification ? `
CLASSIFIER OUTPUT
-----------------
Method:      ${classification.source === "gnb-training-distributions"
  ? "Gaussian NB (training distributions)"
  : "Supabase XGBoost"}
Risk Level:  ${classification.riskLevel}
Confidence:  ${(classification.confidence * 100).toFixed(1)}%
Probability Low:      ${(classification.probabilities.Low * 100).toFixed(1)}%
Probability Moderate: ${(classification.probabilities.Moderate * 100).toFixed(1)}%
Probability High:     ${(classification.probabilities.High * 100).toFixed(1)}%
${classification.imputedFeatures.length > 0
  ? `Imputed features: ${classification.imputedFeatures.join(", ")}`
  : "All features measured from real audio"}
` : "";

    const report = `
ALZHEIMER'S EARLY DETECTION ASSESSMENT REPORT
================================================

PARTICIPANT INFORMATION
-----------------------
Name: ${patientInfo?.name || "N/A"}
Age:  ${patientInfo?.age  || "N/A"}
Date: ${patientInfo?.testDate || new Date().toLocaleDateString()}
${mocaBlock}
IMMEDIATE RECALL RESULTS
------------------------
Overall Score:       ${analysis.immediate.score.toFixed(1)}%
Key Points Recalled: ${analysis.immediate.keyPointsRecalled}/${analysis.immediate.totalKeyPoints}
Semantic Similarity: ${analysis.immediate.semanticSimilarity.toFixed(1)}%
Coherence Score:     ${analysis.immediate.coherenceScore.toFixed(1)}%
Risk Level:          ${analysis.immediate.riskLevel}

DELAYED RECALL RESULTS
----------------------
Overall Score:       ${analysis.delayed.score.toFixed(1)}%
Key Points Recalled: ${analysis.delayed.keyPointsRecalled}/${analysis.delayed.totalKeyPoints}
Semantic Similarity: ${analysis.delayed.semanticSimilarity.toFixed(1)}%
Coherence Score:     ${analysis.delayed.coherenceScore.toFixed(1)}%
Risk Level:          ${analysis.delayed.riskLevel}

COMPARATIVE ANALYSIS
--------------------
Recall Decay:          ${analysis.comparison.recallDecay.toFixed(1)}%
Overall Concern Level: ${analysis.comparison.concernLevel}
${classBlock}
RECOMMENDATIONS
---------------
${analysis.delayed.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}

================================================
Generated: ${new Date().toLocaleString()}

DISCLAIMER: This assessment is for screening purposes only and does not
constitute a medical diagnosis. Please consult a qualified healthcare
professional for comprehensive evaluation and diagnosis.
    `;
    const blob = new Blob([report], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `alzheimers-assessment-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const mocaScoreColor = (score: number, max: number) =>
    score === max ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-6">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <Brain className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Assessment Results</h1>
            {patientInfo && (
              <p className="text-xl text-gray-600">{patientInfo.name} • {patientInfo.testDate}</p>
            )}
          </div>

          {/* ── MoCA Pre-Survey Results ─────────────────────────────────── */}
          {mocaSurvey && (
            <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-violet-800 font-bold text-lg">M</div>
                <div>
                  <h3 className="text-xl font-bold text-violet-900">MoCA Attention Pre-Survey</h3>
                  <p className="text-sm text-violet-600">
                    Alternating Trail Making + Forward &amp; Backward Digit Span
                  </p>
                </div>
                <span className={`ml-auto text-2xl font-bold px-4 py-1 rounded-full ${
                  mocaSurvey.totalScore >= 3 ? "bg-green-100 text-green-700"
                  : mocaSurvey.totalScore >= 2 ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
                }`}>
                  {mocaSurvey.totalScore} / 3
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Trail Making */}
                <div className="bg-white border border-violet-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-violet-700 mb-1">Trail Making</p>
                  <p className="text-xs text-gray-500 mb-3">1 → A → 2 → B → 3 → C → 4 → D → 5 → E</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {mocaSurvey.trailMaking.errors === 0
                          ? "✓ No errors"
                          : `${mocaSurvey.trailMaking.errors} error(s)`}
                      </p>
                      {mocaSurvey.trailMaking.path.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 break-words">
                          Path: {mocaSurvey.trailMaking.path.join("→")}
                        </p>
                      )}
                    </div>
                    <span className={`text-xl font-bold px-3 py-1 rounded-full ${mocaScoreColor(mocaSurvey.trailMaking.score, 1)}`}>
                      {mocaSurvey.trailMaking.score}/1
                    </span>
                  </div>
                </div>

                {/* Forward Digit */}
                <div className="bg-white border border-violet-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-teal-700 mb-1">Forward Digit Span</p>
                  <p className="text-xs text-gray-500 mb-3">Sequence: 2-1-8-5-4</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Response: <strong>{mocaSurvey.forwardDigit.response || "—"}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Correct: {mocaSurvey.forwardDigit.correct}
                      </p>
                    </div>
                    <span className={`text-xl font-bold px-3 py-1 rounded-full ${mocaScoreColor(mocaSurvey.forwardDigit.score, 1)}`}>
                      {mocaSurvey.forwardDigit.score}/1
                    </span>
                  </div>
                </div>

                {/* Backward Digit */}
                <div className="bg-white border border-violet-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-purple-700 mb-1">Backward Digit Span</p>
                  <p className="text-xs text-gray-500 mb-3">Sequence: 7-4-2 (reverse → 2-4-7)</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Response: <strong>{mocaSurvey.backwardDigit.response || "—"}</strong>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Correct: {mocaSurvey.backwardDigit.correct}
                      </p>
                    </div>
                    <span className={`text-xl font-bold px-3 py-1 rounded-full ${mocaScoreColor(mocaSurvey.backwardDigit.score, 1)}`}>
                      {mocaSurvey.backwardDigit.score}/1
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-violet-700 mt-4 bg-violet-100 rounded-lg p-3">
                <strong>MoCA context:</strong> A full MoCA score of 26+ is considered normal (max 30).
                This sub-score covers 3 of those 30 points. These attention tasks assess working memory
                and executive sequencing — both early-sensitive markers for cognitive decline.
              </p>
            </div>
          )}

          {/* Overall Risk */}
          <div className={`border-2 rounded-xl p-8 mb-8 ${getRiskColor(analysis.comparison.concernLevel)}`}>
            <div className="flex items-center justify-center mb-4">
              {getRiskIcon(analysis.comparison.concernLevel)}
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">
              Overall Concern Level: {analysis.comparison.concernLevel}
            </h2>
            <p className="text-center text-lg font-medium flex items-center justify-center">
              <TrendingDown className="w-6 h-6 mr-2" />
              Recall Decay: {analysis.comparison.recallDecay.toFixed(1)}%
            </p>
          </div>

          {/* Classifier Panel */}
          {classification && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <Activity className="w-6 h-6 text-slate-600" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Risk Classifier Output</h3>
                  <p className="text-sm text-slate-500">
                    {classification.source === "gnb-training-distributions"
                      ? "Gaussian Naive Bayes — trained on clinical literature distributions (DementiaBank / Framingham / AA 2023)"
                      : "XGBoost — Supabase endpoint"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {(["Low", "Moderate", "High"] as const).map((level) => {
                  const pct = classification.probabilities[level] * 100;
                  const color = level === "Low" ? "bg-green-500" : level === "Moderate" ? "bg-yellow-500" : "bg-red-500";
                  const isWinner = classification.riskLevel === level;
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                        <span className={isWinner ? "font-bold" : ""}>{level} Risk {isWinner ? "✓" : ""}</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className={`h-4 rounded-full transition-all ${color} ${isWinner ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm text-slate-600 mb-5">
                Confidence: <strong>{(classification.confidence * 100).toFixed(1)}%</strong>
                {classification.imputedFeatures.length > 0 && (
                  <span className="ml-3 text-amber-700">
                    ⚠ Acoustic features imputed (server-side analysis pending): {classification.imputedFeatures.join(", ")}
                  </span>
                )}
              </p>

              <div>
                <h4 className="text-base font-semibold text-slate-800 mb-3">Feature Contributions</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(classification.featureContributions).map(([feat, info]) => {
                    const isImputed = classification.imputedFeatures.includes(feat);
                    const dirColor = info.direction === "risk" ? "text-red-600" : info.direction === "protective" ? "text-green-600" : "text-slate-500";
                    const dirLabel = info.direction === "risk" ? "↑ risk" : info.direction === "protective" ? "↓ risk" : "neutral";
                    return (
                      <div key={feat} className={`flex items-center justify-between bg-white border rounded-lg px-3 py-2 text-sm ${isImputed ? "border-amber-200 opacity-60" : "border-slate-200"}`}>
                        <span className="text-slate-700 font-medium">
                          {FEAT_LABELS[feat] ?? feat}
                          {isImputed && <span className="ml-1 text-amber-500 text-xs">(est.)</span>}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-slate-500">{typeof info.value === "number" ? info.value.toFixed(2) : info.value}</span>
                          <span className={`font-semibold ${dirColor}`}>{dirLabel}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="mb-8">
            <ComparisonChart immediateScore={analysis.immediate.score} delayedScore={analysis.delayed.score} />
          </div>

          {/* Detailed Results Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-7 h-7 mr-2 text-green-600" /> Immediate Recall
              </h3>
              <div className="space-y-4">
                {[
                  ["Overall Score",      `${analysis.immediate.score.toFixed(1)}%`],
                  ["Key Points",         `${analysis.immediate.keyPointsRecalled}/${analysis.immediate.totalKeyPoints}`],
                  ["Semantic Similarity",`${analysis.immediate.semanticSimilarity.toFixed(1)}%`],
                  ["Coherence",          `${analysis.immediate.coherenceScore.toFixed(1)}%`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white rounded-lg p-4 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">{label}</span>
                    <span className="text-2xl font-bold text-green-600">{val}</span>
                  </div>
                ))}
                <div className={`border-2 rounded-lg p-4 ${getRiskColor(analysis.immediate.riskLevel)}`}>
                  <p className="text-sm font-medium mb-1">Risk Level</p>
                  <p className="text-2xl font-bold">{analysis.immediate.riskLevel}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-7 h-7 mr-2 text-orange-600" /> Delayed Recall
              </h3>
              <div className="space-y-4">
                {[
                  ["Overall Score",      `${analysis.delayed.score.toFixed(1)}%`],
                  ["Key Points",         `${analysis.delayed.keyPointsRecalled}/${analysis.delayed.totalKeyPoints}`],
                  ["Semantic Similarity",`${analysis.delayed.semanticSimilarity.toFixed(1)}%`],
                  ["Coherence",          `${analysis.delayed.coherenceScore.toFixed(1)}%`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-white rounded-lg p-4 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">{label}</span>
                    <span className="text-2xl font-bold text-orange-600">{val}</span>
                  </div>
                ))}
                <div className={`border-2 rounded-lg p-4 ${getRiskColor(analysis.delayed.riskLevel)}`}>
                  <p className="text-sm font-medium mb-1">Risk Level</p>
                  <p className="text-2xl font-bold">{analysis.delayed.riskLevel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Points Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 mb-3">✓ Details Recalled (Delayed)</h3>
              {analysis.delayed.detailsRecalled.length === 0
                ? <p className="text-green-800 italic">None recalled</p>
                : <ul className="space-y-2">{analysis.delayed.detailsRecalled.map((d: string, i: number) => (
                    <li key={i} className="text-green-800 flex items-start"><span className="mr-2">•</span>{d}</li>
                  ))}</ul>}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-red-900 mb-3">✗ Details Missed (Delayed)</h3>
              {analysis.delayed.detailsMissed.length === 0
                ? <p className="text-red-800 italic">None missed</p>
                : <ul className="space-y-2">{analysis.delayed.detailsMissed.map((d: string, i: number) => (
                    <li key={i} className="text-red-800 flex items-start"><span className="mr-2">•</span>{d}</li>
                  ))}</ul>}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-indigo-900 mb-4">📋 Recommendations</h3>
            <ul className="space-y-3">
              {analysis.delayed.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-lg text-indigo-800 flex items-start">
                  <span className="font-bold mr-3">{idx + 1}.</span><span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8">
            <p className="text-lg text-amber-900 font-medium">
              <strong>⚠️ Important Disclaimer:</strong> This assessment is a screening tool only
              and does not replace professional medical diagnosis. Results should be discussed with
              a qualified healthcare provider, neurologist, or geriatric specialist.
            </p>
          </div>

          {/* Actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <button onClick={() => navigate("/")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all">
              <Home className="mr-2 w-6 h-6" /> Home
            </button>
            <button onClick={downloadReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg">
              <Download className="mr-2 w-6 h-6" /> Download Report
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg">
              <BarChart3 className="mr-2 w-6 h-6" /> View Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}