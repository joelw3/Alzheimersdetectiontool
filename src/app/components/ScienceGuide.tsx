import { BookOpen, Brain, TrendingDown, Users, ListChecks } from "lucide-react";

export function ScienceGuide() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 my-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
        The Science Behind This Assessment
      </h2>

      <div className="space-y-8">

        {/* MoCA section */}
        <div className="border-l-4 border-violet-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <ListChecks className="w-6 h-6 mr-2 text-violet-600" />
            Montreal Cognitive Assessment (MoCA) Tasks
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            The MoCA is a widely-used, validated 10-minute cognitive screening tool
            developed by Dr. Ziad Nasreddine. A full MoCA covers 30 points across
            eight cognitive domains. This assessment uses <strong>3 of those points</strong> —
            specifically the attention subtests — which can be reliably delivered
            digitally without a trained examiner present.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
              <p className="font-bold text-gray-900 mb-1">Alternating Trail Making (1 pt)</p>
              <p className="text-base text-gray-700">
                Tests executive function and cognitive flexibility — the ability to
                shift between two mental sets (numbers and letters). Impairment on
                this task is associated with frontal lobe dysfunction, an early feature
                of Alzheimer's disease.
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="font-bold text-gray-900 mb-1">Digit Span: Forward + Backward (2 pts)</p>
              <p className="text-base text-gray-700">
                Forward span measures short-term auditory attention. Backward span
                additionally recruits working memory — the ability to mentally
                manipulate information. Reduced backward span is an early and sensitive
                marker of cognitive decline.
              </p>
            </div>
          </div>
        </div>

        {/* Story recall section */}
        <div className="border-l-4 border-blue-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            Why Story Recall?
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            Story recall testing is one of the most effective methods for detecting
            early cognitive decline. The ability to encode, store, and retrieve narrative
            information engages multiple brain regions — including the hippocampus and
            temporal lobes — areas affected early in Alzheimer's disease.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Research shows that delayed recall performance (remembering information after
            a time delay) is particularly sensitive to early Alzheimer's pathology, often
            declining years before clinical diagnosis.
          </p>
        </div>

        {/* Memory decay section */}
        <div className="border-l-4 border-green-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <TrendingDown className="w-6 h-6 mr-2 text-green-600" />
            The Importance of Memory Decay
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            The <strong>recall decay score</strong> — the difference between immediate and
            delayed recall — is a critical indicator. In healthy ageing, some memory
            loss over time is normal. However, excessive decay (typically &gt;30%)
            suggests impaired memory consolidation, a hallmark sign of Alzheimer's disease.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            The AI analyses not just what you remember, but <em>how well</em> memories persist
            over the 3-minute delay, providing insight into the brain's consolidation ability.
          </p>
        </div>

        {/* Clinical validation */}
        <div className="border-l-4 border-purple-500 pl-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
            <Users className="w-6 h-6 mr-2 text-purple-600" />
            Clinical Validation
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-3">
            The methods used in this tool are derived from validated clinical instruments:
          </p>
          <ul className="space-y-2 text-lg text-gray-700 ml-4">
            {[
              ["MoCA (Montreal Cognitive Assessment)", "Trail making and digit span subtests"],
              ["Logical Memory subtest (Wechsler Memory Scale)", "Story recall immediate and delayed"],
              ["ADAS-Cog", "Alzheimer's Disease Assessment Scale — narrative recall"],
              ["DementiaBank / Pitt Corpus", "Speech-based biomarker distributions for the AI classifier"],
              ["Framingham Cognitive Study", "Population norms for words-per-minute and recall scores"],
            ].map(([name, desc]) => (
              <li key={name} className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-1 flex-shrink-0">•</span>
                <span><strong>{name}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Score meaning */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">📊 What the Scores Mean (out of 10)</h3>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start gap-3">
              <strong className="w-36 flex-shrink-0">Attention (3 pt):</strong>
              <span>Trail Making + Forward/Backward Digit Span from the MoCA. Tests executive function and working memory.</span>
            </div>
            <div className="flex items-start gap-3">
              <strong className="w-36 flex-shrink-0">Key Points (3 pt):</strong>
              <span>Measures explicit episodic memory — retention of specific story details (names, numbers, objects, actions).</span>
            </div>
            <div className="flex items-start gap-3">
              <strong className="w-36 flex-shrink-0">Similarity (2 pt):</strong>
              <span>Semantic similarity of your retelling to the original story, assessing the overall gist and meaning retained.</span>
            </div>
            <div className="flex items-start gap-3">
              <strong className="w-36 flex-shrink-0">Coherence (2 pt):</strong>
              <span>Evaluates speech structure, fluency, and completeness — early speech disruption is a measurable biomarker of Alzheimer's.</span>
            </div>
          </div>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm text-center">
            <div className="bg-green-100 rounded-lg p-3 text-green-800 font-semibold">8–10 &nbsp;Normal range</div>
            <div className="bg-yellow-100 rounded-lg p-3 text-yellow-800 font-semibold">5–7 &nbsp;Warrants monitoring</div>
            <div className="bg-red-100 rounded-lg p-3 text-red-800 font-semibold">Below 5 &nbsp;Clinician follow-up</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <p className="text-lg text-amber-900">
            <strong>Important Note:</strong> While this assessment uses validated cognitive
            testing methods, it is designed as a screening tool, not a diagnostic instrument.
            A comprehensive medical evaluation is necessary for accurate diagnosis.
            Scores should always be reviewed by a qualified healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}