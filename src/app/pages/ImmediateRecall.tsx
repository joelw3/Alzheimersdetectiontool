import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mic, MicOff, ArrowRight, PlayCircle, StopCircle } from "lucide-react";

export function ImmediateRecall() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setRecordedText((prev) => {
          const newText = prev + finalTranscript;
          return newText;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setMicPermission(false);
          setUseTextInput(true);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      // Browser doesn't support speech recognition
      setUseTextInput(true);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);

      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setMicPermission(false);
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
      sessionStorage.setItem("immediateRecall", recordedText);
      navigate("/delayed-recall");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Mic className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Immediate Recall
          </h1>
          <p className="text-xl text-gray-600">
            Tell us what you remember from the story
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl mb-8">
          <p className="text-lg text-blue-900 font-medium text-center">
            Please retell the story you just heard in as much detail as you can
            remember. Don't worry about getting the wording perfectly - just
            recall what you can.
          </p>
        </div>

        {micPermission === false && (
          <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-6">
            <p className="text-lg text-amber-900 font-medium">
              ⚠️ Microphone access was denied. You can type your response instead. 
              However, voice biomarker analysis will not occur and accuracy of results 
              will suffer. 
            </p>
          </div>
        )}

        <div className="space-y-6 mb-8">
          {!useTextInput && (
            <div className="text-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-6 px-12 rounded-xl flex items-center justify-center mx-auto transition-all shadow-lg hover:shadow-xl"
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
                Or type your response instead - voice biomarker analysis will not occur and accuracy of results 
              will suffer. 
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

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            💡 Tips for Recall
          </h3>
          <ul className="space-y-2 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Start from the beginning and go chronologically</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Include names, numbers, and specific details</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Don't worry if you can't remember everything</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Take your time and speak clearly</span>
            </li>
          </ul>
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
          Continue to Delay Period
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
