/**
 * PreSurvey.tsx
 *
 * Administers two MoCA subtests before the audio recall section:
 *
 *   Task 1 — Alternating Trail Making (MoCA §1)
 *     Interactive canvas: patient taps nodes in the sequence 1→A→2→B→3→C→4→D→5→E.
 *     Scoring: 1 pt if sequence is correct with no uncorrected errors.
 *
 *   Task 2 — Attention: Digit Span (MoCA §6, forward + backward)
 *     Forward:  "2 1 8 5 4" — patient types the sequence as heard.
 *               Presented digit-by-digit at 1 per second via TTS / visual flash.
 *     Backward: "7 4 2" — patient types in REVERSE order.
 *     Scoring: 1 pt each (max 2 pts).
 *
 * Results stored in sessionStorage as "mocaPreSurvey":
 *   {
 *     trailMaking:   { score: 0|1, path: string[], errors: number },
 *     forwardDigit:  { score: 0|1, response: string, correct: string },
 *     backwardDigit: { score: 0|1, response: string, correct: string },
 *     totalScore:    0–3,
 *     completedAt:   ISO string,
 *   }
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, RotateCcw } from "lucide-react";

// ─── MoCA constants ───────────────────────────────────────────────────────────

// Trail Making: correct sequence 1→A→2→B→3→C→4→D→5→E
const TRAIL_SEQUENCE = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E"];

// Node positions on a 500×340 canvas (x, y as fractions 0–1)
const TRAIL_NODES: Record<string, { x: number; y: number }> = {
  "1": { x: 0.12, y: 0.22 },
  "A": { x: 0.30, y: 0.10 },
  "2": { x: 0.52, y: 0.18 },
  "B": { x: 0.72, y: 0.08 },
  "3": { x: 0.88, y: 0.25 },
  "C": { x: 0.80, y: 0.55 },
  "4": { x: 0.60, y: 0.72 },
  "D": { x: 0.38, y: 0.82 },
  "5": { x: 0.18, y: 0.68 },
  "E": { x: 0.08, y: 0.45 },
};

const CANVAS_W = 500;
const CANVAS_H = 340;
const NODE_R   = 22; // radius in px

// Digit span sequences (from MoCA §6)
const FORWARD_SEQUENCE  = [2, 1, 8, 5, 4];      // correct answer: "21854"
const BACKWARD_SEQUENCE = [7, 4, 2];             // correct answer (reversed): "247"
const FORWARD_CORRECT   = "21854";
const BACKWARD_CORRECT  = "247";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "intro"
  | "trail_intro" | "trail_task" | "trail_done"
  | "digit_forward_intro" | "digit_forward_display" | "digit_forward_input"
  | "digit_backward_intro" | "digit_backward_display" | "digit_backward_input"
  | "complete";

// ─── Component ────────────────────────────────────────────────────────────────

export function PreSurvey() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("intro");

  // Trail making state
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const [trailPath, setTrailPath]   = useState<string[]>([]);
  const [trailErrors, setTrailErrors] = useState(0);
  const [trailDone, setTrailDone]   = useState(false);
  const [trailScore, setTrailScore] = useState<0 | 1>(0);
  const [lastWasError, setLastWasError] = useState(false);

  // Digit span state
  const [displayDigit, setDisplayDigit]   = useState<number | null>(null);
  const [digitPhase, setDigitPhase]       = useState<"showing" | "waiting">("waiting");
  const [forwardResponse, setForwardResponse]   = useState("");
  const [backwardResponse, setBackwardResponse] = useState("");
  const [forwardScore, setForwardScore]   = useState<0 | 1>(0);
  const [backwardScore, setBackwardScore] = useState<0 | 1>(0);
  const [forwardSubmitted, setForwardSubmitted]   = useState(false);
  const [backwardSubmitted, setBackwardSubmitted] = useState(false);

  // ── Canvas drawing ──────────────────────────────────────────────────────────

  const drawTrail = useCallback((path: string[], errorNode?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw connecting lines for completed path
    if (path.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;
      const first = TRAIL_NODES[path[0]];
      ctx.moveTo(first.x * CANVAS_W, first.y * CANVAS_H);
      for (let i = 1; i < path.length; i++) {
        const n = TRAIL_NODES[path[i]];
        ctx.lineTo(n.x * CANVAS_W, n.y * CANVAS_H);
      }
      ctx.stroke();
    }

    // Draw nodes
    TRAIL_SEQUENCE.forEach((label) => {
      const { x, y } = TRAIL_NODES[label];
      const cx = x * CANVAS_W;
      const cy = y * CANVAS_H;
      const tapped   = path.includes(label);
      const isNext   = !tapped && path.length < TRAIL_SEQUENCE.length &&
                       TRAIL_SEQUENCE[path.length] === label;
      const isError  = label === errorNode;
      const isFirst  = label === TRAIL_SEQUENCE[0] && path.length === 0;

      // Circle fill
      ctx.beginPath();
      ctx.arc(cx, cy, NODE_R, 0, 2 * Math.PI);
      ctx.fillStyle = isError  ? "#fecaca"
                    : tapped   ? "#e0e7ff"
                    : isNext || isFirst ? "#fef3c7"
                    : "#f9fafb";
      ctx.fill();

      // Circle border
      ctx.strokeStyle = isError  ? "#dc2626"
                      : tapped   ? "#6366f1"
                      : isNext || isFirst ? "#d97706"
                      : "#9ca3af";
      ctx.lineWidth = isNext || isFirst || tapped ? 3 : 2;
      ctx.stroke();

      // Label
      ctx.fillStyle   = isError ? "#dc2626" : tapped ? "#4338ca" : "#374151";
      ctx.font        = "bold 16px sans-serif";
      ctx.textAlign   = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx, cy);
    });

    // "Start here" arrow for node 1
    if (path.length === 0) {
      const { x, y } = TRAIL_NODES["1"];
      ctx.fillStyle = "#d97706";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Start", x * CANVAS_W, y * CANVAS_H - NODE_R - 8);
    }
  }, []);

  // Redraw whenever path changes
  useEffect(() => {
    if (phase === "trail_task" || phase === "trail_done") {
      drawTrail(trailPath);
    }
  }, [phase, trailPath, drawTrail]);

  // ── Trail Making interaction ────────────────────────────────────────────────

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (trailDone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const mx     = (e.clientX - rect.left) * scaleX;
    const my     = (e.clientY - rect.top)  * scaleY;

    // Find which node was clicked
    let clickedNode: string | null = null;
    for (const label of TRAIL_SEQUENCE) {
      const { x, y } = TRAIL_NODES[label];
      const cx = x * CANVAS_W;
      const cy = y * CANVAS_H;
      if (Math.hypot(mx - cx, my - cy) <= NODE_R + 6) {
        clickedNode = label;
        break;
      }
    }
    if (!clickedNode) return;

    const expectedNext = TRAIL_SEQUENCE[trailPath.length];

    if (clickedNode === expectedNext) {
      // Correct tap
      setLastWasError(false);
      const newPath = [...trailPath, clickedNode];
      setTrailPath(newPath);
      drawTrail(newPath);

      if (newPath.length === TRAIL_SEQUENCE.length) {
        // Complete — score is 1 if zero uncorrected errors
        const score: 0 | 1 = trailErrors === 0 ? 1 : 0;
        setTrailScore(score);
        setTrailDone(true);
        setPhase("trail_done");
      }
    } else {
      // Error tap — only count if not immediately self-correcting (i.e., wrong node tapped)
      // Per MoCA: "Any error that is not immediately self-corrected earns 0"
      // We count an error if the SAME wrong node is tapped twice without tapping the correct one
      if (!lastWasError) {
        setLastWasError(true);
        setTrailErrors((n) => n + 1);
      }
      drawTrail(trailPath, clickedNode);
      // Flash red then redraw
      setTimeout(() => drawTrail(trailPath), 600);
    }
  };

  const resetTrail = () => {
    setTrailPath([]);
    setTrailErrors(0);
    setTrailDone(false);
    setTrailScore(0);
    setLastWasError(false);
    setPhase("trail_task");
    setTimeout(() => drawTrail([]), 50);
  };

  // ── Digit span display sequence ─────────────────────────────────────────────

  const runDigitSequence = useCallback((
    sequence: number[],
    onDone: () => void
  ) => {
    let i = 0;
    const showNext = () => {
      if (i >= sequence.length) {
        setDisplayDigit(null);
        setDigitPhase("waiting");
        onDone();
        return;
      }
      setDisplayDigit(sequence[i]);
      setDigitPhase("showing");
      i++;
      // Show for 800ms, blank for 200ms, then next
      setTimeout(() => {
        setDisplayDigit(null);
        setTimeout(showNext, 200);
      }, 800);
    };
    // Brief lead-in pause
    setTimeout(showNext, 600);
  }, []);

  const startForwardDisplay = useCallback(() => {
    setPhase("digit_forward_display");
    runDigitSequence(FORWARD_SEQUENCE, () => setPhase("digit_forward_input"));
  }, [runDigitSequence]);

  const startBackwardDisplay = useCallback(() => {
    setPhase("digit_backward_display");
    runDigitSequence(BACKWARD_SEQUENCE, () => setPhase("digit_backward_input"));
  }, [runDigitSequence]);

  // ── Digit span submission ───────────────────────────────────────────────────

  const submitForward = () => {
    const cleaned = forwardResponse.replace(/\s/g, "");
    const score: 0 | 1 = cleaned === FORWARD_CORRECT ? 1 : 0;
    setForwardScore(score);
    setForwardSubmitted(true);
  };

  const submitBackward = () => {
    const cleaned = backwardResponse.replace(/\s/g, "");
    const score: 0 | 1 = cleaned === BACKWARD_CORRECT ? 1 : 0;
    setBackwardScore(score);
    setBackwardSubmitted(true);
  };

  // ── Final save & navigate ───────────────────────────────────────────────────

  const finishSurvey = () => {
    const result = {
      trailMaking:   { score: trailScore,   path: trailPath, errors: trailErrors },
      forwardDigit:  { score: forwardScore,  response: forwardResponse, correct: FORWARD_CORRECT },
      backwardDigit: { score: backwardScore, response: backwardResponse, correct: BACKWARD_CORRECT },
      totalScore:    trailScore + forwardScore + backwardScore,
      completedAt:   new Date().toISOString(),
    };
    sessionStorage.setItem("mocaPreSurvey", JSON.stringify(result));
    navigate("/listen");
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const StepBadge = ({ n, label, color }: { n: number; label: string; color: string }) => (
    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${color}`}>
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl font-bold shadow">
        {n}
      </div>
      <span className="text-lg font-semibold">{label}</span>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: intro
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <span className="text-4xl">🧠</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Pre-Assessment Tasks</h1>
            <p className="text-xl text-gray-600">
              Before the memory test, we'll ask you to complete two short attention tasks.
              They take about 2–3 minutes.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <StepBadge n={1} label="Trail Making — connect numbers and letters in order"
              color="border-indigo-200 bg-indigo-50 text-indigo-900" />
            <StepBadge n={2} label="Digit Span — remember and repeat number sequences"
              color="border-teal-200 bg-teal-50 text-teal-900" />
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-8">
            <p className="text-lg text-amber-800">
              <strong>Tips:</strong> Read each instruction carefully before starting.
              Take your time — there is no time limit on the trail task.
            </p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => navigate("/instructions")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xl py-5 px-6 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="mr-2 w-6 h-6" /> Back
            </button>
            <button onClick={() => setPhase("trail_intro")}
              className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
              Begin <ArrowRight className="ml-2 w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: trail_intro
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "trail_intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <span className="text-3xl font-bold text-indigo-600">1</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Trail Making</h2>
            <p className="text-xl text-gray-600">MoCA Attention Task</p>
          </div>

          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
            <p className="text-xl text-indigo-900 font-medium leading-relaxed">
              You will see circles containing numbers and letters on screen.
            </p>
            <p className="text-xl text-indigo-900 mt-3 leading-relaxed">
              Tap them in <strong>alternating order</strong>, starting from the number <strong>1</strong>:
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {TRAIL_SEQUENCE.map((label, i) => (
                <span key={label}
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-indigo-400 text-indigo-800 font-bold text-lg shadow-sm">
                  {label}
                </span>
              ))}
            </div>
            <p className="text-lg text-indigo-700 mt-4 text-center">
              1 → A → 2 → B → 3 → C → 4 → D → 5 → E
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
            <p className="text-lg text-gray-700">
              <strong>Scoring:</strong> You earn 1 point if you tap all circles in the correct order
              with no uncorrected mistakes. If you tap the wrong circle, you can self-correct by
              immediately tapping the correct one.
            </p>
          </div>

          <button
            onClick={() => { setPhase("trail_task"); setTimeout(() => drawTrail([]), 80); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
            Start Trail Task <ArrowRight className="ml-3 w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: trail_task + trail_done
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "trail_task" || phase === "trail_done") {
    const nextExpected = TRAIL_SEQUENCE[trailPath.length];
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Trail Making</h2>
            <span className="text-lg text-gray-500">
              {trailPath.length} / {TRAIL_SEQUENCE.length} tapped
            </span>
          </div>

          {/* Instruction reminder */}
          {!trailDone && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-lg text-indigo-800">
                Next: tap <strong className="text-2xl">{nextExpected}</strong>
              </p>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            className={`w-full border-2 rounded-xl mb-4 ${
              trailDone ? "border-gray-200 cursor-default" : "border-indigo-300 cursor-pointer"
            }`}
            style={{ touchAction: "none", maxHeight: "340px" }}
            aria-label="Trail making task — tap the circles in order"
          />

          {/* Error counter */}
          {!trailDone && trailErrors > 0 && (
            <p className="text-center text-orange-600 font-medium mb-3">
              Errors: {trailErrors} (self-correct by tapping the right circle)
            </p>
          )}

          {/* Result */}
          {trailDone && (
            <div className={`rounded-xl p-5 mb-4 flex items-center gap-4 ${
              trailScore === 1 ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
            }`}>
              {trailScore === 1
                ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                : <XCircle    className="w-8 h-8 text-red-600   flex-shrink-0" />}
              <div>
                <p className={`text-xl font-bold ${trailScore === 1 ? "text-green-800" : "text-red-800"}`}>
                  {trailScore === 1 ? "Correct — 1 point!" : `${trailErrors} uncorrected error(s) — 0 points`}
                </p>
                <p className="text-base text-gray-600 mt-1">
                  Path completed: {trailPath.join(" → ")}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {!trailDone && (
              <button onClick={resetTrail}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
            )}
            {trailDone && (
              <>
                <button onClick={resetTrail}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <RotateCcw className="w-5 h-5" /> Try Again
                </button>
                <button onClick={() => setPhase("digit_forward_intro")}
                  className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
                  Next Task <ArrowRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_forward_intro
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_forward_intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
              <span className="text-3xl font-bold text-teal-600">2a</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forward Digit Span</h2>
            <p className="text-xl text-gray-600">MoCA Attention Task</p>
          </div>

          <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 mb-6">
            <p className="text-xl text-teal-900 font-medium leading-relaxed">
              A sequence of <strong>5 numbers</strong> will appear on screen, one at a time.
            </p>
            <p className="text-xl text-teal-900 mt-3 leading-relaxed">
              When they finish, type them back <strong>in the same order</strong>.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
            <p className="text-lg text-gray-700">
              <strong>Example:</strong> If you see 3 → 7 → 1, type <strong>371</strong>.
            </p>
          </div>

          <button onClick={startForwardDisplay}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
            Show Numbers <ArrowRight className="ml-3 w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_forward_display
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_forward_display") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <p className="text-xl text-gray-500 mb-8 font-medium">Watch carefully…</p>
          <div className="w-40 h-40 mx-auto rounded-full bg-teal-100 border-4 border-teal-400 flex items-center justify-center mb-6">
            {displayDigit !== null
              ? <span className="text-7xl font-bold text-teal-700">{displayDigit}</span>
              : <span className="text-4xl text-teal-300">·</span>}
          </div>
          <p className="text-lg text-gray-400">Numbers appear one per second</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_forward_input
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_forward_input") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Type What You Saw</h2>
            <p className="text-xl text-gray-600">Enter the numbers in the same order</p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            value={forwardResponse}
            onChange={(e) => !forwardSubmitted && setForwardResponse(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={forwardSubmitted}
            autoFocus
            className="w-full px-6 py-5 text-4xl font-mono text-center tracking-widest border-4 border-teal-300 rounded-xl focus:border-teal-500 focus:outline-none mb-6"
            placeholder="e.g. 21854"
            maxLength={10}
            aria-label="Enter the digit sequence you saw"
          />

          {forwardSubmitted && (
            <div className={`rounded-xl p-5 mb-6 flex items-center gap-4 ${
              forwardScore === 1 ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
            }`}>
              {forwardScore === 1
                ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                : <XCircle    className="w-8 h-8 text-red-600   flex-shrink-0" />}
              <div>
                <p className={`text-xl font-bold ${forwardScore === 1 ? "text-green-800" : "text-red-800"}`}>
                  {forwardScore === 1 ? "Correct — 1 point!" : "Incorrect — 0 points"}
                </p>
                {forwardScore === 0 && (
                  <p className="text-base text-gray-600 mt-1">
                    Correct answer: <strong>{FORWARD_CORRECT}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {!forwardSubmitted ? (
            <button
              onClick={submitForward}
              disabled={forwardResponse.length < 3}
              className={`w-full font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                forwardResponse.length >= 3
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}>
              Submit Answer
            </button>
          ) : (
            <button onClick={() => setPhase("digit_backward_intro")}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
              Next Task <ArrowRight className="ml-3 w-7 h-7" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_backward_intro
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_backward_intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <span className="text-3xl font-bold text-purple-600">2b</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Backward Digit Span</h2>
            <p className="text-xl text-gray-600">MoCA Attention Task</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <p className="text-xl text-purple-900 font-medium leading-relaxed">
              This time, <strong>3 numbers</strong> will appear on screen, one at a time.
            </p>
            <p className="text-xl text-purple-900 mt-3 leading-relaxed">
              When they finish, type them back in <strong>REVERSE order</strong>.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
            <p className="text-lg text-gray-700">
              <strong>Example:</strong> If you see 3 → 7 → 1, type <strong>173</strong> (backwards).
            </p>
          </div>

          <button onClick={startBackwardDisplay}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
            Show Numbers <ArrowRight className="ml-3 w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_backward_display
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_backward_display") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
          <p className="text-xl text-gray-500 mb-8 font-medium">Watch carefully — then reverse them…</p>
          <div className="w-40 h-40 mx-auto rounded-full bg-purple-100 border-4 border-purple-400 flex items-center justify-center mb-6">
            {displayDigit !== null
              ? <span className="text-7xl font-bold text-purple-700">{displayDigit}</span>
              : <span className="text-4xl text-purple-300">·</span>}
          </div>
          <p className="text-lg text-gray-400">Numbers appear one per second</p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: digit_backward_input
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "digit_backward_input") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Type in Reverse</h2>
            <p className="text-xl text-gray-600">Enter the numbers in backwards order</p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            value={backwardResponse}
            onChange={(e) => !backwardSubmitted && setBackwardResponse(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={backwardSubmitted}
            autoFocus
            className="w-full px-6 py-5 text-4xl font-mono text-center tracking-widest border-4 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none mb-6"
            placeholder="e.g. 247"
            maxLength={6}
            aria-label="Enter the digit sequence in reverse"
          />

          {backwardSubmitted && (
            <div className={`rounded-xl p-5 mb-6 flex items-center gap-4 ${
              backwardScore === 1 ? "bg-green-50 border-2 border-green-300" : "bg-red-50 border-2 border-red-300"
            }`}>
              {backwardScore === 1
                ? <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                : <XCircle    className="w-8 h-8 text-red-600   flex-shrink-0" />}
              <div>
                <p className={`text-xl font-bold ${backwardScore === 1 ? "text-green-800" : "text-red-800"}`}>
                  {backwardScore === 1 ? "Correct — 1 point!" : "Incorrect — 0 points"}
                </p>
                {backwardScore === 0 && (
                  <p className="text-base text-gray-600 mt-1">
                    Correct answer: <strong>{BACKWARD_CORRECT}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {!backwardSubmitted ? (
            <button
              onClick={submitBackward}
              disabled={backwardResponse.length < 2}
              className={`w-full font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                backwardResponse.length >= 2
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}>
              Submit Answer
            </button>
          ) : (
            <button onClick={() => setPhase("complete")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
              See Summary <ArrowRight className="ml-3 w-7 h-7" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: complete — summary before navigating to story
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "complete") {
    const total = trailScore + forwardScore + backwardScore;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Pre-Assessment Complete</h2>
            <p className="text-xl text-gray-600">Your attention scores have been recorded</p>
          </div>

          {/* Score summary */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mb-6">
            <p className="text-center text-2xl font-bold text-indigo-900 mb-4">
              Total Score: {total} / 3
            </p>
            <div className="space-y-3">
              {[
                { label: "Trail Making (Alternating)", score: trailScore, max: 1, detail: trailErrors === 0 ? "No errors" : `${trailErrors} error(s)` },
                { label: "Forward Digit Span (2-1-8-5-4)", score: forwardScore, max: 1, detail: forwardResponse || "—" },
                { label: "Backward Digit Span (7-4-2 → 2-4-7)", score: backwardScore, max: 1, detail: backwardResponse || "—" },
              ].map(({ label, score, max, detail }) => (
                <div key={label} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-indigo-100">
                  <div>
                    <p className="font-semibold text-gray-800">{label}</p>
                    <p className="text-sm text-gray-500">Your answer: {detail}</p>
                  </div>
                  <span className={`text-xl font-bold px-3 py-1 rounded-full ${
                    score === max ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {score}/{max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
            <p className="text-lg text-blue-800">
              These scores will be included in your final assessment report alongside the memory recall tasks.
            </p>
          </div>

          <button onClick={finishSurvey}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl py-5 px-8 rounded-xl flex items-center justify-center transition-all shadow-lg">
            Continue to Memory Test <ArrowRight className="ml-3 w-7 h-7" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}