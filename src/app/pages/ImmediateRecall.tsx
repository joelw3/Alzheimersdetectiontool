
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Mic, ArrowRight, PlayCircle, StopCircle, Loader } from "lucide-react";
import {
  createAudioRecorder,
  transcribeAndAnalyze,
  type AudioRecorderController,
} from "../utils/speechPipeline";

export function ImmediateRecall() {
  const navigate = useNavigate();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [vuLevel, setVuLevel] = useState(0); // 0–1 for VU meter

  const recorderRef = useRef<AudioRecorderController | null>(null);
  const vuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      recorderRef.current = createAudioRecorder();
      await recorderRef.current.start();
      setMicPermission(true);
      setIsRecording(true);

      // Poll VU level at 30 fps for the meter
      vuIntervalRef.current = setInterval(() => {
        setVuLevel(recorderRef.current?.getLevel() ?? 0);
      }, 33);
    } catch {
      setMicPermission(false);
      setUseTextInput(true);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;
    if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
    setVuLevel(0);
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      const audioBlob = await recorderRef.current.stop();
      const result = await transcribeAndAnalyze(audioBlob);

      // Save transcript for display / analysis engine
      setRecordedText(result.transcription.transcript);

      // Save acoustic features for Results page to merge into final analysis
      sessionStorage.setItem(
        "immediateAcoustics",
        JSON.stringify(result.acousticFeatures)
      );
    } catch (err) {
      console.error("Transcription failed:", err);
      // Fall back to text input if transcription errors
      setUseTextInput(true);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleContinue = () => {
    if (recordedText.trim()) {
      sessionStorage.setItem("immediateRecall", recordedText);
      navigate("/delayed-recall");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* ACCESSIBILITY: max-w-3xl + increased padding for comfortable reading */}
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <Mic className="w-12 h-12 text-green-600" aria-hidden="true" />
          </div>
          {/* ACCESSIBILITY: text-4xl = 36px — well above 18px minimum */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Immediate Recall
          </h1>
          {/* ACCESSIBILITY: text-xl = 20px body text */}
          <p className="text-xl text-gray-600">
            Tell us what you remember from the story
          </p>
        </div>

        {/* Instruction box */}
        <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl mb-8">
          <p className="text-xl text-blue-900 font-medium text-center leading-relaxed">
            Please retell the story you just heard in as much detail as you can
            remember. Do not worry about getting the exact wording — just recall
            what you can.
          </p>
        </div>

        {/* Mic denied — full blocking message, no fallback to text */}
        {micPermission === false && (
          <div
            className="bg-red-50 border-2 border-red-300 p-8 rounded-xl mb-6 text-center"
            role="alert"
            aria-live="assertive"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <MicOff className="w-9 h-9 text-red-600" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">
              Microphone Permission Required
            </h2>
            <p className="text-xl text-red-700 mb-6 leading-relaxed">
              This test requires your microphone to record your response.
              Please enable microphone access to continue — the assessment
              cannot be completed without it.
            </p>
            <div className="bg-white border border-red-200 rounded-xl p-5 text-left mb-6">
              <p className="text-lg font-semibold text-gray-800 mb-3">
                How to enable your microphone:
              </p>
              <ol className="space-y-2 text-lg text-gray-700 list-decimal list-inside">
                <li>Look for a camera or lock icon in your browser's address bar</li>
                <li>Click it and set Microphone to <strong>Allow</strong></li>
                <li>Refresh this page and try again</li>
              </ol>
            </div>
            <button
              onClick={() => {
                setMicPermission(null);
                startRecording();
              }}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800
                         text-white font-bold text-xl py-4 px-10
                         rounded-xl transition-all shadow-md min-h-[56px]"
              aria-label="Try enabling microphone again"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Recording controls — hidden entirely when mic is denied */}
        <div className="space-y-6 mb-8">
          {!useTextInput && micPermission !== false && (
            <div className="text-center">
              {/* ── RECORDING BUTTON ──────────────────────────────────────────
                  ACCESSIBILITY: 
                  - min-height 64px (py-5 = 20px × 2 + font = ~64px total)
                  - state changes BOTH color AND label text (not color alone)
                  - aria-label describes action + current state
              ────────────────────────────────────────────────────────────── */}
              {!isRecording && !isTranscribing ? (
                <button
                  onClick={startRecording}
                  aria-label="Start recording your story recall"
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800
                             text-white font-bold text-2xl py-5 px-14
                             rounded-xl flex items-center justify-center mx-auto
                             transition-all shadow-lg hover:shadow-xl min-h-[64px]"
                >
                  <PlayCircle className="mr-3 w-8 h-8" aria-hidden="true" />
                  Start Recording
                </button>
              ) : isTranscribing ? (
                <button
                  disabled
                  aria-label="Transcribing your recording, please wait"
                  className="bg-blue-500 text-white font-bold text-2xl py-5 px-14
                             rounded-xl flex items-center justify-center mx-auto
                             shadow-lg min-h-[64px] cursor-wait"
                >
                  <Loader className="mr-3 w-8 h-8 animate-spin" aria-hidden="true" />
                  Transcribing...
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  aria-label="Stop recording — currently recording"
                  className="bg-red-600 hover:bg-red-700 active:bg-red-800
                             text-white font-bold text-2xl py-5 px-14
                             rounded-xl flex items-center justify-center mx-auto
                             transition-all shadow-lg hover:shadow-xl min-h-[64px]"
                >
                  <StopCircle className="mr-3 w-8 h-8" aria-hidden="true" />
                  Stop Recording
                </button>
              )}

              {/* ── RECORDING STATUS (text + color + icon) ────────────────── */}
              {isRecording && (
                <div
                  className="mt-5 flex flex-col items-center gap-3"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-xl text-red-700 font-semibold">
                      Recording is active — speak now
                    </p>
                  </div>

                  {/* ── VU METER ── lets patient confirm microphone is working */}
                  <div
                    className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden"
                    aria-label={`Microphone level: ${Math.round(vuLevel * 100)}%`}
                    role="meter"
                    aria-valuenow={Math.round(vuLevel * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${Math.round(vuLevel * 100)}%`,
                        background:
                          vuLevel > 0.8
                            ? "#dc2626"   // red — clipping
                            : vuLevel > 0.4
                            ? "#16a34a"   // green — healthy level
                            : "#d97706",  // amber — too quiet
                      }}
                    />
                  </div>
                  <p className="text-lg text-gray-500">
                    Microphone level indicator — green means your voice is being
                    captured
                  </p>
                </div>
              )}

              {/* Text fallback link */}
              <button
                onClick={() => setUseTextInput(true)}
                className="mt-6 text-indigo-700 hover:text-indigo-900
                           font-medium text-xl underline min-h-[48px]"
              >
                Switch to typing instead
              </button>
            </div>
          )}

          {/* Transcript / text area */}
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
              /* ACCESSIBILITY: text-xl = 20px in textarea */
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl
                         focus:border-indigo-500 focus:outline-none min-h-[280px]
                         leading-relaxed"
              placeholder={
                useTextInput
                  ? "Type what you remember from the story..."
                  : "Your spoken words will appear here after recording stops..."
              }
              readOnly={!useTextInput && isRecording}
              aria-label="Story recall response"
            />
            <p className="mt-2 text-lg text-gray-500">
              Word count:{" "}
              {recordedText.split(/\s+/).filter(Boolean).length}
            </p>
          </div>
        </div>

        {/* Tips + Continue — hidden when mic is denied */}
        {micPermission !== false && (
          <>
            <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Tips for Recall
              </h3>
              <ul className="space-y-3 text-xl text-gray-700">
                {[
                  "Start from the beginning and tell events in order",
                  "Include names, places, and specific details",
                  "Do not worry if you cannot remember everything",
                  "Take your time and speak clearly",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span
                      className="mt-1 w-2.5 h-2.5 rounded-full bg-indigo-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Continue button — ACCESSIBILITY: min-h-[64px], text-2xl */}
            <button
              onClick={handleContinue}
              disabled={recordedText.trim().length < 10}
              className={`w-full font-bold text-2xl py-5 px-8 rounded-xl
                          flex items-center justify-center transition-all shadow-lg
                          min-h-[64px]
                          ${
                            recordedText.trim().length >= 10
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
              aria-disabled={recordedText.trim().length < 10}
            >
              Continue to Delay Period
              <ArrowRight className="ml-3 w-7 h-7" aria-hidden="true" />
            </button>

            {recordedText.trim().length < 10 && (
              <p
                className="text-center text-gray-500 mt-4 text-xl"
                role="status"
                aria-live="polite"
              >
                Please provide a response before continuing
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
