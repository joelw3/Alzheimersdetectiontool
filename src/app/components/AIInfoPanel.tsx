import { Brain, Sparkles, Database, TrendingUp } from "lucide-react";

export function AIInfoPanel() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 my-8">
      <div className="flex items-center mb-6">
        <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mr-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          AI-Powered Analysis
        </h2>
      </div>

      <p className="text-lg text-gray-700 mb-6 leading-relaxed">
        This is an assessment that can be used by doctors that advanced artificial intelligence to analyze speech
        patterns and memory recall, identifying early indicators of cognitive decline.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              Natural Language Processing
            </h3>
          </div>
          <p className="text-gray-700">
            Analyzes semantic similarity, coherence, and key detail retention
            using advanced text comparison algorithms.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <Database className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              Pattern Recognition
            </h3>
          </div>
          <p className="text-gray-700">
            Identifies patterns in memory decay between immediate and delayed
            recall, key indicators of Alzheimer's disease.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              Scoring Algorithm
            </h3>
          </div>
          <p className="text-gray-700">
            Multi-factor scoring combines key point retention (40%), semantic
            similarity (30%), and coherence (30%) for comprehensive assessment.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">
              Risk Stratification
            </h3>
          </div>
          <p className="text-gray-700">
            Automatically categorizes results into Low, Moderate, or High risk
            levels based on validated cognitive assessment criteria.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-purple-100 border border-purple-300 rounded-lg p-4">
        <p className="text-purple-900 font-medium">
          <strong>ML Enhancement :</strong> This system would be much more reliable/would be
          enhanced with machine learning models trained on clinical
          datasets to improve the accuracy and predictive power. Custom neural networks
          trained on Alzheimer's speech data could be used.
        </p>
      </div>
    </div>
  );
}
