# Python Flask Quick Reference

## 🚀 Getting Started (Copy & Paste)

### First Time Setup
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Generate secret key
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copy output and paste into .env file as SECRET_KEY
```

### Run Development Server
```bash
python app.py
```
Then open: http://localhost:5000

### Run Production Server
```bash
gunicorn -c gunicorn_config.py app:app
```

## 📂 Project Structure

```
/
├── app.py                    # ← START HERE (main application)
├── utils/
│   ├── analysis_engine.py    # AI logic
│   └── story_data.py         # Story & config
├── templates/                # HTML files
└── static/                   # CSS & JS
```

## 🔧 Common Commands

### Virtual Environment
```bash
# Create
python3 -m venv venv

# Activate
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows

# Deactivate
deactivate

# Delete
rm -rf venv                   # Mac/Linux
rmdir /s venv                 # Windows
```

### Dependencies
```bash
# Install all
pip install -r requirements.txt

# Install one
pip install flask

# Update requirements.txt
pip freeze > requirements.txt

# Show installed
pip list
```

### Running the App
```bash
# Development (with debug)
python app.py

# Production (basic)
gunicorn app:app

# Production (with config)
gunicorn -c gunicorn_config.py app:app

# Production (specify workers)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🛠️ Code Snippets

### Add New Route
```python
# In app.py
@app.route('/new-page')
def new_page():
    return render_template('new_page.html')
```

### Add Route with POST
```python
@app.route('/submit', methods=['GET', 'POST'])
def submit():
    if request.method == 'POST':
        data = request.form.get('field_name')
        # Process data
        return redirect(url_for('results'))
    return render_template('form.html')
```

### Session Management
```python
# Set session data
session['key'] = 'value'

# Get session data
value = session.get('key')
value = session.get('key', 'default')

# Delete session data
session.pop('key', None)

# Clear all session
session.clear()
```

### Render Template with Data
```python
@app.route('/page')
def page():
    data = {'name': 'John', 'age': 30}
    return render_template('page.html', **data)
```

### Redirect
```python
from flask import redirect, url_for

return redirect(url_for('home'))
return redirect('/home')
```

### JSON Response
```python
return jsonify({'status': 'success', 'data': data})
```

## 📝 Template Snippets (Jinja2)

### Extend Base Template
```html
{% extends "base.html" %}

{% block title %}Page Title{% endblock %}

{% block content %}
  <!-- Your content here -->
{% endblock %}
```

### Variables
```html
<p>Hello {{ name }}!</p>
<p>Age: {{ age }}</p>
```

### Conditionals
```html
{% if user_logged_in %}
  <p>Welcome back!</p>
{% else %}
  <p>Please log in</p>
{% endif %}
```

### Loops
```html
{% for item in items %}
  <li>{{ item.name }}</li>
{% endfor %}
```

### URL Generation
```html
<a href="{{ url_for('home') }}">Home</a>
<a href="{{ url_for('results', id=123) }}">Result</a>
```

### Forms
```html
<form method="POST" action="{{ url_for('submit') }}">
  <input type="text" name="field_name" required />
  <button type="submit">Submit</button>
</form>
```

## 🐛 Debugging

### Enable Debug Mode
```python
# In app.py
if __name__ == '__main__':
    app.run(debug=True)
```

### Print Debugging
```python
print(f"Value: {variable}")
app.logger.info(f"Info: {data}")
app.logger.error(f"Error: {error}")
```

### Check Session Contents
```python
print(f"Session: {dict(session)}")
```

### Test Route in Browser
```
http://localhost:5000/route-name
http://localhost:5000/route-name?param=value
```

## 🔒 Environment Variables

### .env File
```bash
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost/db
```

### Access in Code
```python
import os
from dotenv import load_dotenv

load_dotenv()

secret = os.environ.get('SECRET_KEY')
debug = os.environ.get('FLASK_DEBUG', 'False') == 'True'
```

## 📦 Install Common Packages

```bash
# Database
pip install Flask-SQLAlchemy psycopg2-binary

# Forms & CSRF
pip install Flask-WTF

# User authentication
pip install Flask-Login

# Caching
pip install Flask-Caching redis

# Email
pip install Flask-Mail

# ML/AI
pip install scikit-learn transformers torch

# PDF generation
pip install reportlab

# Charts
pip install matplotlib plotly
```

## 🧪 Testing

### Basic Test Structure
```python
# test_app.py
import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Alzheimer' in response.data

def test_post(client):
    response = client.post('/submit', data={
        'field': 'value'
    })
    assert response.status_code == 302  # Redirect
```

### Run Tests
```bash
# Install pytest
pip install pytest

# Run tests
pytest

# Run with output
pytest -v

# Run specific test
pytest test_app.py::test_home
```

## 🚀 Deployment Checklist

- [ ] Set strong SECRET_KEY in production
- [ ] Set FLASK_ENV=production
- [ ] Disable debug mode
- [ ] Use production database (not in-memory)
- [ ] Enable HTTPS
- [ ] Set up error logging
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Update dependencies regularly

## 📊 Useful Flask Commands

```python
# Get current app
from flask import current_app

# Get request data
request.method
request.form.get('field')
request.args.get('param')
request.json
request.files['file']

# Response types
return render_template('page.html')
return jsonify({'key': 'value'})
return redirect(url_for('route'))
return 'Plain text', 200
return Response('data', mimetype='text/csv')
```

## 🆘 Common Errors & Solutions

### Error: "ModuleNotFoundError: No module named 'flask'"
**Solution**: Install Flask: `pip install flask`

### Error: "Template not found"
**Solution**: Check template name and ensure it's in `/templates` folder

### Error: "Working outside of application context"
**Solution**: Use `with app.app_context():` or `@app.route`

### Error: "Secret key not set"
**Solution**: Set `app.secret_key = 'your-key'` or use environment variable

### Error: "Port already in use"
**Solution**: Kill process: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)

## 📚 Documentation Links

- Flask Docs: https://flask.palletsprojects.com/
- Jinja2 Docs: https://jinja.palletsprojects.com/
- Python Docs: https://docs.python.org/3/

## 💡 Tips

1. Always use virtual environment
2. Keep requirements.txt updated
3. Never commit .env to git (add to .gitignore)
4. Use meaningful route names
5. Add error handling to all routes
6. Log important events
7. Validate user input
8. Use blueprints for large apps
9. Cache expensive operations
10. Test before deploying

---

**Need more help?** See `PYTHON_GUIDE.md` for complete documentation.
