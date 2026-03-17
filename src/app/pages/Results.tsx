import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Brain,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Home,
  Download,
  BarChart3,
} from "lucide-react";
import { analyzeRecall } from "../utils/analysisEngine";
import { ComparisonChart } from "../components/ComparisonChart";

export function Results() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);

  useEffect(() => {
    const immediateRecall = sessionStorage.getItem("immediateRecall");
    const delayedRecall = sessionStorage.getItem("delayedRecall");
    const info = sessionStorage.getItem("patientInfo");

    if (!immediateRecall || !delayedRecall) {
      navigate("/");
      return;
    }

    if (info) {
      setPatientInfo(JSON.parse(info));
    }

    const results = analyzeRecall(immediateRecall, delayedRecall);
    setAnalysis(results);

    // Save to localStorage for dashboard
    const savedResults = JSON.parse(
      localStorage.getItem("testResults") || "[]"
    );
    savedResults.push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      patientInfo: info ? JSON.parse(info) : null,
      immediateRecall,
      delayedRecall,
      analysis: results,
    });
    localStorage.setItem("testResults", JSON.stringify(savedResults));
  }, [navigate]);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">Analyzing results...</div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      case "Moderate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "Low":
        return <CheckCircle className="w-12 h-12" />;
      case "Moderate":
        return <AlertTriangle className="w-12 h-12" />;
      case "High":
        return <AlertCircle className="w-12 h-12" />;
      default:
        return null;
    }
  };

  const downloadReport = () => {
    const report = `
ALZHEIMER'S EARLY DETECTION ASSESSMENT REPORT
================================================

PARTICIPANT INFORMATION
-----------------------
Name: ${patientInfo?.name || "N/A"}
Age: ${patientInfo?.age || "N/A"}
Date of Assessment: ${patientInfo?.testDate || new Date().toLocaleDateString()}

IMMEDIATE RECALL RESULTS
------------------------
Overall Score: ${analysis.immediate.score.toFixed(1)}%
Key Points Recalled: ${analysis.immediate.keyPointsRecalled}/${analysis.immediate.totalKeyPoints}
Semantic Similarity: ${analysis.immediate.semanticSimilarity.toFixed(1)}%
Coherence Score: ${analysis.immediate.coherenceScore.toFixed(1)}%
Risk Level: ${analysis.immediate.riskLevel}

DELAYED RECALL RESULTS
----------------------
Overall Score: ${analysis.delayed.score.toFixed(1)}%
Key Points Recalled: ${analysis.delayed.keyPointsRecalled}/${analysis.delayed.totalKeyPoints}
Semantic Similarity: ${analysis.delayed.semanticSimilarity.toFixed(1)}%
Coherence Score: ${analysis.delayed.coherenceScore.toFixed(1)}%
Risk Level: ${analysis.delayed.riskLevel}

COMPARATIVE ANALYSIS
--------------------
Recall Decay: ${analysis.comparison.recallDecay.toFixed(1)}%
Overall Concern Level: ${analysis.comparison.concernLevel}

RECOMMENDATIONS
---------------
${analysis.delayed.recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}

================================================
Generated: ${new Date().toLocaleString()}

DISCLAIMER: This assessment is for screening purposes only and does not
constitute a medical diagnosis. Please consult with a qualified healthcare
professional for comprehensive evaluation and diagnosis.
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alzheimers-assessment-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <Brain className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Assessment Results
            </h1>
            {patientInfo && (
              <p className="text-xl text-gray-600">
                {patientInfo.name} • {patientInfo.testDate}
              </p>
            )}
          </div>

          {/* Overall Risk Assessment */}
          <div
            className={`border-2 rounded-xl p-8 mb-8 ${getRiskColor(analysis.comparison.concernLevel)}`}
          >
            <div className="flex items-center justify-center mb-4">
              {getRiskIcon(analysis.comparison.concernLevel)}
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">
              Overall Concern Level: {analysis.comparison.concernLevel}
            </h2>
            <div className="text-center text-lg font-medium">
              <p className="flex items-center justify-center">
                <TrendingDown className="w-6 h-6 mr-2" />
                Recall Decay: {analysis.comparison.recallDecay.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Visual Comparison Chart */}
          <div className="mb-8">
            <ComparisonChart
              immediateScore={analysis.immediate.score}
              delayedScore={analysis.delayed.score}
            />
          </div>

          {/* Detailed Results Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Immediate Recall */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-7 h-7 mr-2 text-green-600" />
                Immediate Recall
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-700">
                      Overall Score
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {analysis.immediate.score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${analysis.immediate.score}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Key Points</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.immediate.keyPointsRecalled}/
                    {analysis.immediate.totalKeyPoints}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Semantic Similarity
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.immediate.semanticSimilarity.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Coherence</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.immediate.coherenceScore.toFixed(1)}%
                  </p>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${getRiskColor(analysis.immediate.riskLevel)}`}
                >
                  <p className="text-sm font-medium mb-1">Risk Level</p>
                  <p className="text-2xl font-bold">
                    {analysis.immediate.riskLevel}
                  </p>
                </div>
              </div>
            </div>

            {/* Delayed Recall */}
            <div className="bg-gradient-to-br from-orange-50 to-purple-50 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-7 h-7 mr-2 text-orange-600" />
                Delayed Recall
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-700">
                      Overall Score
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      {analysis.delayed.score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-orange-600 h-3 rounded-full transition-all"
                      style={{ width: `${analysis.delayed.score}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Key Points</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.delayed.keyPointsRecalled}/
                    {analysis.delayed.totalKeyPoints}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Semantic Similarity
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.delayed.semanticSimilarity.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Coherence</p>
                  <p className="text-xl font-bold text-gray-900">
                    {analysis.delayed.coherenceScore.toFixed(1)}%
                  </p>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${getRiskColor(analysis.delayed.riskLevel)}`}
                >
                  <p className="text-sm font-medium mb-1">Risk Level</p>
                  <p className="text-2xl font-bold">
                    {analysis.delayed.riskLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Points Analysis */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 mb-3">
                ✓ Details Recalled (Delayed)
              </h3>
              <ul className="space-y-2">
                {analysis.delayed.detailsRecalled.map(
                  (detail: string, idx: number) => (
                    <li key={idx} className="text-green-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{detail}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-red-900 mb-3">
                ✗ Details Missed (Delayed)
              </h3>
              <ul className="space-y-2">
                {analysis.delayed.detailsMissed.map(
                  (detail: string, idx: number) => (
                    <li key={idx} className="text-red-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{detail}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-indigo-900 mb-4">
              📋 Recommendations
            </h3>
            <ul className="space-y-3">
              {analysis.delayed.recommendations.map(
                (rec: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-lg text-indigo-800 flex items-start"
                  >
                    <span className="font-bold mr-3">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-8">
            <p className="text-lg text-amber-900 font-medium">
              <strong>⚠️ Important Disclaimer:</strong> This assessment is a
              screening tool only and does not replace professional medical
              diagnosis. The results should be discussed with a qualified
              healthcare provider, neurologist, or geriatric specialist for
              comprehensive evaluation, proper diagnosis, and treatment planning.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all"
            >
              <Home className="mr-2 w-6 h-6" />
              Home
            </button>
            <button
              onClick={downloadReport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              <Download className="mr-2 w-6 h-6" />
              Download Report
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-4 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              <BarChart3 className="mr-2 w-6 h-6" />
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
