import { Link } from "react-router";
import { Brain, ClipboardCheck, ArrowRight, ListChecks, Mic, Clock } from "lucide-react";
import { AIInfoPanel } from "../components/AIInfoPanel";
import { ScienceGuide } from "../components/ScienceGuide";

export function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <Brain className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Alzheimer's Early Detection Tool
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-2">
              Attention &amp; Memory Recall Assessment
            </p>
            <p className="text-lg text-gray-500">For individuals aged 65 and older</p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
            <h2 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
              <ClipboardCheck className="w-6 h-6 mr-2" />
              About This Assessment
            </h2>
            <p className="text-lg text-blue-800 leading-relaxed mb-3">
              This tool combines two validated cognitive screening methods to help identify
              early signs of cognitive decline. It is designed to be used alongside — not
              instead of — a clinical evaluation by a qualified healthcare professional.
            </p>
            <p className="text-lg text-blue-800 leading-relaxed">
              <strong>How it works:</strong> You will complete short attention tasks drawn
              from the Montreal Cognitive Assessment (MoCA), then listen to a story and
              recall it twice — once immediately and once after a short delay. Our AI
              analyses your responses across all tasks.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Expect</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">1</div>
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-bold text-gray-900">Attention Tasks (MoCA)</h3>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Trail Making (connect numbers &amp; letters in order) and Digit Span
                  (forward and backward number sequences). Worth <strong>3 points</strong>.
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Listen &amp; Recall</h3>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Listen to a short story, then retell it in your own words right away.
                  Scored on key details, similarity, and coherence.
                </p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">3</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Short Break</h3>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  A 3-minute delay with simple distractor questions. This prevents active
                  rehearsal, which is essential for the delayed recall to be clinically valid.
                </p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">4</div>
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900">Delayed Recall</h3>
                  </div>
                </div>
                <p className="text-base text-gray-700 leading-relaxed">
                  Retell the story again from memory. How much is retained after a delay
                  is a key early marker of Alzheimer's risk.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-indigo-900 mb-4">📊 Scoring Overview — out of 10</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="text-3xl font-bold text-violet-600">3</p>
                <p className="text-base font-semibold text-gray-800 mt-1">Attention</p>
                <p className="text-sm text-gray-500">Trail Making + Digit Span</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="text-3xl font-bold text-indigo-600">5</p>
                <p className="text-base font-semibold text-gray-800 mt-1">Memory Recall</p>
                <p className="text-sm text-gray-500">Key details retained across both phases</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-indigo-100">
                <p className="text-3xl font-bold text-green-600">2</p>
                <p className="text-base font-semibold text-gray-800 mt-1">Speech Quality</p>
                <p className="text-sm text-gray-500">Coherence + Fluency</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm text-center">
              <div className="bg-green-100 rounded-lg p-3 text-green-800 font-semibold">8–10 &nbsp;Normal range</div>
              <div className="bg-yellow-100 rounded-lg p-3 text-yellow-800 font-semibold">5–7 &nbsp;Warrants monitoring</div>
              <div className="bg-red-100 rounded-lg p-3 text-red-800 font-semibold">Below 5 &nbsp;Clinician follow-up</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⏱️ Time Required</h3>
              <p className="text-lg text-gray-700">Approximately 10–15 minutes</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🎤 What You'll Need</h3>
              <p className="text-lg text-gray-700">A quiet environment and working microphone</p>
            </div>
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔒 Privacy</h3>
              <p className="text-lg text-gray-700">Responses are analysed securely and confidentially</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-8">
            <p className="text-lg text-amber-900 font-medium">
              ⚠️ <strong>Important:</strong> This tool is a screening aid, not a medical diagnosis.
              Always have a qualified doctor review and verify the results.
            </p>
          </div>

          <Link
            to="/patient-info"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl py-6 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            Begin Assessment
            <ArrowRight className="ml-3 w-8 h-8" />
          </Link>

          <Link
            to="/dashboard"
            className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xl py-4 px-8 rounded-xl flex items-center justify-center transition-all"
          >
            View Past Results
          </Link>
        </div>

        <AIInfoPanel />
        <ScienceGuide />
      </div>
    </div>
  );
}