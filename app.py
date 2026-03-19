
//Alzheimer's Early Detection Tool 


from flask import Flask, render_template, request, session, redirect, url_for, jsonify
from datetime import datetime, timedelta
import json
import os
from werkzeug.security import generate_password_hash
from utils.analysis_engine import analyze_recall
from utils.story_data import STORY_TEXT, STORY_KEY_POINTS, DELAY_DURATION_SECONDS

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)

//In-memory storage for demo purposes (use database in production)
test_results_storage = {}


@app.route('/')
def home():
    """Home page - landing page with system information"""
    return render_template('home.html')


@app.route('/patient-info', methods=['GET', 'POST'])
def patient_info():
    """Patient information collection page"""
    if request.method == 'POST':
        //Store patient info in session
        session['patient_info'] = {
            'name': request.form.get('name'),
            'age': request.form.get('age'),
            'date_of_birth': request.form.get('date_of_birth', ''),
            'test_date': request.form.get('test_date', datetime.now().strftime('%Y-%m-%d'))
        }
        return redirect(url_for('instructions'))
    
    return render_template('patient_info.html')


@app.route('/instructions')
def instructions():
    """Instructions page explaining the assessment"""
    return render_template('instructions.html')


@app.route('/listen')
def listen_story():
    """Story listening page with text-to-speech"""
    return render_template('listen_story.html', story_text=STORY_TEXT)


@app.route('/immediate-recall', methods=['GET', 'POST'])
def immediate_recall():
    """Immediate recall page - record response right after story"""
    if request.method == 'POST':
        immediate_recall_text = request.form.get('recall_text', '')
        session['immediate_recall'] = immediate_recall_text
        session['delay_start_time'] = datetime.now().isoformat()
        return redirect(url_for('delayed_recall'))
    
    return render_template('immediate_recall.html')


@app.route('/delayed-recall', methods=['GET', 'POST'])
def delayed_recall():
    """Delayed recall page - 3 minute wait then record again"""
    if request.method == 'POST':
        delayed_recall_text = request.form.get('recall_text', '')
        session['delayed_recall'] = delayed_recall_text
        return redirect(url_for('results'))
    
    //Check if delay period has started
    delay_start = session.get('delay_start_time')
    if not delay_start:
        return redirect(url_for('immediate_recall'))
    
    return render_template(
        'delayed_recall.html',
        delay_duration=DELAY_DURATION_SECONDS
    )


@app.route('/results')
def results():
    """Results page with AI analysis and recommendations"""
    immediate_recall = session.get('immediate_recall', '')
    delayed_recall = session.get('delayed_recall', '')
    patient_info = session.get('patient_info', {})
    
    if not immediate_recall or not delayed_recall:
        return redirect(url_for('home'))
    
    #Perform AI analysis
    analysis = analyze_recall(immediate_recall, delayed_recall)
    
   
    result_id = datetime.now().timestamp()
    test_results_storage[result_id] = {
        'id': result_id,
        'date': datetime.now().isoformat(),
        'patient_info': patient_info,
        'immediate_recall': immediate_recall,
        'delayed_recall': delayed_recall,
        'analysis': analysis
    }
    
    
    session['latest_result_id'] = result_id
    
    return render_template(
        'results.html',
        analysis=analysis,
        patient_info=patient_info
    )


@app.route('/dashboard')
def dashboard():
    """Dashboard showing all past test results"""
    # Get all results sorted by date
    results = sorted(
        test_results_storage.values(),
        key=lambda x: x['date'],
        reverse=True
    )
    
    # Calculate averages if results exist
    averages = None
    if results:
        avg_immediate = sum(r['analysis']['immediate']['score'] for r in results) / len(results)
        avg_delayed = sum(r['analysis']['delayed']['score'] for r in results) / len(results)
        avg_decay = sum(r['analysis']['comparison']['recall_decay'] for r in results) / len(results)
        
        averages = {
            'avg_immediate': avg_immediate,
            'avg_delayed': avg_delayed,
            'avg_decay': avg_decay
        }
    
    return render_template(
        'dashboard.html',
        results=results,
        averages=averages
    )

@app.route('/api/speech-to-text', methods=['POST'])
  def speech_to_text():
      if 'audio' not in request.files:
          return jsonify({'error': 'No audio file'}), 400
      audio_file = request.files['audio']
      audio_bytes = audio_file.read()

      
      import openai
      client = openai.OpenAI(api_key=os.environ['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'])
      import io
      transcript = client.audio.transcriptions.create(
          model= "whisper-1",
          file=("audio.webm", io.BytesIO(audio_bytes), "audio/webm"),
          language= "en"
      )
      return jsonify({'transcript': transcript.text, 'duration': None})


@app.route('/download-report/<float:result_id>')
def download_report(result_id):
    """Download text report for a specific result"""
    result = test_results_storage.get(result_id)
    
    if not result:
        return "Result not found", 404
    
    patient_info = result['patient_info']
    analysis = result['analysis']
    
    report = f"""
ALZHEIMER'S EARLY DETECTION ASSESSMENT REPORT
================================================

PARTICIPANT INFORMATION
-----------------------
Name: {patient_info.get('name', 'N/A')}
Age: {patient_info.get('age', 'N/A')}
Date of Assessment: {patient_info.get('test_date', 'N/A')}

IMMEDIATE RECALL RESULTS
------------------------
Overall Score: {analysis['immediate']['score']:.1f}%
Key Points Recalled: {analysis['immediate']['key_points_recalled']}/{analysis['immediate']['total_key_points']}
Semantic Similarity: {analysis['immediate']['semantic_similarity']:.1f}%
Coherence Score: {analysis['immediate']['coherence_score']:.1f}%
Risk Level: {analysis['immediate']['risk_level']}

DELAYED RECALL RESULTS
----------------------
Overall Score: {analysis['delayed']['score']:.1f}%
Key Points Recalled: {analysis['delayed']['key_points_recalled']}/{analysis['delayed']['total_key_points']}
Semantic Similarity: {analysis['delayed']['semantic_similarity']:.1f}%
Coherence Score: {analysis['delayed']['coherence_score']:.1f}%
Risk Level: {analysis['delayed']['risk_level']}

COMPARATIVE ANALYSIS
--------------------
Recall Decay: {analysis['comparison']['recall_decay']:.1f}%
Overall Concern Level: {analysis['comparison']['concern_level']}

RECOMMENDATIONS
---------------
{chr(10).join(f"{i+1}. {rec}" for i, rec in enumerate(analysis['delayed']['recommendations']))}

================================================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

DISCLAIMER: This assessment is for screening purposes only and does not
constitute a medical diagnosis. Please consult with a qualified healthcare
professional for comprehensive evaluation and diagnosis.
"""
    
    from flask import Response
    return Response(
        report,
        mimetype='text/plain',
        headers={'Content-Disposition': f'attachment;filename=alzheimers_assessment_{result_id}.txt'}
    )


@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """API endpoint for speech-to-text conversion"""
    # This would integrate with a speech recognition service
    # For now, return placeholder
    return jsonify({'error': 'Speech recognition not implemented in server'}), 501


@app.route('/delete-result/<float:result_id>', methods=['POST'])
def delete_result(result_id):
    """Delete a test result"""
    if result_id in test_results_storage:
        del test_results_storage[result_id]
        return jsonify({'success': True})
    return jsonify({'error': 'Result not found'}), 404


@app.route('/clear-session')
def clear_session():
    """Clear current session and start over"""
    session.clear()
    return redirect(url_for('home'))


# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    # Run the application
    app.run(debug=True, host='0.0.0.0', port=5000)
