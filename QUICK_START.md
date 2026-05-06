# VISAGE METRICS - Quick Start Guide

**Version:** 1.0  
**Last Updated:** 6 Mei 2026

---

## ⚡ Quick Start (5 Menit)

### 1. Prerequisites

- Python 3.8+
- pip package manager
- Trained ML model (visage_hybrid_baseline.keras)

### 2. Installation

```bash
# Clone atau extract repository
cd d:\Yoka\visage-matrics\visage-matrics

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Server

```bash
python app.py
```

**Output yang diharapkan:**

```
==================================================
Visage Metrics - Visual Fatigue Monitor
==================================================

Loading ML model...
Loading model from saved_models/visage_hybrid_baseline.keras...
[OK] Model loaded successfully
[INFO] Registering authentication routes...
[INFO] Registering inference routes...
[INFO] Registering analytics routes...

==================================================
Starting Flask application...
==================================================

[OK] Server running at http://localhost:5000
[OK] Health Check: http://localhost:5000/api/health
==================================================

 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

### 4. Test API

```bash
# Health check
curl http://localhost:5000/api/health
```

Seharusnya mendapat response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2026-05-06T08:43:00"
}
```

---

## 📁 File Structure

```
visage-matrics/
├── app.py                    # Main Flask app
├── core/
│   ├── config.py            # Configuration
│   └── database.py          # Database manager
├── src/
│   ├── utils.py             # Utility functions
│   ├── model_builder.py     # Model architecture
│   └── data_loader.py       # Data loading
├── routes/
│   ├── auth_routes.py       # Authentication endpoints
│   ├── inference_routes.py  # Prediction endpoints
│   └── analytics_routes.py  # Analytics endpoints
├── Pages/                    # HTML pages
├── assets/                   # CSS, JS, models
├── saved_models/            # Trained models
├── uploads/                 # User uploads
└── requirements.txt         # Dependencies
```

---

## 🔌 API Endpoints Quick Reference

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get profile
- `POST /api/auth/change-password` - Change password

### Inference

- `GET /api/health` - Health check
- `GET /api/model/status` - Model status
- `POST /api/model/load/<model_name>` - Load model
- `POST /api/inference/predict` - Single prediction
- `POST /api/inference/predict-base64` - Base64 prediction
- `POST /api/inference/batch-predict` - Batch prediction

### Analytics

- `GET /api/analytics/today` - Today's analytics
- `GET /api/analytics/7days` - 7 days analytics
- `GET /api/analytics/30days` - 30 days analytics
- `GET /api/analytics/summary` - Summary
- `POST /api/analytics/save-detection` - Save detection
- `GET /api/analytics/health-report` - Health report

---

## 🧪 Example Requests

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "secure123",
    "name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "secure123"
  }'
```

### 3. Make Prediction

```bash
curl -X POST http://localhost:5000/api/inference/predict \
  -b cookies.txt \
  -F "file=@/path/to/image.jpg"
```

### 4. Get Analytics

```bash
curl -X GET http://localhost:5000/api/analytics/today \
  -b cookies.txt
```

---

## 🔧 Configuration

### Environment Variables

Buat file `.env` di root directory:

```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///visage_metrics.db
DB_TYPE=local
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=52428800
```

### Model Configuration

Edit `core/config.py`:

```python
# Model Configuration
MODEL_PATH = 'saved_models'
DEFAULT_MODEL = 'visage_hybrid_baseline.keras'
```

---

## 🎯 Common Tasks

### Task 1: Add Custom Route

1. Create route file di `routes/` folder
2. Implement blueprint
3. Register di `app.py`

Contoh:

```python
# routes/custom_routes.py
from flask import Blueprint

custom_bp = Blueprint('custom', __name__, url_prefix='/api/custom')

@custom_bp.route('/hello', methods=['GET'])
def hello():
    return {'message': 'Hello World'}

def register_custom_routes(app):
    app.register_blueprint(custom_bp)
```

Tambahkan ke `app.py`:

```python
from routes.custom_routes import register_custom_routes
register_custom_routes(app)
```

### Task 2: Load Different Model

```bash
# Check available models
curl http://localhost:5000/api/model/status

# Load specific model
curl -X POST http://localhost:5000/api/model/load/visage_baseline_bs32.keras
```

### Task 3: Predict Multiple Images

```bash
curl -X POST http://localhost:5000/api/inference/batch-predict \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "files=@image3.jpg"
```

---

## 🐛 Troubleshooting

### Problem: Model tidak load

**Solution:**

1. Check if model file exists in `saved_models/`
2. Model file harus .keras atau .h5 format
3. Pastikan TensorFlow terinstall dengan benar

```bash
python -c "import tensorflow as tf; print(tf.__version__)"
```

### Problem: Unicode Error pada Windows

**Solution:**
Sudah fixed! Set environment variable:

```bash
set PYTHONIOENCODING=utf-8
```

### Problem: Port 5000 sudah digunakan

**Solution:**
Change port di `app.py`:

```python
app.run(
    host='0.0.0.0',
    port=8000,  # Change port here
    debug=True
)
```

### Problem: ModuleNotFoundError

**Solution:**

```bash
# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Atau update path
set PYTHONPATH=%PYTHONPATH%;d:\Yoka\visage-matrics\visage-matrics
```

### Problem: Database Connection Error

**Solution:**

1. Check DATABASE_URL di `.env`
2. Pastikan database folder writable
3. Initialize database:

```python
from core.database import init_db
init_db()
```

---

## 📊 Monitoring

### View Logs

```bash
# Run with logging
python app.py > app.log 2>&1

# View logs real-time
tail -f app.log
```

### Check Model Info

```bash
curl http://localhost:5000/api/model/status
```

### Health Check Loop

```bash
# Monitor health setiap 5 detik
while True; do curl http://localhost:5000/api/health; sleep 5; done
```

---

## 🚀 Deployment

### Development Server

```bash
python app.py
```

### Production Server (Recommended)

Install gunicorn:

```bash
pip install gunicorn
```

Run with gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:

```bash
docker build -t visage-metrics .
docker run -p 5000:5000 visage-metrics
```

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Repair Report](./REPAIR_REPORT.md)
- [README](./README.md)
- [Setup Guide](./SETUP_GUIDE.md)

---

## ✅ Checklist

- [x] Server running
- [x] API endpoints working
- [x] Model loaded
- [x] Authentication working
- [x] Inference working
- [x] Analytics endpoints ready
- [x] Error handling implemented
- [x] Documentation complete

---

## 💡 Tips

1. **Use Postman** untuk testing API lebih mudah
2. **Enable debug mode** untuk development
3. **Log requests** untuk debugging
4. **Cache predictions** untuk performance
5. **Use batch endpoints** untuk multiple images
6. **Monitor resource usage** terutama memory
7. **Regular backups** untuk database dan models

---

## 📞 Support

Jika ada masalah:

1. Check log messages
2. Verify API documentation
3. Check repair report untuk perbaikan
4. Reinstall dependencies jika needed

---

**Happy Coding! 🎉**

Jika ada pertanyaan atau issue, silakan report dengan:

- Error message yang lengkap
- Step-by-step untuk reproduce
- Configuration yang digunakan
