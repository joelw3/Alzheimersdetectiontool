import { useNavigate } from "react-router";
import { BookOpen, Mic, Clock, ArrowRight, ArrowLeft, ListChecks, GitMerge, Hash } from "lucide-react";

export function Instructions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <BookOpen className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            How the Assessment Works
          </h1>
          <p className="text-xl text-gray-600">Please read these instructions carefully before starting</p>
        </div>

        {/* Step-by-step */}
        <div className="space-y-5 mb-8">

          {/* Step 0 — MoCA attention */}
          <div className="bg-gradient-to-r from-violet-50 to-violet-100 p-6 rounded-xl border-l-4 border-violet-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-violet-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ListChecks className="w-6 h-6 text-violet-600" />
                  Attention Tasks (MoCA Pre-Survey)
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Before the story, you will complete two short tasks from the Montreal
                  Cognitive Assessment (MoCA) that measure attention and working memory.
                  These are scored out of <strong>3 points</strong> total.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-violet-200">
                    <div className="flex items-center gap-2 mb-2">
                      <GitMerge className="w-5 h-5 text-violet-500" />
                      <p className="font-bold text-gray-900">Trail Making <span className="text-violet-600 font-normal text-sm ml-1">(1 pt)</span></p>
                    </div>
                    <p className="text-base text-gray-700">
                      Tap circles in alternating number-letter order: <strong>1 → A → 2 → B → 3 → C → 4 → D → 5 → E</strong>.
                      You earn the point only if you complete the sequence with no uncorrected errors.
                      If you tap the wrong circle, immediately tap the correct one to self-correct.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-violet-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-5 h-5 text-violet-500" />
                      <p className="font-bold text-gray-900">Digit Span <span className="text-teal-600 font-normal text-sm ml-1">(2 pts)</span></p>
                    </div>
                    <p className="text-base text-gray-700">
                      <strong>Forward:</strong> Five numbers flash one at a time — type them back in the same order. (1 pt)<br />
                      <strong>Backward:</strong> Three numbers flash — type them in <em>reverse</em> order. (1 pt)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1 — Listen */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Listen to a Story</h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  You will hear a short story about a person's daily activities.
                  Listen carefully and try to remember as many details as you can —
                  names, objects, actions, and the order of events.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 — Immediate recall */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Immediate Recall
                  <Mic className="ml-2 w-6 h-6 text-green-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Right after listening, you'll be asked to retell the story out loud in
                  your own words. Include as many details as you can — names, actions,
                  and what happened. Don't worry about word-for-word accuracy; just
                  recall what you remember.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 — Delay */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Short Break
                  <Clock className="ml-2 w-6 h-6 text-purple-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  There will be a 3-minute waiting period with some easy questions to
                  keep your mind active. <strong>Please stay on the page</strong> and do not
                  try to rehearse the story — this delay is essential for the test to
                  accurately measure your memory consolidation.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 — Delayed recall */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border-l-4 border-orange-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                5
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Delayed Recall
                  <Mic className="ml-2 w-6 h-6 text-orange-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  After the break, you'll be asked to retell the story one more time.
                  It is normal to remember a little less than the first time — just do
                  your best. The difference between your two recalls is one of the most
                  important signals the tool measures.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scoring explainer */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">📊 How You Are Scored (out of 10)</h3>
          <div className="space-y-3 text-lg text-indigo-800">
            <div className="flex items-start gap-3">
              <span className="inline-block w-28 font-bold flex-shrink-0">Attention:</span>
              <span>3 pts — Trail Making (1 pt) + Forward Digit Span (1 pt) + Backward Digit Span (1 pt)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-block w-28 font-bold flex-shrink-0">Key Points:</span>
              <span>Up to 3 pts — how many specific story details (names, objects, events) you recall in the delayed phase</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-block w-28 font-bold flex-shrink-0">Similarity:</span>
              <span>Up to 2 pts — how closely your retelling matches the overall meaning of the story</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-block w-28 font-bold flex-shrink-0">Coherence:</span>
              <span>Up to 2 pts — structure, fluency, and completeness of your spoken response</span>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-center">
            <div className="bg-green-100 rounded-lg p-3 text-green-800 font-semibold">8–10 &nbsp;Normal range</div>
            <div className="bg-yellow-100 rounded-lg p-3 text-yellow-800 font-semibold">5–7 &nbsp;Warrants monitoring</div>
            <div className="bg-red-100 rounded-lg p-3 text-red-800 font-semibold">Below 5 &nbsp;Clinician follow-up</div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-3">💡 Tips for Success</h3>
          <ul className="space-y-2 text-lg text-gray-700">
            {[
              "Find a quiet place with no distractions before you begin",
              "Make sure your microphone is working — you can test it on the recording screen",
              "Speak clearly and at a comfortable pace during recall",
              "On the trail task, tap carefully — self-correct immediately if you tap the wrong circle",
              "Do not rehearse the story during the 3-minute break",
              "Don't worry about minor mistakes — just do your best",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/patient-info")}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all"
          >
            <ArrowLeft className="mr-2 w-6 h-6" />
            Back
          </button>
          <button
            onClick={() => navigate("/pre-survey")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            Begin Pre-Assessment Tasks
            <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}