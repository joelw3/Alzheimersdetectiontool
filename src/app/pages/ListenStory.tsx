import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Volume2, VolumeX, ArrowRight, Loader } from "lucide-react";
import { STORY_TEXT } from "../utils/storyData";

export function ListenStory() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [progress, setProgress] = useState(0);

  // Text-to-speech functionality
  const speakStory = () => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(STORY_TEXT);
      utterance.rate = 0.85; // Slightly slower for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        setProgress(0);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCanProceed(true);
        setProgress(100);
      };

      // Simulate progress
      const duration = STORY_TEXT.length * 50; // Approximate duration
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 1;
        });
      }, duration / 100);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Volume2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Listen to the Story
          </h1>
          <p className="text-xl text-gray-600">
            Pay close attention to the details
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl mb-8">
          <p className="text-lg text-blue-900 font-medium mb-4 text-center">
            Click the button below to hear the story. Listen carefully - you'll
            be asked to recall it in a moment.
          </p>

          <div className="flex justify-center mb-6">
            {!isPlaying ? (
              <button
                onClick={speakStory}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl py-6 px-12 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                <Volume2 className="mr-3 w-8 h-8" />
                Play Story
              </button>
            ) : (
              <button
                onClick={stopSpeech}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl py-6 px-12 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                <VolumeX className="mr-3 w-8 h-8" />
                Stop
              </button>
            )}
          </div>

          {isPlaying && (
            <div className="flex items-center justify-center space-x-3">
              <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-lg text-indigo-700 font-medium">
                Playing story...
              </p>
            </div>
          )}

          {progress > 0 && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                {progress.toFixed(0)}% complete
              </p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold text-amber-900 mb-2">
            📝 What to Remember
          </h3>
          <ul className="space-y-2 text-lg text-amber-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Names of people and places</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Specific details and numbers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The sequence of events</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Colors, objects, and actions mentioned</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-lg text-gray-700 leading-relaxed italic">
            "You can replay the story as many times as you need. When you're
            ready, click 'Continue' to begin the immediate recall portion."
          </p>
        </div>

        <button
          onClick={() => navigate("/immediate-recall")}
          disabled={!canProceed}
          className={`w-full font-bold text-xl py-6 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg ${
            canProceed
              ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue to Recall
          <ArrowRight className="ml-3 w-7 h-7" />
        </button>

        {!canProceed && (
          <p className="text-center text-gray-500 mt-4 text-lg">
            Listen to the story at least once to continue
          </p>
        )}
      </div>
    </div>
  );
}
