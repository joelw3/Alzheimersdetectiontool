
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Mic, ArrowRight, PlayCircle, StopCircle, Loader } from "lucide-react";
import { DELAY_DURATION_MS } from "../utils/storyData";
import {
  createAudioRecorder,
  transcribeAndAnalyze,
  type AudioRecorderController,
} from "../utils/speechPipeline";

// ─── Distractor task data ─────────────────────────────────────────────────────
// Simple categorization questions. Cognitively lightweight but enough to
// prevent active story rehearsal. Based on standard clinical delay protocols.
const DISTRACTOR_QUESTIONS = [
  { q: "Is a BANANA a fruit or a vegetable?", a: "Fruit", options: ["Fruit", "Vegetable"] },
  { q: "Is a CAR faster than a bicycle?",    a: "Yes",   options: ["Yes", "No"] },
  { q: "Does the sun rise in the EAST?",     a: "Yes",   options: ["Yes", "No"] },
  { q: "Is a WHALE a fish or a mammal?",     a: "Mammal", options: ["Fish", "Mammal"] },
  { q: "Is SUMMER warmer than WINTER?",      a: "Yes",   options: ["Yes", "No"] },
  { q: "Is a TOMATO a fruit or a vegetable?",a: "Fruit", options: ["Fruit", "Vegetable"] },
  { q: "Does a clock move clockwise?",       a: "Yes",   options: ["Yes", "No"] },
  { q: "Is the MOON closer than the SUN?",   a: "Yes",   options: ["Yes", "No"] },
];

