import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mic, Clock, ArrowRight, PlayCircle, StopCircle } from "lucide-react";
import { DELAY_DURATION_MS } from "../utils/storyData";

export function DelayedRecall() {
  const navigate = useNavigate();
  const [delayComplete, setDelayComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DELAY_DURATION_MS / 1000);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDelayComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (delayComplete) {
      // Initialize speech recognition when delay is complete
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            }
          }

          setRecordedText((prev) => prev + finalTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setUseTextInput(true);
          }
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      } else {
        setUseTextInput(true);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [delayComplete]);

  const startRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setUseTextInput(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleContinue = () => {
    if (recordedText.trim()) {
      sessionStorage.setItem("delayedRecall", recordedText);
      navigate("/results");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!delayComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
            <Clock className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Brief Waiting Period
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Please wait while we prepare the next phase
          </p>

          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-12 rounded-2xl mb-8">
            <div className="text-8xl font-bold text-purple-600 mb-4">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-2xl text-purple-800 font-medium">
              Time Remaining
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-blue-900 mb-3">
              During This Time
            </h3>
            <ul className="space-y-2 text-lg text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Stay on this page</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Try to relax and clear your mind</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Do NOT try to rehearse or think about the story
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You'll be prompted when the time is up</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Mic className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Delayed Recall
          </h1>
          <p className="text-xl text-gray-600">
            Now tell us what you remember from the story
          </p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-xl mb-8">
          <p className="text-lg text-orange-900 font-medium text-center">
            Please retell the story again, recalling as much as you can. It's
            normal to remember less than the first time - just do your best.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {!useTextInput && (
            <div className="text-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-2xl py-6 px-12 rounded-xl flex items-center justify-center mx-auto transition-all shadow-lg hover:shadow-xl"
                >
                  <PlayCircle className="mr-3 w-8 h-8" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl py-6 px-12 rounded-xl flex items-center justify-center mx-auto transition-all shadow-lg hover:shadow-xl animate-pulse"
                >
                  <StopCircle className="mr-3 w-8 h-8" />
                  Stop Recording
                </button>
              )}

              {isRecording && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-lg text-gray-700 font-medium">
                    Recording in progress...
                  </p>
                </div>
              )}

              <button
                onClick={() => setUseTextInput(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-lg underline"
              >
                Or type your response instead
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="recall"
              className="block text-xl font-semibold text-gray-700 mb-3"
            >
              {useTextInput ? "Type Your Response:" : "Your Response:"}
            </label>
            <textarea
              id="recall"
              value={recordedText}
              onChange={(e) => setRecordedText(e.target.value)}
              className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none min-h-[300px]"
              placeholder={
                useTextInput
                  ? "Type what you remember from the story..."
                  : "Your spoken words will appear here..."
              }
              readOnly={!useTextInput && isRecording}
            />
            <p className="mt-2 text-sm text-gray-500">
              Word count: {recordedText.split(/\s+/).filter(Boolean).length}
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={recordedText.trim().length < 10}
          className={`w-full font-bold text-xl py-6 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg ${
            recordedText.trim().length >= 10
              ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          View Results
          <ArrowRight className="ml-3 w-7 h-7" />
        </button>

        {recordedText.trim().length < 10 && (
          <p className="text-center text-gray-500 mt-4 text-lg">
            Please provide a response to continue
          </p>
        )}
      </div>
    </div>
  );
}
