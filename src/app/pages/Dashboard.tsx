import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  Home,
  Calendar,
  User,
  BarChart3,
  Trash2,
} from "lucide-react";

interface TestResult {
  id: string;
  date: string;
  patientInfo: any;
  analysis: any;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const savedResults = JSON.parse(
      localStorage.getItem("testResults") || "[]"
    );
    // Sort by date, most recent first
    savedResults.sort(
      (a: TestResult, b: TestResult) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setResults(savedResults);
  }, []);

  const deleteResult = (id: string) => {
    if (confirm("Are you sure you want to delete this result?")) {
      const updatedResults = results.filter((r) => r.id !== id);
      setResults(updatedResults);
      localStorage.setItem("testResults", JSON.stringify(updatedResults));
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-100 text-green-800 border-green-300";
      case "Moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "High":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const calculateAverages = () => {
    if (results.length === 0) return null;

    const avgImmediate =
      results.reduce((sum, r) => sum + r.analysis.immediate.score, 0) /
      results.length;
    const avgDelayed =
      results.reduce((sum, r) => sum + r.analysis.delayed.score, 0) /
      results.length;
    const avgDecay =
      results.reduce((sum, r) => sum + r.analysis.comparison.recallDecay, 0) /
      results.length;

    return { avgImmediate, avgDelayed, avgDecay };
  };

  const averages = calculateAverages();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Assessment Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Historical test results and trends
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-3 px-6 rounded-xl flex items-center transition-all shadow-lg hover:shadow-xl"
            >
              <Home className="mr-2 w-6 h-6" />
              Home
            </button>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">
                No Results Yet
              </h2>
              <p className="text-lg text-gray-500 mb-6">
                Complete an assessment to see your results here
              </p>
              <button
                onClick={() => navigate("/patient-info")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Start New Assessment
              </button>
            </div>
          ) : (
            <>
              {/* Summary Statistics */}
              {averages && (
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Avg. Immediate Recall
                    </h3>
                    <div className="flex items-end">
                      <p className="text-4xl font-bold text-green-700">
                        {averages.avgImmediate.toFixed(1)}%
                      </p>
                      <TrendingUp className="w-8 h-8 text-green-600 ml-2 mb-1" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">
                      Avg. Delayed Recall
                    </h3>
                    <div className="flex items-end">
                      <p className="text-4xl font-bold text-orange-700">
                        {averages.avgDelayed.toFixed(1)}%
                      </p>
                      <BarChart3 className="w-8 h-8 text-orange-600 ml-2 mb-1" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      Avg. Recall Decay
                    </h3>
                    <div className="flex items-end">
                      <p className="text-4xl font-bold text-purple-700">
                        {averages.avgDecay.toFixed(1)}%
                      </p>
                      <TrendingDown className="w-8 h-8 text-purple-600 ml-2 mb-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Tests */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
                <p className="text-lg text-indigo-900">
                  <strong>Total Assessments Completed:</strong>{" "}
                  <span className="text-2xl font-bold">{results.length}</span>
                </p>
              </div>

              {/* Individual Results */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Individual Test Results
              </h2>
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div className="mb-4 lg:mb-0">
                        <div className="flex items-center text-gray-700 mb-2">
                          <User className="w-5 h-5 mr-2" />
                          <span className="font-semibold text-lg">
                            {result.patientInfo?.name || "Unknown"}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">
                            Age {result.patientInfo?.age || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-5 h-5 mr-2" />
                          <span>
                            {new Date(result.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div
                          className={`px-4 py-2 rounded-lg border-2 font-bold text-lg ${getRiskColor(result.analysis.comparison.concernLevel)}`}
                        >
                          {result.analysis.comparison.concernLevel} Risk
                        </div>
                        <button
                          onClick={() => deleteResult(result.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Delete result"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Immediate Score
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {result.analysis.immediate.score.toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${result.analysis.immediate.score}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Delayed Score
                        </p>
                        <p className="text-2xl font-bold text-orange-700">
                          {result.analysis.delayed.score.toFixed(1)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${result.analysis.delayed.score}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Recall Decay
                        </p>
                        <p className="text-2xl font-bold text-purple-700">
                          {result.analysis.comparison.recallDecay.toFixed(1)}%
                        </p>
                        <div className="flex items-center mt-2 text-purple-600">
                          <TrendingDown className="w-5 h-5 mr-1" />
                          <span className="text-sm font-medium">
                            Memory decline
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Key Points (Delayed)
                        </p>
                        <p className="text-2xl font-bold text-indigo-700">
                          {result.analysis.delayed.keyPointsRecalled}/
                          {result.analysis.delayed.totalKeyPoints}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {(
                            (result.analysis.delayed.keyPointsRecalled /
                              result.analysis.delayed.totalKeyPoints) *
                            100
                          ).toFixed(0)}
                          % recalled
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate("/patient-info")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Start New Assessment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
