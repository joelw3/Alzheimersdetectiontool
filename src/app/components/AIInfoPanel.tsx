import { Brain, Sparkles, Database, TrendingUp, ListChecks } from "lucide-react";

export function AIInfoPanel() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-8 my-8">
      <div className="flex items-center mb-6">
        <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center mr-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">AI-Powered Analysis</h2>
      </div>

      <p className="text-lg text-gray-700 mb-6 leading-relaxed">
        This assessment tool combines validated clinical screening methods with AI to
        analyse speech patterns, attention performance, and memory recall — identifying
        early indicators of cognitive decline. It is intended to support, not replace,
        clinical evaluation by a qualified professional.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <ListChecks className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">MoCA Attention Tasks</h3>
          </div>
          <p className="text-gray-700">
            Two subtests from the Montreal Cognitive Assessment (MoCA): Alternating
            Trail Making (executive sequencing) and Forward/Backward Digit Span
            (working memory). These 3 points are standardised, clinically validated
            measures used worldwide for cognitive screening.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Natural Language Processing</h3>
          </div>
          <p className="text-gray-700">
            Whisper AI transcribes the spoken recall responses. The transcript is then
            analysed for semantic similarity to the original story, key detail retention,
            lexical diversity (Type-Token Ratio), and speech coherence — all established
            speech biomarkers for cognitive decline.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <Database className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Risk Classifier</h3>
          </div>
          <p className="text-gray-700">
            A Gaussian Naive Bayes classifier — trained on distributions derived from
            the Alzheimer's Association 2023 data, DementiaBank speech corpus, and
            Framingham Cognitive Study norms — classifies the combined feature set into
            Low, Moderate, or High risk with probability scores. An XGBoost endpoint
            can override this if configured.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-bold text-gray-900">Scoring Algorithm</h3>
          </div>
          <p className="text-gray-700">
            The 10-point composite score combines MoCA attention (3 pts), story key-point
            retention (3 pts), semantic similarity to the original story (2 pts), and
            speech coherence/fluency (2 pts). Recall <em>decay</em> — the drop from
            immediate to delayed — is one of the strongest predictors of early
            Alzheimer's pathology.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-purple-100 border border-purple-300 rounded-lg p-4">
        <p className="text-purple-900 font-medium">
          <strong>About the 10-point scale:</strong> This assessment uses 3 of the 30 MoCA
          attention points plus a 7-point recall scoring system, for a combined total of 10.
          This is intentional — we only administer the tasks that can be reliably delivered
          digitally without a trained examiner present. Scores should always be interpreted
          in the context of a full clinical assessment.
        </p>
      </div>
    </div>
  );
}