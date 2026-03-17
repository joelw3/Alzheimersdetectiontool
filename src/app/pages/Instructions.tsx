import { useNavigate } from "react-router";
import { BookOpen, Mic, Clock, ArrowRight, ArrowLeft } from "lucide-react";

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
          <p className="text-xl text-gray-600">
            Please read these instructions carefully
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Listen to a Story
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  You will hear a short story about a person's daily activities.
                  Listen carefully and try to remember as many details as you
                  can.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Immediate Recall
                  <Mic className="ml-2 w-6 h-6 text-green-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Right after listening, you'll be asked to retell the story in
                  your own words. Don't worry about being perfect - just recall
                  what you remember.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border-l-4 border-purple-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Short Break
                  <Clock className="ml-2 w-6 h-6 text-purple-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  There will be a 3-minute waiting period. Please stay on the
                  page and relax. You may think about anything except the story.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border-l-4 border-orange-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  Delayed Recall
                  <Mic className="ml-2 w-6 h-6 text-orange-600" />
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  After the break, you'll be asked to retell the story again
                  from memory. Try to recall as much as you can.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-indigo-900 mb-3">
            💡 Tips for Success
          </h3>
          <ul className="space-y-2 text-lg text-indigo-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Find a quiet place with no distractions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Make sure your microphone is working</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Speak clearly and at a comfortable pace</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Don't worry about minor mistakes - just do your best</span>
            </li>
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
            onClick={() => navigate("/listen")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            Start Assessment
            <ArrowRight className="ml-2 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
