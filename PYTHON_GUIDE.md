# Python/Flask Version - Complete Project Documentation

## 🎯 Project Overview

This is a **Python/Flask** web application for early detection of Alzheimer's disease using story recall testing methodology. The application has been converted from a React/TypeScript single-page application to a server-rendered Python application.

## 📦 What's Included

### Core Application Files

1. **app.py** - Main Flask application with all routes
2. **utils/analysis_engine.py** - AI analysis logic (Levenshtein distance, key point extraction)
3. **utils/story_data.py** - Story text and configuration constants
4. **requirements.txt** - Python dependencies
5. **gunicorn_config.py** - Production server configuration

### Templates (Jinja2)

- `base.html` - Base template with styles and structure
- `home.html` - Landing page with information
- `patient_info.html` - Patient demographic form
- `instructions.html` - Assessment instructions
- `listen_story.html` - Story presentation
- `immediate_recall.html` - Immediate recall form
- `delayed_recall.html` - Delayed recall with countdown timer
- `results.html` - Comprehensive analysis results
- `dashboard.html` - Historical results tracking

### Static Files

- `static/css/main.css` - Additional CSS styles
- `static/js/main.js` - Client-side JavaScript for interactions

### Documentation

- `README.md` - Quick start guide
- `DEPLOYMENT.md` - Production deployment instructions
- `MIGRATION_GUIDE.md` - Detailed React→Python conversion notes
- `SYSTEM_OVERVIEW.md` - Original system documentation
- `setup.sh` / `setup.bat` - Automated setup scripts

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```batch
setup.bat
```

### Option 2: Manual Setup

1. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set environment variables:**
```bash
cp .env.example .env
# Edit .env and set SECRET_KEY
```

4. **Run application:**
```bash
python app.py
```

5. **Open browser:**
```
http://localhost:5000
```

## 🏗️ Architecture

### Request Flow

```
Browser Request
    ↓
Flask App (app.py)
    ↓
Route Handler (@app.route)
    ↓
Business Logic (if POST)
    ↓
Template Rendering (Jinja2)
    ↓
HTML Response
    ↓
Browser Display
```

### Data Flow

```
Patient Info Form
    ↓
Flask Session Storage
    ↓
Story Presentation
    ↓
Immediate Recall (stored in session)
    ↓
3-Minute Delay
    ↓
Delayed Recall (stored in session)
    ↓
AI Analysis (Python function)
    ↓
In-Memory Storage (dict)
    ↓
Results Display
```

## 🧪 Testing the Application

### Manual Testing Checklist

1. **Home Page** (`/`)
   - [ ] Page loads correctly
   - [ ] All buttons are visible
   - [ ] Links work properly

2. **Patient Information** (`/patient-info`)
   - [ ] Form validation works (age >= 65)
   - [ ] Submit redirects to instructions
   - [ ] Data stored in session

3. **Instructions** (`/instructions`)
   - [ ] All 4 steps displayed clearly
   - [ ] Navigation buttons work

4. **Story Listening** (`/listen`)
   - [ ] Story text is readable
   - [ ] Continue button works

5. **Immediate Recall** (`/immediate-recall`)
   - [ ] Textarea accepts input
   - [ ] Word count updates
   - [ ] Form submits successfully

6. **Delayed Recall** (`/delayed-recall`)
   - [ ] Timer counts down from 3:00
   - [ ] Form appears after timer ends
   - [ ] Second recall submits correctly

7. **Results** (`/results`)
   - [ ] Analysis displays correctly
   - [ ] Risk level is color-coded
   - [ ] Recommendations show
   - [ ] Download button works

8. **Dashboard** (`/dashboard`)
   - [ ] Past results display
   - [ ] Statistics calculate correctly
   - [ ] Individual results show details

### Automated Testing (Future)

```python
# test_app.py
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Alzheimer' in response.data

def test_patient_info_submission(client):
    response = client.post('/patient-info', data={
        'name': 'Test User',
        'age': '70',
        'test_date': '2024-01-01'
    }, follow_redirects=True)
    assert response.status_code == 200
```

## 🔒 Security Considerations

### Current Implementation

1. **Session Security**
   - Random secret key generation
   - HttpOnly cookies
   - SameSite cookie policy

