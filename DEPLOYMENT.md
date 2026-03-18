# Python Deployment Guide

## Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run development server:
```bash
python app.py
```

## Production Deployment

### Using Gunicorn (Recommended)

1. Install production dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export SECRET_KEY="your-secret-key-here"
export FLASK_ENV="production"
```

3. Run with Gunicorn:
```bash
gunicorn -c gunicorn_config.py app:app
```

### Using Docker

1. Create Dockerfile:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "-c", "gunicorn_config.py", "app:app"]
```

2. Build and run:
```bash
docker build -t alzheimers-detection .
docker run -p 5000:5000 -e SECRET_KEY="your-key" alzheimers-detection
```

### Deploy to Heroku

1. Create `Procfile`:
```
web: gunicorn app:app
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
heroku config:set SECRET_KEY="your-secret-key"
```

### Deploy to AWS EC2

1. SSH into EC2 instance
2. Install Python and dependencies
3. Set up Nginx as reverse proxy
4. Use systemd for process management
5. Configure SSL with Let's Encrypt

### Deploy to Google Cloud Run

```bash
gcloud run deploy alzheimers-detection \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Environment Variables

Required for production:
- `SECRET_KEY`: Flask secret key for sessions
- `FLASK_ENV`: Set to "production"

Optional:
- `DATABASE_URL`: PostgreSQL connection string
- `SENTRY_DSN`: Error tracking
- `LOG_LEVEL`: Logging level

## Database Setup (Optional)

For persistent storage, integrate PostgreSQL:

```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
db = SQLAlchemy(app)
```

## Security Checklist

- [ ] Set strong SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Enable secure cookie flags
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Sanitize user inputs
- [ ] Regular security updates
- [ ] Implement logging and monitoring

## Performance Optimization

- Use Redis for session storage
- Enable gzip compression
- Implement caching for static assets
- Use CDN for static files
- Database connection pooling
- Async task queue for heavy processing

## Monitoring

Recommended tools:
- Sentry for error tracking
- New Relic for performance monitoring
- CloudWatch/Stackdriver for logs
- Pingdom for uptime monitoring

## Backup Strategy

- Regular database backups
- Store in separate location
- Test restore procedures
- Document recovery process
