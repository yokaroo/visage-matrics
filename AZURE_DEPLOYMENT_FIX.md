# Azure App Service Deployment Fix

## Masalah yang Terjadi

### Error Original

```
TypeError: Flask.__call__() missing 1 required positional argument: 'start_response'
ModuleNotFoundError: No module named 'uvicorn'
```

### Root Cause

1. **Flask adalah aplikasi WSGI** (Web Server Gateway Interface) - synchronous
2. **Uvicorn adalah server ASGI** (Asynchronous Server Gateway Interface) - untuk aplikasi async
3. Azure App Service menggunakan command:
   ```
   gunicorn --bind=0.0.0.0 --timeout 600 -k uvicorn.workers.UvicornWorker app:app
   ```
4. Worker `uvicorn.workers.UvicornWorker` **tidak kompatibel** dengan Flask WSGI

## Solusi yang Diterapkan

### 1. ✅ Perbaikan requirements.txt

- **Dihapus**: `uvicorn>=0.23.0`
- **Alasan**: Uvicorn tidak diperlukan karena Flask tidak membutuhkannya

### 2. ✅ Membuat file startup.txt

```bash
# File: startup.txt
gunicorn --bind=0.0.0.0 --timeout 600 --workers 4 app:app
```

- **Tanpa** flag `-k uvicorn.workers.UvicornWorker`
- Gunicorn akan menggunakan default sync worker (compatible dengan WSGI)

### 3. ✅ Struktur Konfigurasi

```
visage-matrics/
├── app.py
├── requirements.txt    (uvicorn dihapus)
├── startup.txt        (command deployment baru)
└── ...
```

## Cara Update di Azure Portal

Setelah push code, Azure akan membaca `startup.txt` otomatis. Atau, manual update:

### Option 1: Via Azure Portal (Recommended)

1. Buka **Azure Portal** → App Service `visage-matrics`
2. Masuk ke **Settings** → **Configuration**
3. Di tab **General settings**, update **Startup Command**:
   ```
   gunicorn --bind=0.0.0.0 --timeout 600 --workers 4 app:app
   ```
4. Klik **Save** → **Continue**

### Option 2: Via startup.txt (Automatic)

- File `startup.txt` sudah ada di root project
- Azure akan membacanya otomatis saat deployment

## Penjelasan Parameter

```bash
gunicorn --bind=0.0.0.0 --timeout 600 --workers 4 app:app
         ↑                ↑              ↑        ↑
         |                |              |        |
    Bind semua   Timeout 10 menit    4 workers  Flask app
     interface      per request
```

## Testing Lokal

```bash
# Sebelum deploy ke Azure, test locally:
gunicorn --bind=0.0.0.0 --timeout 600 --workers 4 app:app

# Atau dengan reload untuk development:
gunicorn --bind=0.0.0.0 --timeout 600 --workers 1 --reload app:app
```

## Perbedaan WSGI vs ASGI

| Aspek                   | WSGI                      | ASGI                   |
| ----------------------- | ------------------------- | ---------------------- |
| **Framework Contoh**    | Flask, Django             | FastAPI, Starlette     |
| **Tipe**                | Synchronous               | Asynchronous           |
| **Server**              | Gunicorn, uWSGI           | Uvicorn, Hypercorn     |
| **Callback**            | `environ, start_response` | `scope, receive, send` |
| **Cocok dengan Flask?** | ✅ Ya                     | ❌ Tidak               |

## Next Steps

1. ✅ Push perubahan ke git:

   ```bash
   git add requirements.txt startup.txt
   git commit -m "Fix: Remove uvicorn and add startup.txt for Flask deployment"
   git push origin main
   ```

2. ✅ Restart App Service di Azure portal
   - Application → Restart

3. ✅ Monitor logs:
   - Diagnostics → Log stream

## Catatan Penting

- **Jangan menambahkan uvicorn kembali** ke requirements.txt - hanya untuk aplikasi FastAPI/ASGI
- Jika ingin upgrade ke FastAPI + ASGI, maka:
  - Ubah `app.py` ke FastAPI
  - Gunakan `uvicorn` sebagai server
  - Ubah startup command ke: `uvicorn app:app --host 0.0.0.0`

---

**Status**: ✅ Ready to deploy
**Last Updated**: 2026-05-12
