import { Link } from "react-router";
import { Brain, ClipboardCheck, ArrowRight } from "lucide-react";
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
              Story Recall Assessment
            </p>
            <p className="text-lg text-gray-500">
              For individuals aged 65 and older
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
            <h2 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
              <ClipboardCheck className="w-6 h-6 mr-2" />
              About This Assessment
            </h2>
            <p className="text-lg text-blue-800 leading-relaxed mb-3">
              This tool uses a scientifically-backed story recall method to help
              identify early signs of cognitive decline. Early detection allows
              for timely intervention and better management of Alzheimer's
              disease.
            </p>
            <p className="text-lg text-blue-800 leading-relaxed">
              <strong>How it works:</strong> You'll listen to a short story, then
              repeat it immediately and again after a brief delay. Our AI analyzes
              your responses to identify potential concerns.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ⏱️ Time Required
              </h3>
              <p className="text-lg text-gray-700">
                Approximately 10-15 minutes
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎤 What You'll Need
              </h3>
              <p className="text-lg text-gray-700">
                A quiet environment and working microphone
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🔒 Privacy
              </h3>
              <p className="text-lg text-gray-700">
                Your responses are analyzed securely and confidentially
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-8">
            <p className="text-lg text-amber-900 font-medium">
              ⚠️ Important: This tool is not final say! Please have a doctor to analyze 
              the results as well to verify its accuracy. 
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
