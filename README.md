# Python Alzheimer's Early Detection Tool

A Flask-based web application for early detection of Alzheimer's disease using story recall testing.

## Features

- **Story Recall Testing**: Scientifically-backed assessment method
- **AI-Powered Analysis**: Natural language processing to evaluate memory performance
- **Accessible Design**: Large text, simple navigation, keyboard shortcuts
- **Historical Tracking**: Dashboard to view past results and trends
- **Privacy-Focused**: Client-side storage, no external data transmission

## Installation

1. Install Python 3.8 or higher

2. Clone the repository or download the files

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Development Mode

```bash
python app.py
```

The application will be available at `http://localhost:5000`

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Project Structure

```
/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── utils/
│   ├── __init__.py
│   ├── analysis_engine.py  # AI analysis logic
│   └── story_data.py       # Story text and configuration
├── templates/              # HTML templates (Jinja2)
│   ├── base.html
│   ├── home.html
│   ├── patient_info.html
│   ├── instructions.html
│   ├── listen_story.html
│   ├── immediate_recall.html
│   ├── delayed_recall.html
│   ├── results.html
│   └── dashboard.html
└── static/                 # Static assets
    ├── css/
    │   └── main.css
    └── js/
        └── main.js
```

## How It Works

1. **Patient Information**: Collect basic demographics
2. **Instructions**: Explain the assessment process
3. **Listen to Story**: Present a short narrative
4. **Immediate Recall**: Participant says what they remember
5. **3-Minute Delay**: Waiting period
6. **Delayed Recall**: Participant recalls the story again
7. **AI Analysis**: System analyzes both responses
8. **Results**: Comprehensive report with recommendations

## Analysis Methodology

The AI uses multiple metrics:

- **Key Point Recall (40%)**: Tracks 14 specific story elements
- **Semantic Similarity (30%)**: Levenshtein distance algorithm
- **Coherence (30%)**: Sentence structure and narrative flow
- **Recall Decay**: Difference between immediate and delayed scores
- **Voice Analysis (Biomarkers)** - Analyzes the voice of the patient to determine the risk of Alzheimer's (unimplemented) 

Risk levels are categorized as:
- **Low**: Normal age-related memory
- **Moderate**: May warrant monitoring
- **High**: Recommend professional evaluation

## Security & Privacy

- Session-based data storage
- No external API calls for core functionality
- In-memory storage (use database for production)
- HTTPS recommended for deployment

## Important Disclaimer

This tool is for **screening purposes only** and does not replace professional medical diagnosis. 

## Future Enhancements

- PostgreSQL database integration
- Advanced ML models (BERT, transformers)
- Multi-language support
- PDF report generation
- Healthcare provider dashboard
- Integration with EHR systems

## License

Educational/Research Use Only

## Support

For issues or questions, please refer to the documentation or contact support.