export function DelayedRecall() {
  const navigate = useNavigate();

  // ── Delay / distractor state ────────────────────────────────────────────
  const totalSeconds = Math.floor(DELAY_DURATION_MS / 1000);
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [delayComplete, setDelayComplete]   = useState(false);
  const [questionIdx, setQuestionIdx]       = useState(0);
  const [feedback, setFeedback]             = useState<string | null>(null);
  const [correctCount, setCorrectCount]     = useState(0);

  // ── Recording state ─────────────────────────────────────────────────────
  const [isRecording, setIsRecording]       = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedText, setRecordedText]     = useState("");
  const [useTextInput, setUseTextInput]     = useState(false);
  const [vuLevel, setVuLevel]               = useState(0);

  const recorderRef   = useRef<AudioRecorderController | null>(null);
  const vuIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
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

  // ── Cleanup VU meter on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
    };
  }, []);

  // ── Distractor answer handler ───────────────────────────────────────────
  const handleAnswer = (chosen: string) => {
    const current = DISTRACTOR_QUESTIONS[questionIdx];
    if (chosen === current.a) {
      setFeedback("Correct!");
      setCorrectCount((c) => c + 1);
    } else {
      setFeedback(`Not quite — the answer is ${current.a}.`);
    }
    // Advance to next question after 800 ms
    setTimeout(() => {
      setFeedback(null);
      setQuestionIdx((i) => (i + 1) % DISTRACTOR_QUESTIONS.length);
    }, 800);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  // ── Recording helpers ───────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      recorderRef.current = createAudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      vuIntervalRef.current = setInterval(() => {
        setVuLevel(recorderRef.current?.getLevel() ?? 0);
      }, 33);
    } catch {
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
      const blob = await recorderRef.current.stop();
      const result = await transcribeAndAnalyze(blob);
      setRecordedText(result.transcription.transcript);
      sessionStorage.setItem(
        "delayedAcoustics",
        JSON.stringify(result.acousticFeatures)
      );
    } catch {
      setUseTextInput(true);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleContinue = () => {
    if (recordedText.trim()) {
      sessionStorage.setItem("delayedRecall", recordedText);
      navigate("/results");
    }
  };

  // ── DISTRACTOR / WAITING SCREEN ─────────────────────────────────────────
  if (!delayComplete) {
    const current = DISTRACTOR_QUESTIONS[questionIdx];
    const progressPct = Math.round(
      ((totalSeconds - timeRemaining) / totalSeconds) * 100
    );

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">

          {/* Header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Short Activity Break
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Answer a few easy questions while you wait
          </p>

          {/* Progress bar + timer */}
          <div className="mb-6">
            <div
              className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Delay period progress"
            >
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p
              className="text-2xl font-bold text-purple-700"
              aria-live="off"  /* avoid constant announcements */
            >
              {formatTime(timeRemaining)} remaining
            </p>
          </div>

          {/* Distractor question card */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 mb-6">
            <p className="text-2xl font-semibold text-gray-900 mb-8 leading-snug">
              {current.q}
            </p>

            {/* Answer buttons — ACCESSIBILITY: min-h-[64px], text-2xl */}
            <div className="flex gap-4 justify-center flex-wrap">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!feedback}
                  aria-label={`Answer: ${opt}`}
                  className="bg-white border-2 border-purple-300 hover:bg-purple-100
                             hover:border-purple-500 text-gray-900 font-bold text-2xl
                             px-10 py-4 rounded-xl transition-all min-h-[64px]
                             disabled:opacity-50"
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Feedback */}
            {feedback && (
              <p
                className={`mt-6 text-2xl font-bold ${
                  feedback === "Correct!" ? "text-green-700" : "text-orange-700"
                }`}
                role="alert"
              >
                {feedback}
              </p>
            )}
          </div>

          <p className="text-xl text-gray-500">
            Answered correctly: {correctCount} so far
          </p>

          <div
            className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-xl text-left"
            role="note"
          >
            <p className="text-lg text-amber-800 font-medium">
              Please stay on this page. The recall test will start automatically
              when the timer reaches zero.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── DELAYED RECALL RECORDING SCREEN ────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
            <Mic className="w-12 h-12 text-orange-600" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Delayed Recall
          </h1>
          <p className="text-xl text-gray-600">
            Now tell us what you remember from the story
          </p>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 p-6 rounded-xl mb-8">
          <p className="text-xl text-orange-900 font-medium text-center leading-relaxed">
            Please retell the story again, recalling as much as you can. It is
            normal to remember a little less than the first time — just do your
            best.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {!useTextInput && (
            <div className="text-center">
              {/* Recording button — ACCESSIBILITY: color + label both change */}
              {!isRecording && !isTranscribing ? (
                <button
                  onClick={startRecording}
                  aria-label="Start recording your story recall"
                  className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800
                             text-white font-bold text-2xl py-5 px-14 rounded-xl
                             flex items-center justify-center mx-auto
                             transition-all shadow-lg min-h-[64px]"
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
                             text-white font-bold text-2xl py-5 px-14 rounded-xl
                             flex items-center justify-center mx-auto
                             transition-all shadow-lg min-h-[64px]"
                >
                  <StopCircle className="mr-3 w-8 h-8" aria-hidden="true" />
                  Stop Recording
                </button>
              )}

              {/* Status text + VU meter */}
              {isRecording && (
                <div className="mt-5 flex flex-col items-center gap-3" role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-xl text-red-700 font-semibold">
                      Recording is active — speak now
                    </p>
                  </div>
                  <div
                    className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden"
                    role="meter"
                    aria-valuenow={Math.round(vuLevel * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Microphone level: ${Math.round(vuLevel * 100)}%`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-75"
                      style={{
                        width: `${Math.round(vuLevel * 100)}%`,
                        background: vuLevel > 0.8 ? "#dc2626" : vuLevel > 0.4 ? "#16a34a" : "#d97706",
                      }}
                    />
                  </div>
                  <p className="text-lg text-gray-500">
                    Microphone level — green means your voice is being captured
                  </p>
                </div>
              )}

              <button
                onClick={() => setUseTextInput(true)}
                className="mt-6 text-indigo-700 hover:text-indigo-900 font-medium text-xl underline min-h-[48px]"
              >
                Switch to typing instead
              </button>
            </div>
          )}

          {/* Transcript textarea */}
          <div>
            <label htmlFor="recall" className="block text-xl font-semibold text-gray-700 mb-3">
              {useTextInput ? "Type Your Response:" : "Your Response:"}
            </label>
            <textarea
              id="recall"
              value={recordedText}
              onChange={(e) => setRecordedText(e.target.value)}
              className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl
                         focus:border-indigo-500 focus:outline-none min-h-[280px] leading-relaxed"
              placeholder={
                useTextInput
                  ? "Type what you remember from the story..."
                  : "Your spoken words will appear here after recording stops..."
              }
              readOnly={!useTextInput && isRecording}
              aria-label="Story recall response"
            />
            <p className="mt-2 text-lg text-gray-500">
              Word count: {recordedText.split(/\s+/).filter(Boolean).length}
            </p>
          </div>
        </div>

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={recordedText.trim().length < 10}
          className={`w-full font-bold text-2xl py-5 px-8 rounded-xl
                      flex items-center justify-center transition-all shadow-lg min-h-[64px]
                      ${
                        recordedText.trim().length >= 10
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
          aria-disabled={recordedText.trim().length < 10}
        >
          View Results
          <ArrowRight className="ml-3 w-7 h-7" aria-hidden="true" />
        </button>

        {recordedText.trim().length < 10 && (
          <p className="text-center text-gray-500 mt-4 text-xl" role="status" aria-live="polite">
            Please provide a response before continuing
          </p>
        )}
      </div>
    </div>
  );
}