2. **Input Validation**
   - Form validation in templates
   - Server-side validation needed (add in production)

3. **Data Storage**
   - In-memory storage (development only)
   - Use database for production

### Production Security Checklist

- [ ] Strong SECRET_KEY set in environment
- [ ] HTTPS enabled (SSL/TLS)
- [ ] CSRF protection enabled
- [ ] Input sanitization implemented
- [ ] Rate limiting configured
- [ ] SQL injection protection (if using database)
- [ ] XSS protection in templates
- [ ] Security headers set
- [ ] Regular dependency updates
- [ ] Error logging configured

## 📊 AI Analysis Details

### Algorithm Components

1. **Levenshtein Distance**
   - Calculates edit distance between strings
   - Measures similarity percentage
   - Weighted at 30% of total score

2. **Key Point Extraction**
   - Checks for 14 specific story elements
   - Partial matching on first word
   - Weighted at 40% of total score

3. **Coherence Scoring**
   - Evaluates sentence structure
   - Checks word count and length
   - Weighted at 30% of total score

4. **Risk Stratification**
   - **Immediate Recall**: ≥70% = Low, ≥50% = Moderate, <50% = High
   - **Delayed Recall**: ≥60% = Low, ≥40% = Moderate, <40% = High
   - **Overall Concern**: Based on decay rate and delayed score

### Example Calculation

```python
# Sample scores
key_points = 10 / 14  # 71.4%
similarity = 75%
coherence = 80%

# Total score calculation
score = (0.714 * 40) + (0.75 * 30) + (0.80 * 30)
      = 28.56 + 22.5 + 24
      = 75.06%  # Low Risk
```

## 🔧 Customization

### Changing the Story

Edit `utils/story_data.py`:

```python
STORY_TEXT = """Your new story here..."""

STORY_KEY_POINTS = [
    "point 1",
    "point 2",
    # ... add your key points
]
```

### Adjusting Delay Duration

In `utils/story_data.py`:

```python
DELAY_DURATION_SECONDS = 180  # Change to desired seconds
```

### Modifying Risk Thresholds

In `utils/analysis_engine.py`, function `get_risk_level()`:

```python
def get_risk_level(score: float, is_delayed: bool = False) -> str:
    if is_delayed:
        if score >= 60:  # Adjust these values
            return "Low"
        elif score >= 40:
            return "Moderate"
        else:
            return "High"
    # ...
```

### Adding Database Storage

1. Install Flask-SQLAlchemy:
```bash
pip install Flask-SQLAlchemy psycopg2-binary
```

2. Add to `app.py`:
```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/db'
db = SQLAlchemy(app)

class TestResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, nullable=False)
    patient_name = db.Column(db.String(100))
    immediate_recall = db.Column(db.Text)
    delayed_recall = db.Column(db.Text)
    analysis_json = db.Column(db.JSON)
```

## 📈 Future Enhancements

### Short-term (1-3 months)

1. **Database Integration**
   - PostgreSQL for persistent storage
   - User authentication
   - Healthcare provider accounts

2. **Enhanced Analysis**
   - Integrate sentence-transformers for better similarity
   - Add speech recognition server-side
   - Implement more sophisticated NLP

3. **Reports**
   - PDF generation with ReportLab
   - Email delivery
   - Chart generation with Matplotlib

### Medium-term (3-6 months)

1. **ML Models**
   - Train custom classification model
   - Integrate Hugging Face transformers
   - Add explainable AI features

2. **Multi-language Support**
   - Flask-Babel for i18n
   - Multiple story translations
   - Locale-specific analysis

3. **Mobile Support**
   - Responsive design improvements
   - Progressive Web App features
   - Touch-friendly interface

### Long-term (6-12 months)

1. **Clinical Features**
   - Integration with EHR systems
   - FHIR API support
   - Clinical dashboard for providers

2. **Advanced Analytics**
   - Longitudinal trend analysis
   - Cohort comparisons
   - Predictive modeling

3. **Regulatory Compliance**
   - HIPAA compliance features
   - Audit logging
   - Data encryption
   - Clinical validation studies

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues or questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with details

## 📄 License

Educational/Research Use Only

---

**Version**: 1.0.0 (Python)  
**Last Updated**: March 2024  
**Maintained by**: [Your Organization]
