
from flask import Flask, render_template, request, session, redirect, url_for, jsonify, Response
from datetime import datetime, timedelta
import json
import os
import io

from utils.analysis_engine import analyze_recall
from utils.story_data import STORY_TEXT, STORY_KEY_POINTS, DELAY_DURATION_SECONDS

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

# In-memory storage for demo purposes — replace with a database in production
test_results_storage = {}


# ─── Pages ────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    """Landing page with system information."""
    return render_template("home.html")


@app.route("/patient-info", methods=["GET", "POST"])
def patient_info():
    """Patient information collection page."""
    if request.method == "POST":
        session["patient_info"] = {
            "name":          request.form.get("name"),
            "age":           request.form.get("age"),
            "date_of_birth": request.form.get("date_of_birth", ""),
            "test_date":     request.form.get("test_date", datetime.now().strftime("%Y-%m-%d")),
        }
        return redirect(url_for("instructions"))
    return render_template("patient_info.html")


@app.route("/instructions")
def instructions():
    """Instructions page explaining the assessment."""
    return render_template("instructions.html")


@app.route("/listen")
def listen_story():
    """Story listening page with text-to-speech."""
    return render_template("listen_story.html", story_text=STORY_TEXT)


@app.route("/immediate-recall", methods=["GET", "POST"])
def immediate_recall():
    """Immediate recall page — record response right after the story."""
    if request.method == "POST":
        session["immediate_recall"] = request.form.get("recall_text", "")
        session["delay_start_time"] = datetime.now().isoformat()
        return redirect(url_for("delayed_recall"))
    return render_template("immediate_recall.html")


@app.route("/delayed-recall", methods=["GET", "POST"])
def delayed_recall():
    """Delayed recall page — distractor task then record again."""
    if request.method == "POST":
        session["delayed_recall"] = request.form.get("recall_text", "")
        return redirect(url_for("results"))

    if not session.get("delay_start_time"):
        return redirect(url_for("immediate_recall"))

    return render_template("delayed_recall.html", delay_duration=DELAY_DURATION_SECONDS)


@app.route("/results")
def results():
    """Results page with analysis and recommendations."""
    immediate = session.get("immediate_recall", "")
    delayed   = session.get("delayed_recall", "")
    patient   = session.get("patient_info", {})

    if not immediate or not delayed:
        return redirect(url_for("home"))

    analysis = analyze_recall(immediate, delayed)

    result_id = datetime.now().timestamp()
    test_results_storage[result_id] = {
        "id":               result_id,
        "date":             datetime.now().isoformat(),
        "patient_info":     patient,
        "immediate_recall": immediate,
        "delayed_recall":   delayed,
        "analysis":         analysis,
    }
    session["latest_result_id"] = result_id

    return render_template("results.html", analysis=analysis, patient_info=patient)


@app.route("/dashboard")
def dashboard():
    """Dashboard showing all past test results."""
    all_results = sorted(
        test_results_storage.values(),
        key=lambda x: x["date"],
        reverse=True,
    )

    averages = None
    if all_results:
        averages = {
            "avg_immediate": sum(r["analysis"]["immediate"]["score"] for r in all_results) / len(all_results),
            "avg_delayed":   sum(r["analysis"]["delayed"]["score"]   for r in all_results) / len(all_results),
            "avg_decay":     sum(r["analysis"]["comparison"]["recall_decay"] for r in all_results) / len(all_results),
        }

    return render_template("dashboard.html", results=all_results, averages=averages)


# ─── API ──────────────────────────────────────────────────────────────────────

@app.route("/api/speech-to-text", methods=["POST"])
def speech_to_text():
    """
    Transcribes an uploaded audio blob using OpenAI Whisper.

    Expects a multipart/form-data POST with an 'audio' file field.
    Set OPENAI_API_KEY in your environment before running.

    To use local Whisper instead (no API key required):
      pip install openai-whisper
      Add at startup: import whisper; whisper_model = whisper.load_model("base")
      Then replace the openai block below with:
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes); tmp_path = tmp.name
        result = whisper_model.transcribe(tmp_path, language="en")
        os.unlink(tmp_path)
        return jsonify({"transcript": result["text"], "duration": result.get("duration")})
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "OPENAI_API_KEY environment variable is not set"}), 500

    audio_bytes = request.files["audio"].read()

    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.webm", io.BytesIO(audio_bytes), "audio/webm"),
            language="en",
        )
        return jsonify({"transcript": transcript.text, "duration": None})
    except Exception as e:
        return jsonify({"error": f"Transcription failed: {str(e)}"}), 500


@app.route("/download-report/<float:result_id>")
def download_report(result_id):
    """Downloads a plain-text assessment report for a specific result."""
    result = test_results_storage.get(result_id)
    if not result:
        return "Result not found", 404

    p = result["patient_info"]
    a = result["analysis"]

    report = f"""
ALZHEIMER'S EARLY DETECTION ASSESSMENT REPORT
================================================

PARTICIPANT INFORMATION
-----------------------
Name:                {p.get('name', 'N/A')}
Age:                 {p.get('age', 'N/A')}
Date of Assessment:  {p.get('test_date', 'N/A')}

IMMEDIATE RECALL RESULTS
------------------------
Overall Score:       {a['immediate']['score']:.1f}%
Key Points Recalled: {a['immediate']['key_points_recalled']}/{a['immediate']['total_key_points']}
Semantic Similarity: {a['immediate']['semantic_similarity']:.1f}%
Coherence Score:     {a['immediate']['coherence_score']:.1f}%
Risk Level:          {a['immediate']['risk_level']}

DELAYED RECALL RESULTS
----------------------
Overall Score:       {a['delayed']['score']:.1f}%
Key Points Recalled: {a['delayed']['key_points_recalled']}/{a['delayed']['total_key_points']}
Semantic Similarity: {a['delayed']['semantic_similarity']:.1f}%
Coherence Score:     {a['delayed']['coherence_score']:.1f}%
Risk Level:          {a['delayed']['risk_level']}

COMPARATIVE ANALYSIS
--------------------
Recall Decay:        {a['comparison']['recall_decay']:.1f}%
Overall Concern:     {a['comparison']['concern_level']}

RECOMMENDATIONS
---------------
{chr(10).join(f"{i+1}. {rec}" for i, rec in enumerate(a['delayed']['recommendations']))}

================================================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

DISCLAIMER: This assessment is for screening purposes only and does not
constitute a medical diagnosis. Please consult with a qualified healthcare
professional for comprehensive evaluation and diagnosis.
"""

    return Response(
        report,
        mimetype="text/plain",
        headers={"Content-Disposition": f"attachment;filename=alzheimers_assessment_{result_id}.txt"},
    )


@app.route("/delete-result/<float:result_id>", methods=["POST"])
def delete_result(result_id):
    """Deletes a stored test result."""
    if result_id in test_results_storage:
        del test_results_storage[result_id]
        return jsonify({"success": True})
    return jsonify({"error": "Result not found"}), 404


@app.route("/clear-session")
def clear_session():
    """Clears the current session and returns to home."""
    session.clear()
    return redirect(url_for("home"))


# ─── Error handlers ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def server_error(e):
    return render_template("500.html"), 500


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs("templates", exist_ok=True)
    os.makedirs("static/css", exist_ok=True)
    os.makedirs("static/js", exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5000)